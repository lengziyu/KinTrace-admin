<script setup lang="ts">
import { computed, reactive, ref, watch } from "vue";
import {
  NButton,
  NCard,
  NForm,
  NFormItem,
  NGrid,
  NGridItem,
  NImage,
  NInput,
  NInputNumber,
  NSpace,
  NTag,
  NUpload,
  useMessage,
  type UploadCustomRequestOptions,
} from "naive-ui";
import BrandLogo from "@/components/BrandLogo.vue";
import { uploadImage } from "@/lib/http";
import { getPointMarkerIcon, pointMarkerOptions, type PointMarkerPresetKey } from "@/lib/point-marker";
import { useAdminStore } from "@/stores/admin";
import { useAuthStore } from "@/stores/auth";
import { useBrandStore } from "@/stores/brand";

const authStore = useAuthStore();
const adminStore = useAdminStore();
const brandStore = useBrandStore();
const message = useMessage();

const logoUploading = ref(false);
const iconUploading = ref(false);
const pointIconUploading = ref(false);

const brandForm = reactive({
  appNameZh: brandStore.settings.appNameZh,
  appNameEn: brandStore.settings.appNameEn,
  logoUrl: brandStore.settings.logoUrl,
  iconUrl: brandStore.settings.iconUrl,
  pointMarkerPreset: brandStore.settings.pointMarkerPreset as PointMarkerPresetKey,
  pointMarkerIconUrl: brandStore.settings.pointMarkerIconUrl,
});

const familySettingForm = reactive({
  visitRangeMeters: adminStore.currentFamily?.visitRangeMeters ?? 300,
});

const pointMarkerPreview = computed(() =>
  getPointMarkerIcon(brandForm.pointMarkerPreset, brandForm.pointMarkerIconUrl),
);

const roleCards = computed(() => [
  {
    title: "超级管理员",
    desc: "负责全局平台与家族空间管理，可以维护家族列表、品牌资源、系统设置与跨家族数据。",
    enabled: authStore.profile?.role === "super_admin",
  },
  {
    title: "家族管理员",
    desc: "负责所属家族的成员、祭扫点位、年度任务、路线模板和留言审核，不显示全局家族管理入口。",
    enabled: authStore.profile?.role === "family_admin",
  },
]);

const aboutModules = [
  "家族空间、成员、祭扫点位、年度任务、留言与路线模板的后台维护",
  "家族祭拜时间设置并同步到 H5 首页倒计时",
  "已拜定位阈值设置与位置校验",
  "点位图片上传、默认 SVG 封面与 H5 图片展示",
];

const roadmap = [
  "更细粒度的管理员权限与操作审计",
  "位置共享升级为 WebSocket 实时推送",
  "点位媒体资料压缩、分类与批量整理",
  "家谱树、通知中心与代祭业务扩展",
];

function syncBrandForm() {
  brandForm.appNameZh = brandStore.settings.appNameZh;
  brandForm.appNameEn = brandStore.settings.appNameEn;
  brandForm.logoUrl = brandStore.settings.logoUrl;
  brandForm.iconUrl = brandStore.settings.iconUrl;
  brandForm.pointMarkerPreset = brandStore.settings.pointMarkerPreset;
  brandForm.pointMarkerIconUrl = brandStore.settings.pointMarkerIconUrl;
}

function syncFamilySettingForm() {
  familySettingForm.visitRangeMeters = adminStore.currentFamily?.visitRangeMeters ?? 300;
}

watch(
  () => adminStore.currentFamily?.id,
  () => {
    syncFamilySettingForm();
  },
  { immediate: true },
);

watch(
  () => brandStore.settings,
  () => {
    syncBrandForm();
  },
  { deep: true },
);

async function submitBrandSettings() {
  await brandStore.saveSettings({
    appNameZh: brandForm.appNameZh.trim() || "宗迹",
    appNameEn: brandForm.appNameEn.trim() || "KinTrace Admin",
    logoUrl: brandForm.logoUrl.trim(),
    iconUrl: brandForm.iconUrl.trim() || "/kintrace-logo.svg",
    pointMarkerPreset: brandForm.pointMarkerPreset,
    pointMarkerIconUrl: brandForm.pointMarkerIconUrl.trim(),
  });
  message.success("系统品牌与点位图标设置已保存");
}

async function resetBrandSettings() {
  await brandStore.resetSettings();
  syncBrandForm();
  message.success("系统设置已恢复默认");
}

