<script setup lang="ts">
import { computed, reactive, watch } from "vue";
import { useRouter } from "vue-router";
import {
  NButton,
  NCard,
  NDatePicker,
  NForm,
  NFormItem,
  NInput,
  NInputNumber,
  NSelect,
  useMessage,
} from "naive-ui";
import { useAdminStore } from "@/stores/admin";

const adminStore = useAdminStore();
const router = useRouter();
const message = useMessage();

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
  familyId: "",
  year: new Date().getFullYear(),
  name: `${new Date().getFullYear()} 清明祭扫`,
  range: [new Date().getTime(), new Date().getTime()] as [number, number],
  status: "draft" as "draft" | "active" | "closed",
});

watch(
  () => [adminStore.currentFamily?.id, adminStore.families.length] as const,
  () => {
    form.familyId = adminStore.currentFamily?.id ?? adminStore.families[0]?.id ?? "";
  },
  { immediate: true },
);

async function submit() {
  if (!form.familyId) {
    message.warning("请先选择家族");
    return;
  }

  try {
    await adminStore.createTask({
      familyId: form.familyId,
      year: Number(form.year),
      name: form.name.trim(),
      startDate: new Date(form.range[0]).toISOString().slice(0, 10),
      endDate: new Date(form.range[1]).toISOString().slice(0, 10),
      status: form.status,
    });
    message.success("年度任务已创建");
    void router.push("/tasks");
  } catch (error) {
    message.error(error instanceof Error ? error.message : "任务创建失败");
  }
}
</script>

<template>
  <div class="space-y-6">
    <NCard class="admin-toolbar-card" :bordered="false" title="新增年度任务">
      <template #header-extra>
        <NButton tertiary @click="router.push('/tasks')">返回列表</NButton>
      </template>

      <NForm label-placement="top">
        <div class="grid gap-4 md:grid-cols-2">
          <NFormItem label="所属家族">
            <NSelect v-model:value="form.familyId" :options="familyOptions" />
          </NFormItem>
          <NFormItem label="年份">
            <NInputNumber v-model:value="form.year" :show-button="false" style="width: 100%;" />
          </NFormItem>
          <NFormItem label="任务名称">
            <NInput v-model:value="form.name" placeholder="例如 2027 清明祭扫" />
          </NFormItem>
          <NFormItem label="任务状态">
            <NSelect v-model:value="form.status" :options="statusOptions" />
          </NFormItem>
          <NFormItem class="md:col-span-2" label="任务时间范围">
            <NDatePicker
              v-model:value="form.range"
              type="daterange"
              clearable
              style="width: 100%;"
            />
          </NFormItem>
        </div>
      </NForm>

      <div class="flex justify-end gap-3">
        <NButton tertiary @click="router.push('/tasks')">取消</NButton>
        <NButton type="primary" @click="submit">创建任务</NButton>
      </div>
    </NCard>
  </div>
</template>
