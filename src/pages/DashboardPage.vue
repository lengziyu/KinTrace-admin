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
import { NButton, NCard, NGrid, NGridItem, NIcon, NProgress, NSpace, NTag, NThing } from "naive-ui";
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
const chartTextColor = computed(() => (isDark.value ? "rgba(255,255,255,0.64)" : "rgba(15,23,42,0.68)"));
const chartMutedTextColor = computed(() => (isDark.value ? "rgba(255,255,255,0.46)" : "rgba(15,23,42,0.5)"));
const chartGridColor = computed(() => (isDark.value ? "rgba(255,255,255,0.06)" : "rgba(148,163,184,0.24)"));
const doughnutBorderColor = computed(() => (isDark.value ? "rgba(15,18,23,0.75)" : "rgba(255,255,255,0.96)"));

const summaryCards = computed(() => [
  {
    label: isSuperAdmin.value ? "家族空间" : "当前家族",
    value: adminStore.summary.families,
    hint: isSuperAdmin.value ? "已接入协作空间" : "当前正在维护的家族空间",
    color: "#60a5fa",
    icon: Shield,
  },
  {
    label: "家族成员",
    value: adminStore.summary.members,
    hint: "参与祭扫的成员",
    color: "#22c55e",
    icon: Users,
  },
  {
    label: "点位数量",
    value: adminStore.summary.tombs,
    hint: "地图坐标已录入",
    color: "#f59e0b",
    icon: MapPinned,
  },
  {
    label: "待审留言",
    value: adminStore.summary.pendingMessages,
    hint: "需要尽快确认",
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
    labels: ["草稿", "进行中", "已关闭"],
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
      hint: "录入坐标、封面图与纪念区",
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
      label: "路线模板",
      hint: "沉淀常用祭扫顺序",
      icon: Route,
      to: "/routes",
    },
    {
      label: "年度任务",
      hint: "安排当年的祭扫区间与状态",
      icon: CalendarClock,
      to: "/tasks",
    },
  ];

  if (isSuperAdmin.value) {
    cards[0] = {
      label: "家族管理",
      hint: "维护家族资料与祭拜时间",
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
          {{ authStore.profile?.displayName ?? "Admin" }}，今天优先维护家族设置、点位数据和留言审核。
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

    <NGrid cols="1 xl:3" responsive="screen" :x-gap="10" :y-gap="10">
      <NGridItem span="2">
        <NCard class="admin-toolbar-card overflow-hidden h-[316px]" :bordered="false" title="数据汇总" content-style="padding: 12px 14px 10px;">
          <div class="chart-panel chart-panel--bar h-full">
            <Bar :data="overviewChartData" :options="barOptions" />
          </div>
        </NCard>
      </NGridItem>

      <NGridItem>
        <NCard class="admin-toolbar-card overflow-hidden h-[316px]" :bordered="false" title="任务状态" content-style="padding: 12px 14px 10px;">
          <div class="chart-panel chart-panel--donut h-full">
            <Doughnut :data="taskChartData" :options="doughnutOptions" />
          </div>
        </NCard>
      </NGridItem>
    </NGrid>

    <NGrid cols="1 xl:3" responsive="screen" :x-gap="10" :y-gap="10">
      <NGridItem span="2">
        <NCard class="admin-toolbar-card h-[286px]" :bordered="false" title="快捷工作台" content-style="padding: 10px 14px 12px;">
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

      <NGridItem>
        <NCard class="admin-toolbar-card h-[286px]" :bordered="false" title="近期提醒" content-style="padding: 10px 14px 12px;">
          <div class="flex h-full flex-col gap-3">
            <div class="admin-surface-muted p-4">
              <p class="text-sm text-white/46">进行中任务</p>
              <p class="mt-2 text-[26px] font-semibold text-white">{{ adminStore.summary.activeTasks }}</p>
              <NProgress
                class="mt-3"
                type="line"
                :percentage="Math.min(100, adminStore.summary.activeTasks * 25)"
                :show-indicator="false"
                processing
              />
            </div>

            <div v-if="nextReminder" class="admin-surface-muted flex-1 p-4">
              <NThing>
                <template #header>
                  <span class="text-sm font-semibold text-white">{{ nextReminder.name }}</span>
                </template>
                <template #description>
                  <span class="text-white/46">
                    下次祭拜：{{ new Date(nextReminder.upcomingWorshipAt ?? "").toLocaleString("zh-CN") }}
                  </span>
                </template>
              </NThing>
            </div>

            <div v-else class="admin-surface-muted flex-1 p-4 text-sm text-white/46">
              还没有设置下一次家族祭拜时间，可以前往家族管理页补充。
            </div>
          </div>
        </NCard>
      </NGridItem>
    </NGrid>
  </div>
</template>
