<script setup lang="ts">
import { computed } from "vue";
import { useRouter } from "vue-router";
import { Bar, Doughnut } from "vue-chartjs";
import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  Tooltip,
} from "chart.js";
import {
  ArrowRight,
  CalendarClock,
  Compass,
  MapPinned,
  MessageSquareText,
  Route,
  Shield,
  Users,
} from "lucide-vue-next";
import { NButton, NCard, NGrid, NGridItem, NIcon, NSpace, NTag } from "naive-ui";
import { useAdminStore } from "@/stores/admin";
import { useAuthStore } from "@/stores/auth";
import { useThemeStore } from "@/stores/theme";

ChartJS.register(ArcElement, BarElement, CategoryScale, Legend, LinearScale, Tooltip);

const router = useRouter();
const adminStore = useAdminStore();
const authStore = useAuthStore();
const themeStore = useThemeStore();

const isDark = computed(() => themeStore.actualTheme === "dark");
const isSuperAdmin = computed(() => authStore.profile?.role === "super_admin");
const currentFamilyId = computed(() => adminStore.currentFamily?.id ?? "");
const chartTextColor = computed(() => (isDark.value ? "rgba(255,255,255,0.64)" : "rgba(15,23,42,0.68)"));
const chartMutedTextColor = computed(() => (isDark.value ? "rgba(255,255,255,0.46)" : "rgba(15,23,42,0.5)"));
const chartGridColor = computed(() => (isDark.value ? "rgba(255,255,255,0.06)" : "rgba(148,163,184,0.24)"));
const doughnutBorderColor = computed(() => (isDark.value ? "rgba(15,18,23,0.75)" : "rgba(255,255,255,0.96)"));

function formatDateTime(value?: string | null) {
  if (!value) {
    return "未设置";
  }
  return new Date(value).toLocaleString("zh-CN");
}

const summaryCards = computed(() => [
  {
    label: isSuperAdmin.value ? "家族空间" : "当前家族",
    value: adminStore.summary.families,
    hint: isSuperAdmin.value ? "已接入的协作空间" : "当前正在维护的家族空间",
    color: "#60a5fa",
    icon: Shield,
  },
  {
    label: "家族成员",
    value: adminStore.summary.members,
    hint: "参与祭扫协作的成员数量",
    color: "#22c55e",
    icon: Users,
  },
  {
    label: "点位数量",
    value: adminStore.summary.tombs,
    hint: "地图坐标已经录入完成",
    color: "#f59e0b",
    icon: MapPinned,
  },
  {
    label: "待审留言",
    value: adminStore.summary.pendingMessages,
    hint: "前台提交后等待审核",
    color: "#f97316",
    icon: Compass,
  },
]);

const overviewChartData = computed(() => ({
  labels: ["成员", "点位", "路线模板", "留言"],
  datasets: [
    {
      label: "当前规模",
      data: [
        adminStore.summary.members,
        adminStore.summary.tombs,
        adminStore.routes.length,
        adminStore.messages.length,
      ],
      backgroundColor: ["#3b82f6", "#14b8a6", "#8b5cf6", "#f59e0b"],
      borderRadius: 10,
      maxBarThickness: 28,
    },
  ],
}));

const taskChartData = computed(() => {
  const draft = adminStore.tasks.filter((item) => item.status === "draft").length;
  const active = adminStore.tasks.filter((item) => item.status === "active").length;
  const closed = adminStore.tasks.filter((item) => item.status === "closed").length;

  return {
    labels: ["草稿", "进行中", "已结束"],
    datasets: [
      {
        data: [draft, active, closed],
        backgroundColor: ["#64748b", "#3b82f6", "#22c55e"],
        borderColor: doughnutBorderColor.value,
        borderWidth: 2,
      },
    ],
  };
});

const currentFamilyTasks = computed(() =>
  adminStore.tasks.filter((item) => item.familyId === currentFamilyId.value),
);

