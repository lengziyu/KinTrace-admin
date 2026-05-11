<script setup lang="ts">
import { computed, h, ref } from "vue";
import { NButton, NCard, NDataTable, NInput, NSelect, NSpace, NTag, useMessage, type DataTableColumns } from "naive-ui";
import { useAdminStore } from "@/stores/admin";
import type { MemorialMessage } from "@/types/models";

const adminStore = useAdminStore();
const message = useMessage();
const keyword = ref("");
const statusFilter = ref<"all" | "pending" | "approved" | "rejected">("all");

const statusOptions = [
  { label: "全部状态", value: "all" },
  { label: "待审核", value: "pending" },
  { label: "已通过", value: "approved" },
  { label: "已驳回", value: "rejected" },
];

const filteredMessages = computed(() => {
  const familyId = adminStore.currentFamily?.id;
  const normalizedKeyword = keyword.value.trim().toLowerCase();

  return adminStore.messages.filter((item) => {
    if (familyId && item.familyId !== familyId) {
      return false;
    }

    if (statusFilter.value !== "all" && item.status !== statusFilter.value) {
      return false;
    }

    if (!normalizedKeyword) {
      return true;
    }

    const pointName = adminStore.tombs.find((tomb) => tomb.id === item.tombId)?.name ?? "";
    const memberName = adminStore.members.find((member) => member.id === item.memberId)?.nickname ?? "";

    return [item.content, pointName, memberName]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(normalizedKeyword));
  });
});

function statusLabel(status: string) {
  return (
    {
      pending: "待审核",
      approved: "已通过",
      rejected: "已驳回",
    }[status] ?? status
  );
}

function pointName(messageItem: MemorialMessage) {
  return adminStore.tombs.find((item) => item.id === messageItem.tombId)?.name ?? `点位 ${messageItem.tombId.slice(-4)}`;
}

function memberName(messageItem: MemorialMessage) {
  return adminStore.members.find((item) => item.id === messageItem.memberId)?.nickname ?? `成员 ${messageItem.memberId.slice(-4)}`;
}

async function review(id: string, status: "approved" | "rejected") {
  try {
    await adminStore.reviewMessage(id, status);
    message.success(status === "approved" ? "留言已通过" : "留言已驳回");
  } catch (error) {
    message.error(error instanceof Error ? error.message : "留言审核失败");
  }
}

const columns = computed<DataTableColumns<MemorialMessage>>(() => [
  {
    title: "留言内容",
    key: "content",
    render: (row) =>
      h("div", { class: "max-w-[460px] space-y-1" }, [
        h("p", { class: "text-sm leading-7 text-white/88" }, row.content),
        h("p", { class: "text-xs text-white/36" }, `${memberName(row)} · ${pointName(row)}`),
      ]),
  },
  {
    title: "状态",
    key: "status",
    render: (row) =>
      h(
        NTag,
        {
          round: true,
          type: row.status === "pending" ? "warning" : row.status === "approved" ? "success" : "error",
        },
        { default: () => statusLabel(row.status) },
      ),
  },
  {
    title: "提交时间",
    key: "createdAt",
    render: (row) => new Date(row.createdAt).toLocaleString("zh-CN"),
  },
  {
    title: "操作",
    key: "actions",
    width: 160,
    render: (row) =>
      h(NSpace, { size: 8 }, {
        default: () => [
          h(
            NButton,
            { text: true, type: "primary", disabled: row.status === "approved", onClick: () => void review(row.id, "approved") },
            { default: () => "通过" },
          ),
          h(
            NButton,
            { text: true, type: "error", disabled: row.status === "rejected", onClick: () => void review(row.id, "rejected") },
            { default: () => "驳回" },
          ),
        ],
      }),
  },
]);
</script>

<template>
  <div class="space-y-6">
    <div class="admin-page-head">
      <div>
        <h2 class="admin-page-title">留言审核</h2>
        <p class="admin-page-desc">
          审核家族成员写给各个祭扫点位的祈福留言，保证 H5 端展示内容庄重、清晰并适合公开呈现。
        </p>
      </div>
    </div>

    <NCard class="admin-toolbar-card" :bordered="false" title="筛选与审核">
      <div class="admin-list-toolbar mb-4">
        <NInput
          v-model:value="keyword"
          class="admin-list-search"
          clearable
          placeholder="按留言内容、成员昵称或点位名称搜索"
        />
        <NSelect v-model:value="statusFilter" class="admin-list-filter" :options="statusOptions" />
      </div>

      <NDataTable :columns="columns" :data="filteredMessages" :bordered="false" />
    </NCard>
  </div>
</template>
