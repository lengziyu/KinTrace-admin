<script setup lang="ts">
import { computed, h, ref } from "vue";
import { useRouter } from "vue-router";
import {
  NButton,
  NCard,
  NDataTable,
  NImage,
  NInput,
  NSpace,
  useMessage,
  type DataTableColumns,
} from "naive-ui";
import TombCover from "@/components/TombCover.vue";
import { useAdminStore } from "@/stores/admin";
import type { TombPoint } from "@/types/models";

const adminStore = useAdminStore();
const router = useRouter();
const message = useMessage();
const keyword = ref("");

const filteredPoints = computed(() => {
  const familyId = adminStore.currentFamily?.id;
  const normalizedKeyword = keyword.value.trim().toLowerCase();

  return adminStore.tombs.filter((point) => {
    if (familyId && point.familyId !== familyId) {
      return false;
    }

    if (!normalizedKeyword) {
      return true;
    }

    return [point.name, point.titleName, point.branchName, point.areaName]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(normalizedKeyword));
  });
});

async function remove(pointId: string) {
  try {
    await adminStore.deleteTomb(pointId);
    message.success("点位已删除");
  } catch (error) {
    message.error(error instanceof Error ? error.message : "点位删除失败");
  }
}

const columns = computed<DataTableColumns<TombPoint>>(() => [
  {
    title: "封面",
    key: "coverImage",
    width: 120,
    render: (row) =>
      row.coverImage
        ? h(NImage, {
            src: row.coverImage,
            width: 84,
            height: 56,
            objectFit: "cover",
            style: { borderRadius: "12px" },
          })
        : h(TombCover, { tomb: row, class: "h-[56px] w-[84px]" }),
  },
  {
    title: "点位信息",
    key: "name",
    render: (row) =>
      h("div", { class: "space-y-1" }, [
        h("p", { class: "text-sm font-semibold text-white" }, row.name),
        h("p", { class: "text-xs text-white/46" }, `${row.titleName || "未填写称谓"} · ${row.generation || "未填写辈分"}`),
      ]),
  },
  {
    title: "片区 / 支系",
    key: "areaName",
    render: (row) => `${row.areaName || "未填写片区"} / ${row.branchName || "未填写支系"}`,
  },
  {
    title: "坐标",
    key: "location",
    render: (row) => `${row.lng}, ${row.lat}`,
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
            { text: true, type: "primary", onClick: () => void router.push(`/tombs/${row.id}/edit`) },
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
    <NCard class="admin-toolbar-card" :bordered="false" title="祭扫点位列表">
      <div class="admin-list-toolbar mb-4">
        <NInput v-model:value="keyword" class="admin-list-search" placeholder="按点位名称、称谓、支系或片区搜索" clearable />
        <div class="admin-list-actions">
          <NButton type="primary" @click="router.push('/tombs/new')">新增点位</NButton>
        </div>
      </div>

      <NDataTable
        :columns="columns"
        :data="filteredPoints"
        :bordered="false"
        :single-line="false"
      />
    </NCard>
  </div>
</template>
