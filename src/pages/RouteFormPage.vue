<script setup lang="ts">
import { computed, reactive, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import {
  NButton,
  NCard,
  NForm,
  NFormItem,
  NInput,
  NInputNumber,
  NSelect,
  NSwitch,
  useMessage,
} from "naive-ui";
import { useAdminStore } from "@/stores/admin";
import type { RoutePlan } from "@/types/models";

const adminStore = useAdminStore();
const route = useRoute();
const router = useRouter();
const message = useMessage();

const form = reactive({
  familyId: "",
  name: "",
  description: "",
  createdByMemberId: "",
  tombIds: [] as string[],
  isPrimary: false,
  morningTombCount: 0,
  afternoonTombCount: 0,
});

const familyOptions = computed(() =>
  adminStore.families.map((item) => ({
    label: item.name,
    value: item.id,
  })),
);

const availablePoints = computed(() =>
  adminStore.tombs
    .filter((item) => item.familyId === (form.familyId || adminStore.currentFamily?.id))
    .map((item) => ({
      label: item.name,
      value: item.id,
    })),
);

const availableMembers = computed(() =>
  adminStore.members
    .filter((item) => item.familyId === (form.familyId || adminStore.currentFamily?.id))
    .map((item) => ({
      label: item.nickname,
      value: item.id,
    })),
);

const isEdit = computed(() => route.path.endsWith("/edit"));
const editingId = computed(() => String(route.params.id ?? ""));
const targetRoute = computed(() => adminStore.routes.find((item) => item.id === editingId.value) ?? null);
const maxAfternoonCount = computed(() => Math.max(form.tombIds.length - form.morningTombCount, 0));

function clampScheduleCounts() {
  const total = form.tombIds.length;
  form.morningTombCount = Math.max(0, Math.min(total, Number(form.morningTombCount) || 0));
  const remain = Math.max(total - form.morningTombCount, 0);
  form.afternoonTombCount = Math.max(0, Math.min(remain, Number(form.afternoonTombCount) || 0));
}

function fillForm(routePlan?: RoutePlan | null) {
  const defaultFamilyId = adminStore.currentFamily?.id ?? adminStore.families[0]?.id ?? "";
  form.familyId = routePlan?.familyId ?? defaultFamilyId;
  form.name = routePlan?.name ?? "";
  form.description = routePlan?.description ?? "";
  form.createdByMemberId = routePlan?.createdByMemberId ?? adminStore.members.find((item) => item.familyId === form.familyId)?.id ?? "";
  form.tombIds = routePlan?.tombIds ? [...routePlan.tombIds] : [];
  form.isPrimary = routePlan?.isPrimary ?? false;
  form.morningTombCount = routePlan?.morningTombCount ?? 0;
  form.afternoonTombCount = routePlan?.afternoonTombCount ?? 0;
  clampScheduleCounts();
}

watch(
  () => [isEdit.value, targetRoute.value, adminStore.currentFamily?.id, adminStore.families.length, adminStore.members.length] as const,
  ([editing, routePlan]) => {
    if (editing) {
      if (routePlan) {
        fillForm(routePlan);
      }
      return;
    }

    fillForm(null);
  },
  { immediate: true },
);

watch(
  () => [form.tombIds, form.morningTombCount] as const,
  () => {
    clampScheduleCounts();
  },
  { deep: true },
);

function resolvePointNames(tombIds: string[]) {
  return tombIds
    .map((id) => adminStore.tombs.find((item) => item.id === id)?.name)
    .filter((item): item is string => Boolean(item));
}

async function submit() {
  const payload = {
    familyId: form.familyId || adminStore.currentFamily?.id || "",
    name: form.name.trim(),
    description: form.description.trim() || null,
    tombIds: form.tombIds,
    createdByMemberId: form.createdByMemberId || null,
    isPrimary: form.isPrimary,
    morningTombCount: Number(form.morningTombCount) || 0,
    afternoonTombCount: Number(form.afternoonTombCount) || 0,
  };

  if (!payload.familyId || !payload.name || payload.tombIds.length === 0) {
    message.warning("请先填写路线名称，并至少选择一个点位");
    return;
  }

  try {
    if (isEdit.value) {
      if (!editingId.value) {
        message.warning("缺少路线 ID");
        return;
      }
      await adminStore.updateRoute(editingId.value, payload);
      message.success("路线模板已更新");
    } else {
      await adminStore.createRoute(payload);
      message.success("路线模板已创建");
    }

    void router.push("/routes");
  } catch (error) {
    message.error(error instanceof Error ? error.message : "路线保存失败");
  }
}
</script>

<template>
  <div class="space-y-6">
    <NCard class="admin-toolbar-card" :bordered="false" :title="isEdit ? '编辑路线模板' : '新增路线模板'">
      <template #header-extra>
        <NButton tertiary @click="router.push('/routes')">返回列表</NButton>
      </template>

      <NForm label-placement="top">
        <div class="grid gap-4 md:grid-cols-2">
          <NFormItem label="所属家族">
            <NSelect v-model:value="form.familyId" :options="familyOptions" />
          </NFormItem>
          <NFormItem label="路线名称">
            <NInput v-model:value="form.name" placeholder="例如：清明主线" />
          </NFormItem>
          <NFormItem label="创建成员">
            <NSelect v-model:value="form.createdByMemberId" :options="availableMembers" clearable />
          </NFormItem>
          <NFormItem label="路线说明">
            <NInput v-model:value="form.description" placeholder="例如：先主点位再支系点位，减少往返" />
          </NFormItem>
          <NFormItem class="md:col-span-2" label="点位顺序">
            <NSelect
              v-model:value="form.tombIds"
              multiple
              :options="availablePoints"
              placeholder="按顺序选择点位"
            />
          </NFormItem>
          <NFormItem label="设为主线路">
            <NSwitch v-model:value="form.isPrimary" />
          </NFormItem>
          <NFormItem label="上午数量">
            <NInputNumber
              v-model:value="form.morningTombCount"
              :show-button="false"
              :min="0"
              :max="form.tombIds.length"
              style="width: 100%;"
            />
          </NFormItem>
          <NFormItem label="下午数量">
            <NInputNumber
              v-model:value="form.afternoonTombCount"
              :show-button="false"
              :min="0"
              :max="maxAfternoonCount"
              style="width: 100%;"
            />
          </NFormItem>
        </div>
      </NForm>

      <div class="admin-surface-muted mb-4 p-4 text-sm text-white/52">
        当前顺序：
        <span class="text-white/82">{{ resolvePointNames(form.tombIds).join(" -> ") || "尚未选择点位" }}</span>
      </div>

      <div class="flex justify-end gap-3">
        <NButton tertiary @click="router.push('/routes')">取消</NButton>
        <NButton type="primary" @click="submit">
          {{ isEdit ? "保存路线" : "创建路线" }}
        </NButton>
      </div>
    </NCard>
  </div>
</template>
