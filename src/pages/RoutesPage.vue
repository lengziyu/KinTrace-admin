<script setup lang="ts">
import { computed, h, reactive, ref } from "vue";
import {
  NButton,
  NCard,
  NDataTable,
  NDrawer,
  NDrawerContent,
  NForm,
  NFormItem,
  NInput,
  NSelect,
  NSpace,
  useMessage,
  type DataTableColumns,
} from "naive-ui";
import { useAdminStore } from "@/stores/admin";
import type { RoutePlan } from "@/types/models";

const adminStore = useAdminStore();
const message = useMessage();
const drawerVisible = ref(false);
const editingId = ref("");
const keyword = ref("");

const form = reactive({
  familyId: "",
  name: "",
  description: "",
  createdByMemberId: "",
  tombIds: [] as string[],
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

const filteredRoutes = computed(() => {
  const familyId = adminStore.currentFamily?.id;
  const normalizedKeyword = keyword.value.trim().toLowerCase();

  return adminStore.routes.filter((item) => {
    if (familyId && item.familyId !== familyId) {
      return false;
    }

    if (!normalizedKeyword) {
      return true;
    }

    return [item.name, item.description, ...resolvePointNames(item.tombIds)]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(normalizedKeyword));
  });
});

function resetForm() {
  form.familyId = adminStore.currentFamily?.id ?? adminStore.families[0]?.id ?? "";
  form.name = "";
  form.description = "";
  form.createdByMemberId = adminStore.members.find((item) => item.familyId === form.familyId)?.id ?? "";
  form.tombIds = [];
  editingId.value = "";
}

function openCreateDrawer() {
  resetForm();
  drawerVisible.value = true;
}

function openEditDrawer(routeId: string) {
  const route = adminStore.routes.find((item) => item.id === routeId);
  if (!route) {
    return;
  }

  editingId.value = route.id;
  form.familyId = route.familyId;
  form.name = route.name;
  form.description = route.description ?? "";
  form.createdByMemberId = route.createdByMemberId ?? "";
  form.tombIds = [...route.tombIds];
  drawerVisible.value = true;
}

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
  };

  if (!payload.familyId || !payload.name || payload.tombIds.length === 0) {
    message.warning("请先填写路线名称，并至少选择一个点位");
    return;
  }

  try {
    if (editingId.value) {
      await adminStore.updateRoute(editingId.value, payload);
      message.success("路线模板已更新");
    } else {
      await adminStore.createRoute(payload);
      message.success("路线模板已创建");
    }

    drawerVisible.value = false;
    resetForm();
  } catch (error) {
    message.error(error instanceof Error ? error.message : "路线保存失败");
  }
}

async function remove(routeId: string) {
  try {
    await adminStore.deleteRoute(routeId);
    message.success("路线模板已删除");
  } catch (error) {
    message.error(error instanceof Error ? error.message : "路线删除失败");
  }
}

const columns = computed<DataTableColumns<RoutePlan>>(() => [
  {
    title: "路线名称",
    key: "name",
    render: (row) =>
      h("div", { class: "space-y-1" }, [
        h("p", { class: "text-sm font-semibold text-white" }, row.name),
        h("p", { class: "text-xs text-white/42" }, row.description || "暂无路线说明"),
      ]),
  },
  {
    title: "点位顺序",
    key: "tombIds",
    render: (row) => resolvePointNames(row.tombIds).join(" -> ") || "暂无点位顺序",
  },
  {
    title: "创建成员",
    key: "createdByMemberId",
    render: (row) => adminStore.members.find((item) => item.id === row.createdByMemberId)?.nickname || "未指定",
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
            { text: true, type: "primary", onClick: () => openEditDrawer(row.id) },
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

resetForm();
</script>

<template>
  <div class="space-y-6">
    <NCard class="admin-toolbar-card" :bordered="false" title="路线模板列表">
      <div class="mb-4 flex flex-wrap items-center gap-3">
        <NInput v-model:value="keyword" clearable placeholder="按路线名称、说明或点位名称搜索" />
        <NButton type="primary" @click="openCreateDrawer">新增路线模板</NButton>
      </div>

      <NDataTable :columns="columns" :data="filteredRoutes" :bordered="false" :single-line="false" />
    </NCard>

    <NDrawer v-model:show="drawerVisible" :width="460" placement="right">
      <NDrawerContent :title="editingId ? '编辑路线模板' : '新增路线模板'" closable>
        <NForm label-placement="top">
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
          <NFormItem label="点位顺序">
            <NSelect
              v-model:value="form.tombIds"
              multiple
              :options="availablePoints"
              placeholder="按顺序选择点位"
            />
          </NFormItem>
        </NForm>

        <div class="admin-surface-muted p-4 text-sm text-white/52">
          当前顺序：
          <span class="text-white/82">{{ resolvePointNames(form.tombIds).join(" -> ") || "尚未选择点位" }}</span>
        </div>

        <template #footer>
          <div class="flex justify-end gap-3">
            <NButton tertiary @click="drawerVisible = false">取消</NButton>
            <NButton type="primary" @click="submit">
              {{ editingId ? "保存路线" : "创建路线" }}
            </NButton>
          </div>
        </template>
      </NDrawerContent>
    </NDrawer>
  </div>
</template>
