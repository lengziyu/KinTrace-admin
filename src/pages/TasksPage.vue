<script setup lang="ts">
import { computed, h } from "vue";
import { useRouter } from "vue-router";
import {
  NButton,
  NCard,
  NDataTable,
  NTag,
  useMessage,
  type DataTableColumns,
} from "naive-ui";
import { useAdminStore } from "@/stores/admin";
import type { WorshipTask } from "@/types/models";

const adminStore = useAdminStore();
const router = useRouter();
const message = useMessage();

const statusOptions = [
  { label: "草稿", value: "draft" },
  { label: "进行中", value: "active" },
  { label: "已关闭", value: "closed" },
];

const filteredTasks = computed(() => {
  const familyId = adminStore.currentFamily?.id;
  return adminStore.tasks.filter((task) => !familyId || task.familyId === familyId);
});

async function remove(taskId: string) {
  try {
    await adminStore.deleteTask(taskId);
    message.success("任务已删除");
  } catch (error) {
    message.error(error instanceof Error ? error.message : "任务删除失败");
  }
}

const columns = computed<DataTableColumns<WorshipTask>>(() => [
  {
    title: "任务名称",
    key: "name",
  },
  {
    title: "年份",
    key: "year",
  },
  {
    title: "周期",
    key: "range",
    render: (row) => `${row.startDate} 至 ${row.endDate}`,
  },
  {
    title: "状态",
    key: "status",
    render: (row) =>
      h(
        NTag,
        {
          round: true,
          type: row.status === "active" ? "primary" : row.status === "closed" ? "success" : "default",
        },
        { default: () => statusOptions.find((item) => item.value === row.status)?.label ?? row.status },
      ),
  },
  {
    title: "操作",
    key: "actions",
    width: 120,
    render: (row) =>
      h(
        NButton,
        { text: true, type: "error", onClick: () => void remove(row.id) },
        { default: () => "删除" },
      ),
  },
]);
</script>

<template>
  <div class="space-y-6">
    <NCard class="admin-toolbar-card" :bordered="false" title="年度任务列表">
      <div class="mb-4 flex flex-wrap items-center gap-3">
        <NButton type="primary" @click="router.push('/tasks/new')">新增年度任务</NButton>
        <NTag round type="warning">创建新任务时会重置当前家族的祭扫状态</NTag>
      </div>

      <NDataTable :columns="columns" :data="filteredTasks" :bordered="false" />
    </NCard>
  </div>
</template>
