<script setup lang="ts">
import { computed, h, ref, watch } from "vue";
import { useRouter } from "vue-router";
import {
  NButton,
  NCard,
  NDataTable,
  NDatePicker,
  NInput,
  NSpace,
  NTag,
  useMessage,
  type DataTableColumns,
} from "naive-ui";
import { useAdminStore } from "@/stores/admin";
import type { RoutePlan } from "@/types/models";

const adminStore = useAdminStore();
const router = useRouter();
const message = useMessage();
const saveLoading = ref(false);
const dateSaving = ref(false);
const routeName = ref("");
const routeDescription = ref("");
const selectedTombIds = ref<string[]>([]);
const morningTombCount = ref(0);
const afternoonTombCount = ref(0);
const worshipDate = ref<number | null>(null);
const keyword = ref("");

const currentFamily = computed(() => adminStore.currentFamily);
const currentRoute = computed(() => {
  const familyId = currentFamily.value?.id;
  if (!familyId) {
    return null;
  }

  return adminStore.routes.find((item) => item.familyId === familyId && item.isPrimary)
    ?? adminStore.routes.find((item) => item.familyId === familyId)
    ?? null;
});

const familyMembers = computed(() =>
  adminStore.members.filter((item) => item.familyId === currentFamily.value?.id),
);

const familyTombs = computed(() =>
  adminStore.tombs.filter((item) => item.familyId === currentFamily.value?.id),
);

const selectedTombs = computed(() =>
  selectedTombIds.value
    .map((id) => familyTombs.value.find((item) => item.id === id))
    .filter((item): item is (typeof familyTombs.value)[number] => Boolean(item)),
);

