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
  NSelect,
  NTag,
  useMessage,
  type DataTableColumns,
} from "naive-ui";
import { useAdminStore } from "@/stores/admin";
import type { WorshipTask } from "@/types/models";

const adminStore = useAdminStore();
const message = useMessage();
const drawerVisible = ref(false);

const familyOptions = computed(() =>
  adminStore.families.map((item) => ({
    label: item.name,
    value: item.id,
  })),
);

const statusOptions = [
  { label: "草稿", value: "draft" },
  { label: "进行中", value: "active" },
  { label: "已关闭", value: "closed" },
];

const form = reactive({
  familyId: adminStore.currentFamily?.id ?? adminStore.families[0]?.id ?? "",
  year: new Date().getFullYear(),
  name: `${new Date().getFullYear()} 清明祭扫`,
  range: [new Date().getTime(), new Date().getTime()] as [number, number],
  status: "draft" as "draft" | "active" | "closed",
});

const filteredTasks = computed(() => {
  const familyId = adminStore.currentFamily?.id;
  return adminStore.tasks.filter((task) => !familyId || task.familyId === familyId);
});

function openCreateDrawer() {
  form.familyId = adminStore.currentFamily?.id ?? adminStore.families[0]?.id ?? "";
  form.year = new Date().getFullYear();
  form.name = `${form.year} 清明祭扫`;
  form.range = [Date.now(), Date.now()];
  form.status = "draft";
  drawerVisible.value = true;
}

async function submit() {
  try {
    await adminStore.createTask({
      familyId: form.familyId,
      year: Number(form.year),
      name: form.name.trim(),
      startDate: new Date(form.range[0]).toISOString().slice(0, 10),
      endDate: new Date(form.range[1]).toISOString().slice(0, 10),
      status: form.status,
    });
    drawerVisible.value = false;
    message.success("年度任务已创建");
  } catch (error) {
    message.error(error instanceof Error ? error.message : "任务创建失败");
  }
}

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
        <NButton type="primary" @click="openCreateDrawer">新增年度任务</NButton>
        <NTag round type="warning">创建新任务时会重置当前家族的祭扫状态</NTag>
      </div>

      <NDataTable :columns="columns" :data="filteredTasks" :bordered="false" />
    </NCard>

    <NDrawer v-model:show="drawerVisible" :width="420" placement="right">
      <NDrawerContent title="新增年度任务" closable>
        <NForm label-placement="top">
          <NFormItem label="所属家族">
            <NSelect v-model:value="form.familyId" :options="familyOptions" />
          </NFormItem>
          <NFormItem label="年份">
            <NInputNumber v-model:value="form.year" :show-button="false" style="width: 100%;" />
          </NFormItem>
          <NFormItem label="任务名称">
            <NInput v-model:value="form.name" placeholder="例如 2027 清明祭扫" />
          </NFormItem>
          <NFormItem label="任务时间范围">
            <NDatePicker
              v-model:value="form.range"
              type="daterange"
              clearable
              style="width: 100%;"
            />
          </NFormItem>
          <NFormItem label="任务状态">
            <NSelect v-model:value="form.status" :options="statusOptions" />
          </NFormItem>
        </NForm>

        <template #footer>
          <div class="flex justify-end gap-3">
            <NButton tertiary @click="drawerVisible = false">取消</NButton>
            <NButton type="primary" @click="submit">创建任务</NButton>
          </div>
        </template>
      </NDrawerContent>
    </NDrawer>
  </div>
</template>