const focusTask = computed(() =>
  currentFamilyTasks.value.find((item) => item.status === "active")
  ?? currentFamilyTasks.value.find((item) => item.status === "draft")
  ?? currentFamilyTasks.value[0]
  ?? null,
);

const currentPrimaryRoute = computed(() =>
  adminStore.routes.find((item) => item.familyId === currentFamilyId.value && item.isPrimary)
  ?? adminStore.routes.find((item) => item.familyId === currentFamilyId.value)
  ?? null,
);

const pendingMessagesCount = computed(() =>
  adminStore.messages.filter((item) => item.familyId === currentFamilyId.value && item.status === "pending").length,
);

const daysUntilNextWorship = computed(() => {
  const target = nextReminder.value?.upcomingWorshipAt;
  if (!target) {
    return null;
  }

  const diff = new Date(target).getTime() - Date.now();
  return Math.max(Math.ceil(diff / (1000 * 60 * 60 * 24)), 0);
});

const reminderCards = computed(() => [
  {
    key: "worship",
    label: "下次祭扫",
    value: nextReminder.value?.upcomingWorshipAt ? formatDateTime(nextReminder.value.upcomingWorshipAt).slice(0, 16) : "待设置",
    hint: nextReminder.value?.upcomingWorshipAt
      ? `${daysUntilNextWorship.value === 0 ? "就在今天" : `${daysUntilNextWorship.value} 天后`}，提前确认集合和路线`
      : "建议先补充日期，成员端会更早感知安排",
    actionLabel: nextReminder.value?.upcomingWorshipAt ? "查看设置" : "去设置",
    to: isSuperAdmin.value ? "/families" : "/routes",
    icon: CalendarClock,
  },
  {
    key: "route",
    label: "主线路",
    value: currentPrimaryRoute.value ? `${currentPrimaryRoute.value.tombIds.length} 个点位` : "待配置",
    hint: currentPrimaryRoute.value
      ? `当前版本 ${currentPrimaryRoute.value.planRevision || 1}，上午 ${currentPrimaryRoute.value.morningTombCount} / 下午 ${currentPrimaryRoute.value.afternoonTombCount}`
      : "还没有主线路，建议先整理成员端默认顺序",
    actionLabel: currentPrimaryRoute.value ? "维护线路" : "去配置",
    to: "/routes",
    icon: Route,
  },
  {
    key: "task",
    label: "当前任务",
    value: focusTask.value?.name || "待创建",
    hint: focusTask.value
      ? `${focusTask.value.startDate} 至 ${focusTask.value.endDate} · ${focusTask.value.status === "active" ? "进行中" : focusTask.value.status === "draft" ? "草稿中" : "已结束"}`
      : "建议补充年度任务，方便同步祭扫周期",
    actionLabel: focusTask.value ? "查看任务" : "去创建",
    to: "/tasks",
    icon: Compass,
  },
  {
    key: "messages",
    label: "待审留言",
    value: `${pendingMessagesCount.value} 条`,
    hint: pendingMessagesCount.value > 0
      ? "建议优先审核公开展示内容，避免前台挂起"
      : focusTask.value
        ? `当前关注任务：${focusTask.value.name}`
        : "当前没有积压留言，可以去维护年度任务",
    actionLabel: pendingMessagesCount.value > 0 ? "立即处理" : "查看任务",
    to: pendingMessagesCount.value > 0 ? "/messages" : "/tasks",
    icon: MessageSquareText,
  },
]);

const barOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: {
      backgroundColor: isDark.value ? "#111827" : "#ffffff",
      titleColor: isDark.value ? "#f8fafc" : "#0f172a",
      bodyColor: isDark.value ? "rgba(255,255,255,0.78)" : "rgba(15,23,42,0.72)",
      borderColor: isDark.value ? "rgba(255,255,255,0.08)" : "rgba(148,163,184,0.18)",
      borderWidth: 1,
      padding: 10,
    },
  },
  scales: {
    x: {
      ticks: { color: chartTextColor.value },
      grid: { display: false },
      border: { color: chartGridColor.value },
    },
    y: {
      ticks: { color: chartMutedTextColor.value, precision: 0 },
      grid: { color: chartGridColor.value },
      border: { color: chartGridColor.value },
    },
  },
}));

const doughnutOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  cutout: "72%",
  plugins: {
    legend: {
      position: "bottom" as const,
      labels: {
        color: chartTextColor.value,
        padding: 14,
        boxWidth: 18,
        boxHeight: 8,
      },
    },
    tooltip: {
      backgroundColor: isDark.value ? "#111827" : "#ffffff",
      titleColor: isDark.value ? "#f8fafc" : "#0f172a",
      bodyColor: isDark.value ? "rgba(255,255,255,0.78)" : "rgba(15,23,42,0.72)",
      borderColor: isDark.value ? "rgba(255,255,255,0.08)" : "rgba(148,163,184,0.18)",
      borderWidth: 1,
      padding: 10,
    },
  },
}));

const shortcuts = computed(() => {
  const cards = [
    {
      label: "点位管理",
      hint: "录入坐标、封面图和纪念区信息",
      icon: MapPinned,
      to: "/tombs",
    },
    {
      label: "留言审核",
      hint: "优先处理前台公开内容",
      icon: MessageSquareText,
      to: "/messages",
    },
    {
      label: "线路设置",
      hint: "维护主线路和常用模板",
      icon: Route,
      to: "/routes",
    },
    {
      label: "年度任务",
      hint: "查看祭扫区间和当前任务状态",
      icon: CalendarClock,
      to: "/tasks",
    },
  ];

  if (isSuperAdmin.value) {
    cards[0] = {
      label: "家族管理",
      hint: "维护家族资料、日期和邀请入口",
      icon: Shield,
      to: "/families",
    };
  }

  return cards;
});

const nextReminder = computed(() => {
  if (adminStore.currentFamily?.upcomingWorshipAt) {
    return adminStore.currentFamily;
  }

  return (
    [...adminStore.families]
      .filter((item) => item.upcomingWorshipAt)
      .sort(
        (left, right) =>
          new Date(left.upcomingWorshipAt ?? "").getTime() - new Date(right.upcomingWorshipAt ?? "").getTime(),
      )[0] ?? null
  );
});
</script>

