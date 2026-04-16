<script setup lang="ts">
import { computed, h, reactive, ref } from "vue";
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
  NTag,
  useMessage,
  type DataTableColumns,
} from "naive-ui";
import type { FamilyGroup } from "@/types/models";
import { useAdminStore } from "@/stores/admin";

const adminStore = useAdminStore();
const message = useMessage();
const drawerVisible = ref(false);
const editingId = ref("");

const form = reactive({
  name: "",
  code: "",
  inviteCode: "",
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
  form.code = family?.code ?? "";
  form.inviteCode = family?.inviteCode ?? "";
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

async function submit() {
  const payload = {
    name: form.name.trim(),
    code: form.code.trim(),
    inviteCode: form.inviteCode.trim(),
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
      message.success("家族空间已创建");
    }

    drawerVisible.value = false;
  } catch (error) {
    message.error(error instanceof Error ? error.message : "家族保存失败");
  }
}

const columns = computed<DataTableColumns<FamilyGroup>>(() => [
  {
    title: "家族名称",
    key: "name",
    render: (row) =>
      h("div", { class: "space-y-1" }, [
        h("p", { class: "text-sm font-semibold text-white" }, row.name),
        h("p", { class: "text-xs text-white/40" }, row.description || "暂无简介"),
      ]),
  },
  {
    title: "家族编码",
    key: "code",
    render: (row) => h(NTag, { round: true, bordered: false }, { default: () => row.code }),
  },
  {
    title: "邀请码",
    key: "inviteCode",
  },
  {
    title: "已拜阈值",
    key: "visitRangeMeters",
    render: (row) => `${row.visitRangeMeters} 米`,
  },
  {
    title: "下次祭拜",
    key: "upcomingWorshipAt",
    render: (row) => formatWorshipTime(row.upcomingWorshipAt),
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
    <NCard class="admin-toolbar-card" :bordered="false" title="家族列表">
      <div class="mb-4 flex flex-wrap items-center gap-3">
        <NButton type="primary" @click="openCreateDrawer">新增家族</NButton>
        <NTag round type="info">{{ adminStore.source === "api" ? "已连接接口" : "当前为演示数据" }}</NTag>
      </div>

      <NDataTable
        :columns="columns"
        :data="adminStore.families"
        :bordered="false"
        :single-line="false"
      />
    </NCard>

    <NDrawer v-model:show="drawerVisible" :width="460" placement="right">
      <NDrawerContent :title="editingId ? '编辑家族' : '新增家族'" closable>
        <NForm label-placement="top">
          <NFormItem label="家族名称">
            <NInput v-model:value="form.name" placeholder="请输入家族名称" />
          </NFormItem>
          <NFormItem label="家族编码">
            <NInput v-model:value="form.code" placeholder="例如 lin-family" />
          </NFormItem>
          <NFormItem label="邀请码">
            <NInput v-model:value="form.inviteCode" placeholder="例如 KINTRACE-LIN" />
          </NFormItem>
          <NFormItem label="下次祭拜时间">
            <NDatePicker
              v-model:value="form.upcomingWorshipAt"
              type="datetime"
              clearable
              style="width: 100%;"
            />
          </NFormItem>
          <NFormItem label="已拜有效范围（米）">
            <NInputNumber v-model:value="form.visitRangeMeters" :show-button="false" :min="10" style="width: 100%;" />
          </NFormItem>
          <NFormItem label="家族简介">
            <NInput
              v-model:value="form.description"
              type="textarea"
              :autosize="{ minRows: 3, maxRows: 4 }"
              placeholder="用于说明家族背景或管理范围"
            />
          </NFormItem>
        </NForm>

        <template #footer>
          <div class="flex justify-end gap-3">
            <NButton tertiary @click="drawerVisible = false">取消</NButton>
            <NButton type="primary" @click="submit">
              {{ editingId ? "保存设置" : "创建家族" }}
            </NButton>
          </div>
        </template>
      </NDrawerContent>
    </NDrawer>
  </div>
</template>
