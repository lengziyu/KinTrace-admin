#!/usr/bin/env bash
set -euo pipefail

# =========================================
# ZJ 一键更新脚本（KinTrace + KinTrace-admin）
# =========================================
# 用法:
#   bash deploy-zj.sh
#   BRANCH=main bash deploy-zj.sh
#   SKIP_DB=1 bash deploy-zj.sh
#
# 说明:
# - 默认会更新两个仓库代码并重新构建
# - 默认会执行 prisma generate + db push
# - 默认会重启 PM2 的 zj-server 并 reload nginx

BRANCH="${BRANCH:-main}"
SKIP_DB="${SKIP_DB:-0}"

APP_ROOT="/opt/apps"
KINTRACE_DIR="${APP_ROOT}/KinTrace"
ADMIN_DIR="${APP_ROOT}/KinTrace-admin"

H5_DIST_DIR="${KINTRACE_DIR}/apps/h5/dist"
ADMIN_DIST_DIR="${ADMIN_DIR}/dist"

# 你线上 nginx 对应的静态目录（如有不同，只改这里）
H5_WEB_ROOT="${APP_ROOT}/www/zj.lengziyu.cn"
ADMIN_WEB_ROOT="${APP_ROOT}/www/zj-admin.lengziyu.cn"

PM2_NAME="zj-server"
PM2_CWD="${KINTRACE_DIR}"
SERVER_ENTRY_CANDIDATE_1="${KINTRACE_DIR}/apps/server/dist/main.js"
SERVER_ENTRY_CANDIDATE_2="${KINTRACE_DIR}/apps/server/dist/src/main.js"

DOMAIN_H5="zj.lengziyu.cn"
DOMAIN_ADMIN="zj-admin.lengziyu.cn"
API_LOCAL_CHECK_URL="http://127.0.0.1:3012/api/docs"

need_cmd() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "[ERROR] 缺少命令: $1"
    exit 1
  fi
}

sync_repo() {
  local repo_dir="$1"
  local branch="$2"

  echo "[INFO] 更新仓库: ${repo_dir} (${branch})"
  cd "${repo_dir}"
  git fetch --all --prune

  local current_branch
  current_branch="$(git rev-parse --abbrev-ref HEAD)"
  if [[ "${current_branch}" != "${branch}" ]]; then
    git checkout "${branch}"
  fi

  git pull --ff-only origin "${branch}"
}

deploy_static() {
  local src_dir="$1"
  local target_dir="$2"
  local label="$3"

  echo "[INFO] 发布静态资源: ${label}"
  if [[ ! -d "${src_dir}" ]]; then
    echo "[ERROR] 构建产物不存在: ${src_dir}"
    exit 1
  fi

  mkdir -p "${target_dir}"
  rm -rf "${target_dir:?}/"*
  cp -a "${src_dir}/." "${target_dir}/"
}

start_server_pm2() {
  local entry=""

  if [[ -f "${SERVER_ENTRY_CANDIDATE_1}" ]]; then
    entry="${SERVER_ENTRY_CANDIDATE_1}"
  elif [[ -f "${SERVER_ENTRY_CANDIDATE_2}" ]]; then
    entry="${SERVER_ENTRY_CANDIDATE_2}"
  else
    echo "[ERROR] 未找到 server 启动文件:"
    echo "  - ${SERVER_ENTRY_CANDIDATE_1}"
    echo "  - ${SERVER_ENTRY_CANDIDATE_2}"
    exit 1
  fi

  echo "[INFO] 重启 PM2 服务: ${PM2_NAME}"
  if pm2 describe "${PM2_NAME}" >/dev/null 2>&1; then
    pm2 delete "${PM2_NAME}" || true
  fi
  pm2 start "${entry}" --name "${PM2_NAME}" --cwd "${PM2_CWD}" --time --update-env
  pm2 save
}

reload_nginx() {
  echo "[INFO] 校验并重载 nginx"
  nginx -t
  systemctl reload nginx
}

health_check() {
  echo "[INFO] 线上检查"
  curl -I "http://${DOMAIN_H5}" | head -n 1 || true
  curl -I "http://${DOMAIN_ADMIN}" | head -n 1 || true
  curl -I "${API_LOCAL_CHECK_URL}" | head -n 1 || true
}

main() {
  need_cmd git
  need_cmd pnpm
  need_cmd pm2
  need_cmd nginx
  need_cmd curl

  [[ -d "${KINTRACE_DIR}" ]] || { echo "[ERROR] 目录不存在: ${KINTRACE_DIR}"; exit 1; }
  [[ -d "${ADMIN_DIR}" ]] || { echo "[ERROR] 目录不存在: ${ADMIN_DIR}"; exit 1; }

  sync_repo "${KINTRACE_DIR}" "${BRANCH}"
  sync_repo "${ADMIN_DIR}" "${BRANCH}"

  echo "[INFO] 构建 KinTrace (server + h5)"
  cd "${KINTRACE_DIR}"
  pnpm install --no-frozen-lockfile
  cd "${KINTRACE_DIR}/apps/server"
  pnpm exec prisma generate
  if [[ "${SKIP_DB}" != "1" ]]; then
    pnpm exec prisma db push
  else
    echo "[WARN] 跳过数据库变更 (SKIP_DB=1)"
  fi

  cd "${KINTRACE_DIR}"
  pnpm --filter @kintrace/server build
  pnpm --filter @kintrace/h5 build

  echo "[INFO] 构建 KinTrace-admin"
  cd "${ADMIN_DIR}"
  pnpm install --no-frozen-lockfile
  pnpm build

  deploy_static "${H5_DIST_DIR}" "${H5_WEB_ROOT}" "H5"
  deploy_static "${ADMIN_DIST_DIR}" "${ADMIN_WEB_ROOT}" "Admin"

  start_server_pm2
  reload_nginx
  health_check

  echo "[DONE] 更新完成。"
}

main "$@"
