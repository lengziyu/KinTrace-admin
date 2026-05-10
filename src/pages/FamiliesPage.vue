<script setup lang="ts">
import { computed, h, ref } from "vue";
import { useRouter } from "vue-router";
import QRCode from "qrcode";
import {
  NButton,
  NCard,
  NDataTable,
  NModal,
  NTag,
  useMessage,
  type DataTableColumns,
} from "naive-ui";
import { buildFamilyJoinUrl, getH5BaseUrl } from "@/lib/h5-links";
import { useAdminStore } from "@/stores/admin";
import type { FamilyGroup } from "@/types/models";

const adminStore = useAdminStore();
const router = useRouter();
const message = useMessage();
const h5BaseUrl = getH5BaseUrl();
const qrModalVisible = ref(false);
const qrLoading = ref(false);
const qrDataUrl = ref("");
const qrFamily = ref<FamilyGroup | null>(null);

function formatWorshipTime(value?: string | null) {
  if (!value) {
    return "未设置";
  }

  return new Date(value).toLocaleString("zh-CN");
}

async function copyText(value: string, successText: string) {
  try {
    await navigator.clipboard.writeText(value);
    message.success(successText);
  } catch {
    message.error("复制失败");
  }
}

async function openQrModal(family: FamilyGroup) {
  qrFamily.value = family;
  qrDataUrl.value = "";
  qrModalVisible.value = true;
  qrLoading.value = true;

  try {
    qrDataUrl.value = await QRCode.toDataURL(buildFamilyJoinUrl(family.inviteCode), {
      width: 320,
      margin: 1,
      color: {
        dark: "#111827",
        light: "#ffffff",
      },
    });
  } catch {
    message.error("二维码生成失败");
  } finally {
    qrLoading.value = false;
  }
}

const columns = computed<DataTableColumns<FamilyGroup>>(() => [
  {
    title: "家族",
    key: "name",
    render: (row) =>
      h("div", { class: "space-y-1" }, [
        h("p", { class: "text-sm font-semibold text-white" }, row.name),
        h("p", { class: "text-xs text-white/40" }, row.description || "暂无描述"),
      ]),
  },
  {
    title: "家族编码",
    key: "code",
    render: (row) => h(NTag, { round: true, bordered: false }, { default: () => row.code }),
  },
  {
    title: "邀请 key",
    key: "inviteCode",
    render: (row) => h("span", { class: "text-sm text-white/78" }, row.inviteCode),
  },
  {
    title: "祭扫范围",
    key: "visitRangeMeters",
    render: (row) => `${row.visitRangeMeters} 米`,
  },
  {
    title: "下次祭扫",
    key: "upcomingWorshipAt",
    render: (row) => formatWorshipTime(row.upcomingWorshipAt),
  },
  {
    title: "分享",
    key: "entry",
    width: 240,
    render: (row) =>
      h("div", { class: "flex flex-wrap gap-2" }, [
        h(
          NButton,
          {
            size: "small",
            tertiary: true,
            type: "info",
            onClick: () => void copyText(buildFamilyJoinUrl(row.inviteCode), "家族邀请链接已复制"),
          },
          { default: () => "邀请链接" },
        ),
        h(
          NButton,
          {
            size: "small",
            tertiary: true,
            type: "warning",
            onClick: () => void openQrModal(row),
          },
          { default: () => "分享二维码" },
        ),
      ]),
  },
  {
    title: "操作",
    key: "actions",
    width: 120,
    render: (row) =>
      h(
        NButton,
        {
          text: true,
          type: "primary",
          onClick: () => void router.push(`/families/${row.id}/edit`),
        },
        { default: () => "编辑" },
      ),
  },
]);
</script>

<template>
  <div class="space-y-6">
    <NCard class="admin-toolbar-card" :bordered="false" title="邀请规则">
      <div class="grid gap-3 lg:grid-cols-[1.35fr_0.65fr]">
        <div class="admin-surface-muted p-4 text-sm leading-7 text-white/64">
          现在 H5 统一通过邀请链接进入。家族创建后会自动生成一组新的家族编码和邀请 key，
          邀请 key 采用“拼音 + 3 位随机数”的形式，例如 `chenshi_237`，并自动避开 `888` 这类重复数值。
          家族成员通过邀请链接进入后，会使用手机号作为唯一登录标识。
        </div>
        <div class="admin-surface-muted p-4">
          <p class="text-xs uppercase tracking-[0.24em] text-white/35">H5 基础地址</p>
          <p class="mt-3 text-sm font-medium text-white">{{ h5BaseUrl }}</p>
          <p class="mt-2 text-xs leading-6 text-white/44">
            如果 H5 部署地址发生变化，可以通过 `VITE_H5_BASE_URL` 修改。
          </p>
        </div>
      </div>
    </NCard>

    <NCard class="admin-toolbar-card" :bordered="false" title="家族列表">
      <div class="mb-4 flex flex-wrap items-center gap-3">
        <NButton type="primary" @click="router.push('/families/new')">新增家族</NButton>
        <NTag round type="info">{{ adminStore.source === "api" ? "已连接 API" : "模拟数据" }}</NTag>
      </div>

      <NDataTable
        :columns="columns"
        :data="adminStore.families"
        :bordered="false"
        :single-line="false"
      />
    </NCard>

    <NModal
      v-model:show="qrModalVisible"
      preset="card"
      class="max-w-[420px]"
      :title="qrFamily ? `${qrFamily.name} 分享二维码` : '分享二维码'"
    >
      <div class="space-y-4 text-center">
        <div class="admin-surface-muted flex min-h-[340px] items-center justify-center rounded-2xl p-4">
          <template v-if="qrLoading">
            <span class="text-sm text-white/52">正在生成二维码...</span>
          </template>
          <template v-else-if="qrDataUrl">
            <img :src="qrDataUrl" alt="家族分享二维码" class="mx-auto w-full max-w-[320px] rounded-2xl bg-white p-4" />
          </template>
          <template v-else>
            <span class="text-sm text-white/52">二维码暂时不可用</span>
          </template>
        </div>

        <p class="text-xs leading-6 text-white/46">
          打开后会进入当前家族的 H5 邀请页，适合直接分享给家族成员。
        </p>

        <div class="flex justify-end gap-3">
          <NButton tertiary @click="qrModalVisible = false">关闭</NButton>
          <NButton
            type="primary"
            :disabled="!qrFamily"
            @click="qrFamily && copyText(buildFamilyJoinUrl(qrFamily.inviteCode), '邀请链接已复制')"
          >
            复制邀请链接
          </NButton>
        </div>
      </div>
    </NModal>
  </div>
</template>
