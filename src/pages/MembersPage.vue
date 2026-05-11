<script setup lang="ts">
import { computed, h, ref } from "vue";
import { useRouter } from "vue-router";
import {
  NButton,
  NCard,
  NDataTable,
  NInput,
  NSpace,
  NTag,
  useMessage,
  type DataTableColumns,
} from "naive-ui";
import { useAdminStore } from "@/stores/admin";
import type { FamilyMember } from "@/types/models";

const adminStore = useAdminStore();
const router = useRouter();
const message = useMessage();
const keyword = ref("");

const roleOptions = [
  { label: "管理员", value: "admin" },
  { label: "协管成员", value: "manager" },
  { label: "家族成员", value: "member" },
];

const statusOptions = [
  { label: "启用中", value: "active" },
  { label: "已停用", value: "inactive" },
];

const familyMembers = computed(() => {
  const familyId = adminStore.currentFamily?.id;
  const normalizedKeyword = keyword.value.trim().toLowerCase();

  return adminStore.members.filter((item) => {
    if (familyId && item.familyId !== familyId) {
      return false;
    }

    if (!normalizedKeyword) {
      return true;
    }

    return [item.nickname, item.phone, item.role, item.status]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(normalizedKeyword));
  });
});

function roleLabel(role: string) {
  return roleOptions.find((item) => item.value === role)?.label ?? role;
}

function statusLabel(status: string) {
  return statusOptions.find((item) => item.value === status)?.label ?? status;
}

async function remove(memberId: string) {
  try {
    await adminStore.deleteMember(memberId);
    message.success("成员已删除");
  } catch (error) {
    message.error(error instanceof Error ? error.message : "成员删除失败");
  }
}

const columns = computed<DataTableColumns<FamilyMember>>(() => [
  {
    title: "成员",
    key: "nickname",
    render: (row) =>
      h("div", { class: "space-y-1" }, [
        h("p", { class: "text-sm font-semibold text-white" }, row.nickname),
        h("p", { class: "text-xs text-white/40" }, row.phone || "未登记手机号"),
      ]),
  },
  {
    title: "角色",
    key: "role",
    render: (row) =>
      h(NTag, { round: true, type: row.role === "admin" ? "primary" : "default" }, { default: () => roleLabel(row.role) }),
  },
  {
    title: "状态",
    key: "status",
    render: (row) =>
      h(NTag, { round: true, type: row.status === "active" ? "success" : "warning" }, { default: () => statusLabel(row.status) }),
  },
  {
    title: "加入时间",
    key: "joinedAt",
    render: (row) => new Date(row.joinedAt).toLocaleDateString("zh-CN"),
  },
  {
    title: "操作",
    key: "actions",
    width: 140,
    render: (row) =>
      h(NSpace, { size: 8 }, {
        default: () => [
          h(
            NButton,
            { text: true, type: "primary", onClick: () => void router.push(`/members/${row.id}/edit`) },
            { default: () => "编辑" },
          ),
          h(
            NButton,
            { text: true, type: "error", onClick: () => void remove(row.id) },
            { default: () => "删除" },
          ),
        ],
      }),
  },
]);
</script>

<template>
  <div class="space-y-6">
    <NCard class="admin-toolbar-card" :bordered="false" title="成员列表">
      <div class="admin-list-toolbar mb-4">
        <NInput v-model:value="keyword" class="admin-list-search" clearable placeholder="按昵称、手机号、角色或状态搜索" />
        <div class="admin-list-actions">
          <NButton type="primary" @click="router.push('/members/new')">新增成员</NButton>
        </div>
      </div>

      <NDataTable :columns="columns" :data="familyMembers" :bordered="false" />
    </NCard>
  </div>
</template>