<template>
  <div class="space-y-3">
    <div class="flex items-start justify-between gap-4">
      <div>
        <h2 class="text-[22px] font-semibold text-white">概览工作台</h2>
        <p class="mt-1 text-sm text-white/46">
          {{ authStore.profile?.displayName ?? "管理员" }}，今天优先关注家族设置、点位资料和留言审核。
        </p>
      </div>
      <NSpace :size="10">
        <NTag round type="info">地图优先</NTag>
        <NTag round type="warning">MVP 运行中</NTag>
      </NSpace>
    </div>

    <NGrid cols="1 s:2 m:4" responsive="screen" :x-gap="10" :y-gap="10">
      <NGridItem v-for="item in summaryCards" :key="item.label">
        <NCard class="admin-stat-card relative" :bordered="false" content-style="padding: 12px 14px;">
          <div class="flex items-center justify-between gap-3">
            <div class="flex items-center gap-3">
              <div class="h-2.5 w-2.5 rounded-full" :style="{ backgroundColor: item.color }" />
              <p class="text-sm text-white/60">{{ item.label }}</p>
            </div>
            <p class="text-[26px] font-semibold text-white">{{ item.value }}</p>
          </div>
          <p class="mt-2 text-xs text-white/38">{{ item.hint }}</p>
          <div class="absolute bottom-3 right-3 text-white/18">
            <component :is="item.icon" class="size-5" />
          </div>
        </NCard>
      </NGridItem>
    </NGrid>

    <NCard class="admin-toolbar-card overflow-hidden h-[316px]" :bordered="false" title="数据概览" content-style="padding: 12px 14px 10px;">
      <div class="chart-panel chart-panel--bar h-full">
        <Bar :data="overviewChartData" :options="barOptions" />
      </div>
    </NCard>

    <div class="grid gap-3 lg:grid-cols-[minmax(0,3fr)_minmax(0,7fr)]">
      <NCard class="admin-toolbar-card overflow-hidden h-[316px]" :bordered="false" title="任务状态" content-style="padding: 12px 14px 10px;">
        <div class="chart-panel chart-panel--donut h-full">
          <Doughnut :data="taskChartData" :options="doughnutOptions" />
        </div>
      </NCard>

      <NCard class="admin-toolbar-card overflow-hidden h-[316px]" :bordered="false" content-style="padding: 12px 14px;">
        <div class="flex h-full min-h-0 flex-col gap-3 overflow-hidden">
          <div class="admin-surface-muted flex items-center justify-between gap-3 rounded-2xl px-4 py-2.5">
            <div>
              <p class="text-[11px] uppercase tracking-[0.28em] text-white/32">Workspace</p>
              <p class="mt-1.5 text-sm font-semibold text-white">
                {{ adminStore.currentFamily?.name || "未选择家族" }}
              </p>
            </div>
            <NTag round size="small" type="info">
              {{ focusTask?.status === "active" ? "进行中" : focusTask?.status === "draft" ? "待启动" : "已同步" }}
            </NTag>
          </div>

          <div class="grid min-h-0 flex-1 auto-rows-[minmax(96px,1fr)] grid-cols-2 gap-2.5 overflow-y-auto pr-1">
            <div
              v-for="item in reminderCards"
              :key="item.key"
              class="admin-surface-muted h-full rounded-2xl px-4 py-3"
            >
              <div class="flex items-start justify-between gap-3">
                <div class="min-w-0">
                  <div class="flex items-center gap-2">
                    <NIcon size="15" color="#93c5fd">
                      <component :is="item.icon" />
                    </NIcon>
                    <p class="text-[11px] uppercase tracking-[0.22em] text-white/34">{{ item.label }}</p>
                  </div>
                  <p class="mt-2 line-clamp-2 text-sm font-semibold text-white">{{ item.value }}</p>
                  <p class="mt-1 line-clamp-2 text-xs leading-5 text-white/46">{{ item.hint }}</p>
                </div>

                <NButton text size="small" type="primary" @click="router.push(item.to)">
                  {{ item.actionLabel }}
                </NButton>
              </div>
            </div>
          </div>
        </div>
      </NCard>
    </div>

    <NGrid cols="1" responsive="screen" :x-gap="10" :y-gap="10">
      <NGridItem>
        <NCard class="admin-toolbar-card h-[336px]" :bordered="false" title="快捷入口" content-style="padding: 10px 14px 12px;">
          <div class="grid gap-3 md:grid-cols-2">
            <div
              v-for="item in shortcuts"
              :key="item.label"
              class="admin-surface-muted flex min-h-[84px] flex-col justify-between p-4 transition hover:border-white/15 hover:bg-white/5"
            >
              <div class="flex items-start justify-between gap-4">
                <div>
                  <p class="text-sm font-semibold text-white">{{ item.label }}</p>
                  <p class="mt-1 text-xs leading-5 text-white/48">{{ item.hint }}</p>
                </div>
                <NIcon size="18" color="#93c5fd">
                  <component :is="item.icon" />
                </NIcon>
              </div>
              <NButton class="mt-0.5 self-start" text type="primary" @click="router.push(item.to)">
                立即进入
                <template #icon>
                  <NIcon><ArrowRight /></NIcon>
                </template>
              </NButton>
            </div>
          </div>
        </NCard>
      </NGridItem>
    </NGrid>
  </div>
</template>