const availableTombs = computed(() =>
  familyTombs.value.filter((item) => !selectedTombIds.value.includes(item.id)),
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

const morningStops = computed(() => selectedTombs.value.slice(0, morningTombCount.value));
const afternoonStops = computed(() =>
  selectedTombs.value.slice(morningTombCount.value, morningTombCount.value + afternoonTombCount.value),
);
const unassignedCount = computed(() =>
  Math.max(selectedTombIds.value.length - morningTombCount.value - afternoonTombCount.value, 0),
);
const hasWorshipDate = computed(() => Boolean(worshipDate.value));

function formatDateTime(value?: string | null) {
  if (!value) {
    return "刚刚";
  }

  return new Date(value).toLocaleString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function resolvePointNames(tombIds: string[]) {
  return tombIds
    .map((id) => adminStore.tombs.find((item) => item.id === id)?.name)
    .filter((item): item is string => Boolean(item));
}

function clampScheduleCounts() {
  const total = selectedTombIds.value.length;
  morningTombCount.value = Math.max(0, Math.min(total, morningTombCount.value));
  const remain = Math.max(total - morningTombCount.value, 0);
  afternoonTombCount.value = Math.max(0, Math.min(remain, afternoonTombCount.value));
}

function syncFromCurrentRoute() {
  routeName.value = currentRoute.value?.name ?? `${new Date().getFullYear()} 清明主线路`;
  routeDescription.value = currentRoute.value?.description ?? "";
  selectedTombIds.value = [...(currentRoute.value?.tombIds ?? [])];
  morningTombCount.value = currentRoute.value?.morningTombCount ?? 0;
  afternoonTombCount.value = currentRoute.value?.afternoonTombCount ?? 0;
  worshipDate.value = currentFamily.value?.upcomingWorshipAt
    ? new Date(currentFamily.value.upcomingWorshipAt).getTime()
    : null;
  clampScheduleCounts();
}

function adjustSchedule(target: "morning" | "afternoon", delta: number) {
  if (!hasWorshipDate.value) {
    message.warning("请先设置祭扫日期，再安排上午和下午数量");
    return;
  }

  if (target === "morning") {
    morningTombCount.value += delta;
  } else {
    afternoonTombCount.value += delta;
  }

  clampScheduleCounts();
}

function addTomb(tombId: string) {
  if (selectedTombIds.value.includes(tombId)) {
    return;
  }

  selectedTombIds.value = [...selectedTombIds.value, tombId];
  clampScheduleCounts();
}

function removeTomb(tombId: string) {
  selectedTombIds.value = selectedTombIds.value.filter((item) => item !== tombId);
  clampScheduleCounts();
}

function moveTomb(index: number, direction: -1 | 1) {
  const nextIndex = index + direction;
  if (nextIndex < 0 || nextIndex >= selectedTombIds.value.length) {
    return;
  }

  const next = [...selectedTombIds.value];
  [next[index], next[nextIndex]] = [next[nextIndex], next[index]];
  selectedTombIds.value = next;
}

async function saveWorshipDate() {
  if (!currentFamily.value?.id || !worshipDate.value) {
    message.warning("请先选择祭扫日期");
    return;
  }

  dateSaving.value = true;
  try {
    await adminStore.updateFamily(currentFamily.value.id, {
      upcomingWorshipAt: new Date(worshipDate.value).toISOString(),
    });
    message.success("祭扫日期已保存");
    syncFromCurrentRoute();
  } catch (error) {
    message.error(error instanceof Error ? error.message : "祭扫日期保存失败");
  } finally {
    dateSaving.value = false;
  }
}

async function saveRoutePlan() {
  if (!currentFamily.value?.id) {
    message.warning("请先选择家族");
    return;
  }

  if (!hasWorshipDate.value) {
    message.warning("请先设置祭扫日期，再保存线路安排");
    return;
  }

  if (!routeName.value.trim()) {
    message.warning("请填写线路名称");
    return;
  }

  if (selectedTombIds.value.length === 0) {
    message.warning("请至少加入一个点位");
    return;
  }

  const managerMember =
    familyMembers.value.find((item) => item.role === "admin" || item.role === "manager")
    ?? familyMembers.value[0]
    ?? null;

  const basePayload = {
    familyId: currentFamily.value.id,
    name: routeName.value.trim(),
    description: routeDescription.value.trim() || null,
    tombIds: selectedTombIds.value,
    createdByMemberId: managerMember?.id ?? null,
    isPrimary: true,
    morningTombCount: morningTombCount.value,
    afternoonTombCount: afternoonTombCount.value,
  };

  saveLoading.value = true;
  try {
    if (currentRoute.value?.id) {
      await adminStore.updateRoute(currentRoute.value.id, {
        name: basePayload.name,
        description: basePayload.description,
        tombIds: basePayload.tombIds,
        createdByMemberId: basePayload.createdByMemberId,
        isPrimary: basePayload.isPrimary,
        morningTombCount: basePayload.morningTombCount,
        afternoonTombCount: basePayload.afternoonTombCount,
      });
    } else {
      await adminStore.createRoute(basePayload);
    }

    message.success("主线路已保存，成员端会同步看到最新顺序");
    syncFromCurrentRoute();
  } catch (error) {
    message.error(error instanceof Error ? error.message : "线路保存失败");
  } finally {
    saveLoading.value = false;
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
        h("div", { class: "flex items-center gap-2" }, [
          h("p", { class: "text-sm font-semibold text-white" }, row.name),
          row.isPrimary ? h(NTag, { size: "small", round: true, type: "info" }, { default: () => "主线路" }) : null,
        ]),
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
    width: 160,
    render: (row) =>
      h(NSpace, { size: 8 }, {
        default: () => [
          h(
            NButton,
            { text: true, type: "primary", onClick: () => void router.push(`/routes/${row.id}/edit`) },
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

watch(currentRoute, syncFromCurrentRoute, { immediate: true });
watch(
  () => currentFamily.value?.upcomingWorshipAt,
  () => {
    worshipDate.value = currentFamily.value?.upcomingWorshipAt
      ? new Date(currentFamily.value.upcomingWorshipAt).getTime()
      : null;
  },
  { immediate: true },
);
watch(selectedTombIds, clampScheduleCounts);
</script>

<template>
  <div class="space-y-6">
    <NCard class="admin-toolbar-card" :bordered="false" title="主线路设置">
      <template v-if="currentFamily">
        <div class="grid gap-3 lg:grid-cols-[1.15fr_0.85fr]">
          <div class="admin-surface-muted p-5">
            <div class="flex flex-wrap items-center gap-3">
              <p class="text-lg font-semibold text-white">{{ currentFamily.name }}</p>
              <NTag round :bordered="false" type="info">当前家族</NTag>
              <NTag round :bordered="false" :type="currentRoute ? 'success' : 'default'">
                {{ currentRoute ? "已配置主线路" : "待配置主线路" }}
              </NTag>
            </div>
            <p class="mt-3 text-sm leading-7 text-white/62">
              这里用于维护成员端优先看到的主线路；下面的模板列表则可以沉淀不同场景的备用路线。
            </p>
            <div
              v-if="currentRoute?.planRevision && currentRoute.planRevision > 1"
              class="mt-4 rounded-xl border border-amber-400/18 bg-amber-400/8 px-4 py-3 text-sm leading-6 text-amber-100"
            >
              当前线路今年已经调整过 {{ currentRoute.planRevision }} 次，成员端会收到“线路已改变，请联系管理员确认”的提醒。
              最近更新时间：{{ formatDateTime(currentRoute.planUpdatedAt) }}
            </div>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div class="admin-surface-muted p-4">
              <p class="text-xs uppercase tracking-[0.2em] text-white/36">日期</p>
              <p class="mt-3 text-lg font-semibold text-white">
                {{ currentFamily.upcomingWorshipAt ? formatDateTime(currentFamily.upcomingWorshipAt).slice(0, 10) : "未设置" }}
              </p>
            </div>
            <div class="admin-surface-muted p-4">
              <p class="text-xs uppercase tracking-[0.2em] text-white/36">版本</p>
              <p class="mt-3 text-3xl font-semibold text-white">{{ currentRoute?.planRevision || 1 }}</p>
            </div>
            <div class="admin-surface-muted p-4">
              <p class="text-xs uppercase tracking-[0.2em] text-white/36">上午</p>
              <p class="mt-3 text-3xl font-semibold text-white">{{ morningTombCount }}</p>
            </div>
            <div class="admin-surface-muted p-4">
              <p class="text-xs uppercase tracking-[0.2em] text-white/36">下午</p>
              <p class="mt-3 text-3xl font-semibold text-white">{{ afternoonTombCount }}</p>
            </div>
          </div>
        </div>
      </template>

      <div v-else class="admin-surface-muted p-5 text-sm text-white/64">
        还没有可管理的家族，请先创建家族。
      </div>
    </NCard>

    <template v-if="currentFamily">
      <NCard class="admin-toolbar-card" :bordered="false" title="基础设置">
        <div class="grid gap-4 lg:grid-cols-2">
          <div>
            <p class="mb-2 text-sm text-white/62">线路名称</p>
            <NInput v-model:value="routeName" placeholder="例如：2026 清明主线路" />
          </div>
          <div>
            <p class="mb-2 text-sm text-white/62">线路说明</p>
            <NInput
              v-model:value="routeDescription"
              placeholder="例如：上午先扫祖坟区，下午再走支系点位"
            />
          </div>
        </div>

        <div class="mt-4 grid gap-3 lg:grid-cols-3">
          <div class="admin-surface-muted p-4">
            <p class="mb-2 text-sm text-white/62">祭扫日期</p>
            <NDatePicker
              v-model:value="worshipDate"
              type="date"
              clearable
              style="width: 100%;"
              placeholder="先选日期"
            />
            <NButton class="mt-3 w-full" type="primary" ghost :loading="dateSaving" @click="saveWorshipDate">
              保存日期
            </NButton>
          </div>

          <div class="admin-surface-muted p-4">
            <p class="text-sm font-medium text-white">上午先扫 {{ morningTombCount }} 个</p>
            <div class="mt-4 flex items-center gap-2">
              <NButton secondary :disabled="!hasWorshipDate" @click="adjustSchedule('morning', -1)">-1</NButton>
              <div class="flex-1 text-center text-2xl font-semibold text-white">{{ morningTombCount }}</div>
              <NButton secondary :disabled="!hasWorshipDate" @click="adjustSchedule('morning', 1)">+1</NButton>
            </div>
            <p class="mt-3 text-xs leading-6 text-white/48">
              {{ morningStops.length ? morningStops.map((item) => item.name).join("、") : "未分配" }}
            </p>
          </div>

          <div class="admin-surface-muted p-4">
            <p class="text-sm font-medium text-white">下午再扫 {{ afternoonTombCount }} 个</p>
            <div class="mt-4 flex items-center gap-2">
              <NButton secondary :disabled="!hasWorshipDate" @click="adjustSchedule('afternoon', -1)">-1</NButton>
              <div class="flex-1 text-center text-2xl font-semibold text-white">{{ afternoonTombCount }}</div>
              <NButton secondary :disabled="!hasWorshipDate" @click="adjustSchedule('afternoon', 1)">+1</NButton>
            </div>
            <p class="mt-3 text-xs leading-6 text-white/48">
              {{ afternoonStops.length ? afternoonStops.map((item) => item.name).join("、") : "未分配" }}
            </p>
          </div>
        </div>

        <p class="mt-3 text-sm leading-7 text-white/56">
          {{ hasWorshipDate ? `未分配的 ${unassignedCount} 个点位默认按现场情况机动安排。` : "请先保存祭扫日期，保存后才能设置上午和下午数量。" }}
        </p>
      </NCard>

      <NCard class="admin-toolbar-card" :bordered="false" title="当前顺序">
        <div v-if="selectedTombs.length" class="space-y-3">
          <div
            v-for="(tomb, index) in selectedTombs"
            :key="tomb.id"
            class="admin-surface-muted flex items-center gap-3 p-4"
          >
            <div class="flex size-9 items-center justify-center rounded-xl bg-white/10 text-sm font-semibold text-white">
              {{ index + 1 }}
            </div>
            <div class="min-w-0 flex-1">
              <p class="text-sm font-medium text-white">{{ tomb.name }}</p>
              <p class="mt-1 text-xs text-white/46">
                {{ tomb.areaName || "未填写片区" }} / {{ tomb.branchName || "未填写支系" }}
              </p>
            </div>
            <div class="flex gap-2">
              <NButton secondary :disabled="index === 0" @click="moveTomb(index, -1)">上移</NButton>
              <NButton secondary :disabled="index === selectedTombIds.length - 1" @click="moveTomb(index, 1)">下移</NButton>
              <NButton tertiary type="error" @click="removeTomb(tomb.id)">移出</NButton>
            </div>
          </div>
        </div>
        <div v-else class="admin-surface-muted p-5 text-sm text-white/58">
          还没有加入点位，先在下面点“加入顺序”即可开始配置。
        </div>
      </NCard>

      <NCard class="admin-toolbar-card" :bordered="false" title="可加入点位">
        <div v-if="availableTombs.length" class="grid gap-3 md:grid-cols-2">
          <div
            v-for="tomb in availableTombs"
            :key="tomb.id"
            class="admin-surface-muted flex items-center gap-3 p-4"
          >
            <div class="min-w-0 flex-1">
              <p class="text-sm font-medium text-white">{{ tomb.name }}</p>
              <p class="mt-1 text-xs text-white/46">
                {{ tomb.areaName || "未填写片区" }} / {{ tomb.branchName || "未填写支系" }}
              </p>
            </div>
            <NButton type="primary" @click="addTomb(tomb.id)">加入顺序</NButton>
          </div>
        </div>
        <div v-else class="admin-surface-muted p-5 text-sm text-white/58">
          当前家族的点位都已经加入到主线路里了。
        </div>

        <div class="mt-5 flex justify-end">
          <NButton type="primary" size="large" :loading="saveLoading" @click="saveRoutePlan">
            保存主线路
          </NButton>
        </div>
      </NCard>
    </template>

    <NCard class="admin-toolbar-card" :bordered="false" title="路线模板列表">
      <div class="admin-list-toolbar mb-4">
        <NInput v-model:value="keyword" class="admin-list-search" clearable placeholder="按路线名称、说明或点位名称搜索" />
        <div class="admin-list-actions">
          <NButton type="primary" @click="router.push('/routes/new')">新增路线模板</NButton>
        </div>
      </div>

      <NDataTable :columns="columns" :data="filteredRoutes" :bordered="false" :single-line="false" />
    </NCard>
  </div>
</template>
