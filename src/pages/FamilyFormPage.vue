<script setup lang="ts">
import { computed, reactive, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import {
  NButton,
  NCard,
  NDatePicker,
  NForm,
  NFormItem,
  NInput,
  NInputNumber,
  useMessage,
} from "naive-ui";
import { useAdminStore } from "@/stores/admin";
import type { FamilyGroup } from "@/types/models";

const adminStore = useAdminStore();
const route = useRoute();
const router = useRouter();
const message = useMessage();

const form = reactive({
  name: "",
  code: "",
  inviteCode: "",
  description: "",
  upcomingWorshipAt: null as number | null,
  visitRangeMeters: 300,
});

const isEdit = computed(() => route.path.endsWith("/edit"));
const editingId = computed(() => String(route.params.id ?? ""));
const targetFamily = computed(() => adminStore.families.find((item) => item.id === editingId.value) ?? null);

function fillForm(family?: FamilyGroup | null) {
  form.name = family?.name ?? "";
  form.code = family?.code ?? "";
  form.inviteCode = family?.inviteCode ?? "";
  form.description = family?.description ?? "";
  form.upcomingWorshipAt = family?.upcomingWorshipAt ? new Date(family.upcomingWorshipAt).getTime() : null;
  form.visitRangeMeters = family?.visitRangeMeters ?? 300;
}

watch(
  () => [isEdit.value, targetFamily.value] as const,
  ([editing, family]) => {
    if (editing) {
      if (family) {
        fillForm(family);
      }
      return;
    }

    fillForm(null);
  },
  { immediate: true },
);

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
    if (isEdit.value) {
      if (!editingId.value) {
        message.warning("缺少家族 ID");
        return;
      }
      await adminStore.updateFamily(editingId.value, payload);
      message.success("家族设置已更新");
    } else {
      await adminStore.createFamily(payload);
      message.success("家族空间已创建");
    }

    void router.push("/families");
  } catch (error) {
    message.error(error instanceof Error ? error.message : "家族保存失败");
  }
}
</script>

<template>
  <div class="space-y-6">
    <NCard class="admin-toolbar-card" :bordered="false" :title="isEdit ? '编辑家族' : '新增家族'">
      <template #header-extra>
        <NButton tertiary @click="router.push('/families')">返回列表</NButton>
      </template>

      <NForm label-placement="top">
        <div class="grid gap-4 md:grid-cols-2">
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
          <NFormItem class="md:col-span-2" label="家族简介">
            <NInput
              v-model:value="form.description"
              type="textarea"
              :autosize="{ minRows: 3, maxRows: 4 }"
              placeholder="用于说明家族背景或管理范围"
            />
          </NFormItem>
        </div>
      </NForm>

      <div class="flex justify-end gap-3">
        <NButton tertiary @click="router.push('/families')">取消</NButton>
        <NButton type="primary" @click="submit">
          {{ isEdit ? "保存设置" : "创建家族" }}
        </NButton>
      </div>
    </NCard>
  </div>
</template>