async function saveFamilySettings() {
  if (!adminStore.currentFamily) {
    message.warning("当前还没有可设置的家族");
    return;
  }

  await adminStore.updateFamily(adminStore.currentFamily.id, {
    visitRangeMeters: Number(familySettingForm.visitRangeMeters) || 300,
  });
  syncFamilySettingForm();
  message.success("当前家族规则已保存");
}

async function uploadAsset(
  options: UploadCustomRequestOptions,
  target: "logo" | "icon" | "point",
) {
  const rawFile = options.file.file;
  if (!(rawFile instanceof File)) {
    options.onError();
    return;
  }

  const loadingRef =
    target === "logo"
      ? logoUploading
      : target === "icon"
        ? iconUploading
        : pointIconUploading;

  loadingRef.value = true;
  try {
    const uploaded = await uploadImage(rawFile);
    if (target === "logo") {
      brandForm.logoUrl = uploaded.url;
    } else if (target === "icon") {
      brandForm.iconUrl = uploaded.url;
    } else {
      brandForm.pointMarkerIconUrl = uploaded.url;
    }
    options.onFinish();
    message.success("图标资源上传成功");
  } catch (error) {
    options.onError();
    message.error(error instanceof Error ? error.message : "资源上传失败");
  } finally {
    loadingRef.value = false;
  }
}
</script>

