<script setup lang="ts">
import { computed, h, reactive, ref } from "vue";
import QRCode from "qrcode";
import {
  NButton,
  NCard,
  NDataTable,
  NDatePicker,
  NDrawer,
  NDrawerContent,
  NForm,
  NFormItem,
  NInput,
  NInputNumber,
  NModal,
  NTag,
  useMessage,
  type DataTableColumns,
} from "naive-ui";
import { buildFamilyJoinUrl, getH5BaseUrl } from "@/lib/h5-links";
import { useAdminStore } from "@/stores/admin";
import type { FamilyGroup } from "@/types/models";

const adminStore = useAdminStore();
const message = useMessage();
const drawerVisible = ref(false);
const editingId = ref("");
const h5BaseUrl = getH5BaseUrl();
const qrModalVisible = ref(false);
const qrLoading = ref(false);
const qrDataUrl = ref("");
const qrFamily = ref<FamilyGroup | null>(null);

const form = reactive({
  name: "",
  description: "",
  upcomingWorshipAt: null as number | null,
  visitRangeMeters: 300,
});

function formatWorshipTime(value?: string | null) {
  if (!value) {
    return "未设置";
  }

  return new Date(value).toLocaleString("zh-CN");
}

function fillForm(family?: FamilyGroup | null) {
  form.name = family?.name ?? "";
  form.description = family?.description ?? "";
  form.upcomingWorshipAt = family?.upcomingWorshipAt ? new Date(family.upcomingWorshipAt).getTime() : null;
  form.visitRangeMeters = family?.visitRangeMeters ?? 300;
}

function openCreateDrawer() {
  editingId.value = "";
  fillForm(null);
  drawerVisible.value = true;
}

function openEditDrawer(familyId: string) {
  const family = adminStore.families.find((item) => item.id === familyId);
  if (!family) {
    return;
  }

  editingId.value = family.id;
  fillForm(family);
  drawerVisible.value = true;
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

async function submit() {
  const payload = {
    name: form.name.trim(),
    description: form.description.trim() || null,
    upcomingWorshipAt: form.upcomingWorshipAt ? new Date(form.upcomingWorshipAt).toISOString() : null,
    visitRangeMeters: Number(form.visitRangeMeters) || 300,
  };

  try {
    if (editingId.value) {
      await adminStore.updateFamily(editingId.value, payload);
      message.success("家族设置已更新");
    } else {
      await adminStore.createFamily(payload);
      message.success("家族空间已创建，系统已自动生成邀请 key");
    }

    drawerVisible.value = false;
  } catch (error) {
    message.error(error instanceof Error ? error.message : "保存失败");
  }
}

const editingFamily = computed(() => adminStore.families.find((item) => item.id === editingId.value) ?? null);

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
            onClick: () => copyText(buildFamilyJoinUrl(row.inviteCode), "家族邀请链接已复制"),
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
          onClick: () => openEditDrawer(row.id),
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
        <NButton type="primary" @click="openCreateDrawer">新建家族</NButton>
        <NTag round type="info">{{ adminStore.source === "api" ? "已连接 API" : "模拟数据" }}</NTag>
      </div>

      <NDataTable
        :columns="columns"
        :data="adminStore.families"
        :bordered="false"
        :single-line="false"
      />
    </NCard>

    <NDrawer v-model:show="drawerVisible" :width="460" placement="right">
      <NDrawerContent :title="editingId ? '编辑家族' : '创建家族'" closable>
        <NForm label-placement="top">
          <NFormItem label="家族名称">
            <NInput v-model:value="form.name" placeholder="请输入家族名称" />
          </NFormItem>
          <NFormItem label="下次祭扫时间">
            <NDatePicker
              v-model:value="form.upcomingWorshipAt"
              type="datetime"
              clearable
              style="width: 100%;"
            />
          </NFormItem>
          <NFormItem label="祭扫范围（米）">
            <NInputNumber v-model:value="form.visitRangeMeters" :show-button="false" :min="10" style="width: 100%;" />
          </NFormItem>
          <NFormItem label="描述">
            <NInput
              v-model:value="form.description"
              type="textarea"
              :autosize="{ minRows: 3, maxRows: 4 }"
              placeholder="描述家族空间或运营范围"
            />
          </NFormItem>
        </NForm>

        <div class="rounded-2xl border border-white/8 bg-white/[0.02] px-4 py-3 text-sm leading-6 text-white/54">
          {{ editingFamily ? "当前邀请 key：" : "创建后系统会自动生成邀请 key：" }}
          <span class="text-white/78">
            {{ editingFamily?.inviteCode || "将按家族名称生成，例如 chenshi_237" }}
          </span>
        </div>
        <div class="mt-3 rounded-2xl border border-white/8 bg-white/[0.02] px-4 py-3 text-sm leading-6 text-white/54">
          {{ editingFamily ? "当前邀请链接：" : "创建后可直接复制邀请链接或生成二维码分享：" }}
          <span class="text-white/78">
            {{ editingFamily ? buildFamilyJoinUrl(editingFamily.inviteCode) : `${h5BaseUrl.replace(/\/$/, "")}/join?inviteCode=...` }}
          </span>
        </div>

        <template #footer>
          <div class="flex justify-end gap-3">
            <NButton tertiary @click="drawerVisible = false">取消</NButton>
            <NButton type="primary" @click="submit">
              {{ editingId ? "保存" : "创建" }}
            </NButton>
          </div>
        </template>
      </NDrawerContent>
    </NDrawer>

    <NModal v-model:show="qrModalVisible" preset="card" style="width: 420px;" title="家族分享二维码">
      <div v-if="qrFamily" class="space-y-4">
        <div class="rounded-2xl border border-white/8 bg-white/[0.02] p-4 text-center">
          <p class="text-base font-semibold text-white">{{ qrFamily.name }}</p>
          <p class="mt-2 text-sm leading-6 text-white/56">
            成员扫码后会进入当前家族，并通过手机号完成注册或登录。
          </p>
          <div class="mt-4 flex min-h-[280px] items-center justify-center rounded-2xl bg-white p-4">
            <div v-if="qrLoading" class="text-sm text-slate-500">二维码生成中...</div>
            <img v-else-if="qrDataUrl" :src="qrDataUrl" alt="家族分享二维码" class="h-[280px] w-[280px]" />
          </div>
        </div>

        <div class="rounded-2xl border border-white/8 bg-white/[0.02] px-4 py-3 text-sm leading-6 text-white/54">
          邀请 key：
          <span class="text-white/78">{{ qrFamily.inviteCode }}</span>
        </div>
        <div class="rounded-2xl border border-white/8 bg-white/[0.02] px-4 py-3 text-sm leading-6 text-white/54">
          邀请链接：
          <span class="text-white/78">{{ buildFamilyJoinUrl(qrFamily.inviteCode) }}</span>
        </div>

        <NButton block type="primary" @click="copyText(buildFamilyJoinUrl(qrFamily.inviteCode), '家族邀请链接已复制')">
          复制邀请链接
        </NButton>
      </div>
    </NModal>
  </div>
</template>