<template>
  <div class="space-y-5">
    <div class="admin-page-head">
      <div>
        <h2 class="admin-page-title">系统设置</h2>
        <p class="admin-page-desc">
          统一维护后台品牌资源、点位图标、权限说明、当前家族规则与产品信息。关于宗迹也已经并入这里，不再单独占一个菜单。
        </p>
      </div>
      <NTag round type="info">平台设置</NTag>
    </div>

    <NGrid cols="1 xl:3" responsive="screen" :x-gap="12" :y-gap="12">
      <NGridItem span="2">
        <NCard class="admin-toolbar-card" :bordered="false" title="品牌与点位图标设置">
          <div class="grid gap-5 xl:grid-cols-[1.2fr_340px]">
            <NForm label-placement="top">
              <NGrid cols="1 xl:2" responsive="screen" :x-gap="12">
                <NGridItem>
                  <NFormItem label="中文名称">
                    <NInput v-model:value="brandForm.appNameZh" placeholder="例如：宗迹" />
                  </NFormItem>
                </NGridItem>
                <NGridItem>
                  <NFormItem label="英文名称">
                    <NInput v-model:value="brandForm.appNameEn" placeholder="例如：KinTrace Admin" />
                  </NFormItem>
                </NGridItem>
              </NGrid>

              <NFormItem label="Logo 地址">
                <NInput v-model:value="brandForm.logoUrl" placeholder="支持本地 /uploads/... 或完整图片地址，留空则使用默认 Logo" />
              </NFormItem>

              <NFormItem label="浏览器 Icon 地址">
                <NInput v-model:value="brandForm.iconUrl" placeholder="建议使用 1:1 的 SVG 或 PNG 图标地址" />
              </NFormItem>

              <div class="mb-5 flex flex-wrap gap-3">
                <NUpload :default-upload="false" :show-file-list="false" :custom-request="(options) => uploadAsset(options, 'logo')">
                  <NButton :loading="logoUploading" tertiary>上传 Logo</NButton>
                </NUpload>
                <NUpload :default-upload="false" :show-file-list="false" :custom-request="(options) => uploadAsset(options, 'icon')">
                  <NButton :loading="iconUploading" tertiary>上传浏览器 Icon</NButton>
                </NUpload>
              </div>

              <NFormItem label="点位图标预设">
                <div class="grid gap-3 sm:grid-cols-2">
                  <button
                    v-for="item in pointMarkerOptions"
                    :key="item.value"
                    type="button"
                    class="admin-surface-muted flex items-center gap-3 px-3 py-3 text-left transition"
                    :class="brandForm.pointMarkerPreset === item.value ? 'ring-1 ring-blue-500/60' : ''"
                    @click="brandForm.pointMarkerPreset = item.value"
                  >
                    <img :src="getPointMarkerIcon(item.value)" alt="" class="h-10 w-10 rounded-xl" />
                    <div>
                      <p class="text-sm font-semibold text-white">{{ item.label }}</p>
                      <p class="text-xs text-white/46">用于 H5 地图上的点位标识</p>
                    </div>
                  </button>
                </div>
              </NFormItem>

              <NFormItem label="自定义点位图标地址">
                <NInput v-model:value="brandForm.pointMarkerIconUrl" placeholder="留空则使用上方预设，填写后会优先使用自定义图标" />
              </NFormItem>

              <div class="mb-5">
                <NUpload :default-upload="false" :show-file-list="false" :custom-request="(options) => uploadAsset(options, 'point')">
                  <NButton :loading="pointIconUploading" tertiary>上传自定义点位图标</NButton>
                </NUpload>
              </div>

              <NSpace>
                <NButton type="primary" @click="submitBrandSettings">保存设置</NButton>
                <NButton tertiary @click="resetBrandSettings">恢复默认</NButton>
              </NSpace>
            </NForm>

            <div class="space-y-3">
              <div class="admin-surface-muted p-4">
                <p class="text-xs uppercase tracking-[0.28em] text-white/35">Logo Preview</p>
                <div class="mt-4">
                  <BrandLogo />
                </div>
              </div>

              <div class="admin-surface-muted p-4">
                <p class="text-xs uppercase tracking-[0.28em] text-white/35">Icon Preview</p>
                <div class="mt-4 flex items-center gap-3">
                  <NImage
                    width="48"
                    height="48"
                    object-fit="cover"
                    preview-disabled
                    :src="brandStore.displayIcon"
                    class="rounded-xl"
                  />
                  <p class="text-sm text-white/56">保存后会同步更新浏览器标签页图标。</p>
                </div>
              </div>

              <div class="admin-surface-muted p-4">
                <p class="text-xs uppercase tracking-[0.28em] text-white/35">Map Marker Preview</p>
                <div class="mt-4 rounded-2xl border border-white/8 bg-[radial-gradient(circle_at_top_right,rgba(37,99,235,0.16),transparent_40%),linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.02))] p-4">
                  <div class="flex items-start justify-between">
                    <div>
                      <p class="text-xs text-white/40">H5 地图点位效果</p>
                      <p class="mt-1 text-sm text-white/72">名称与图标同时展示</p>
                    </div>
                    <NTag round size="small" type="info">地图标识</NTag>
                  </div>
                  <div class="mt-6 flex justify-center">
                    <div class="flex items-center gap-2 rounded-full border border-white/10 bg-[#111827] px-3 py-2 shadow-[0_14px_30px_rgba(15,23,42,.24)]">
                      <img :src="pointMarkerPreview" alt="" class="h-6 w-6 rounded-lg" />
                      <span class="text-sm font-semibold text-white">始祖纪念点</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </NCard>
      </NGridItem>

      <NGridItem>
        <NCard class="admin-toolbar-card h-full" :bordered="false" title="当前家族规则">
          <NForm label-placement="top">
            <NFormItem label="工作家族">
              <NInput :value="adminStore.currentFamily?.name || '未选择'" readonly />
            </NFormItem>
            <NFormItem label="已拜有效范围（米）">
              <NInputNumber
                v-model:value="familySettingForm.visitRangeMeters"
                :show-button="false"
                :min="10"
                style="width: 100%;"
              />
            </NFormItem>
            <NButton type="primary" @click="saveFamilySettings">保存当前家族规则</NButton>
          </NForm>

          <div class="mt-4 space-y-3">
            <div
              v-for="item in roleCards"
              :key="item.title"
              class="admin-surface-muted p-4"
            >
              <div class="flex items-center justify-between gap-3">
                <p class="text-sm font-semibold text-white">{{ item.title }}</p>
                <NTag round :type="item.enabled ? 'success' : 'default'">
                  {{ item.enabled ? "当前角色" : "可分配" }}
                </NTag>
              </div>
              <p class="mt-2 text-sm leading-7 text-white/52">{{ item.desc }}</p>
            </div>
          </div>
        </NCard>
      </NGridItem>
    </NGrid>

    <NGrid cols="1 xl:2" responsive="screen" :x-gap="12" :y-gap="12">
      <NGridItem>
        <NCard class="admin-toolbar-card" :bordered="false" title="关于宗迹">
          <div class="space-y-3">
            <div
              v-for="item in aboutModules"
              :key="item"
              class="admin-surface-muted px-4 py-3 text-sm text-white/60"
            >
              {{ item }}
            </div>
          </div>
        </NCard>
      </NGridItem>

      <NGridItem>
        <NCard class="admin-toolbar-card" :bordered="false" title="后续优化">
          <div class="space-y-3">
            <div
              v-for="item in roadmap"
              :key="item"
              class="admin-surface-muted px-4 py-3 text-sm text-white/60"
            >
              {{ item }}
            </div>
          </div>
        </NCard>
      </NGridItem>
    </NGrid>
  </div>
</template>
