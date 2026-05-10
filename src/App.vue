<script setup lang="ts">
import { computed, h, onMounted, ref, watch } from "vue";
import { RouterLink, RouterView, useRoute, useRouter } from "vue-router";
import {
  Bell,
  LayoutDashboard,
  LogOut,
  MapPinned,
  MessageSquareMore,
  MoonStar,
  Route,
  Search,
  Settings,
  Shield,
  SunMedium,
  Users,
  X,
} from "lucide-vue-next";
import {
  NAvatar,
  NButton,
  NConfigProvider,
  NDialogProvider,
  NGlobalStyle,
  NIcon,
  NInput,
  NLayout,
  NLayoutContent,
  NLayoutHeader,
  NLayoutSider,
  NLoadingBarProvider,
  NMenu,
  NMessageProvider,
  NModal,
  NNotificationProvider,
  NSelect,
  NSpace,
  NTag,
  darkTheme,
  dateZhCN,
  type MenuOption,
  zhCN,
} from "naive-ui";
import BrandLogo from "./components/BrandLogo.vue";
import { getAdminThemeOverrides } from "./lib/naive-theme";
import { useAdminStore } from "./stores/admin";
import { useAuthStore } from "./stores/auth";
import { useBrandStore } from "./stores/brand";
import { useThemeStore } from "./stores/theme";

interface VisitedTab {
  path: string;
  title: string;
}

const route = useRoute();
const router = useRouter();
const themeStore = useThemeStore();
const adminStore = useAdminStore();
const authStore = useAuthStore();
const brandStore = useBrandStore();
const visitedTabs = ref<VisitedTab[]>([]);

function renderIcon(icon: typeof Bell) {
  return () => h(NIcon, { size: 18 }, { default: () => h(icon) });
}

const isSuperAdmin = computed(() => authStore.profile?.role === "super_admin");
const roleLabel = computed(() => (isSuperAdmin.value ? "超级管理员" : "家族管理员"));

const menuOptions = computed<MenuOption[]>(() => {
  const base: MenuOption[] = [
    { key: "/dashboard", label: "概览", icon: renderIcon(LayoutDashboard) },
    { key: "/members", label: "成员管理", icon: renderIcon(Users) },
    { key: "/tombs", label: "点位管理", icon: renderIcon(MapPinned) },
    { key: "/tasks", label: "年度任务", icon: renderIcon(LayoutDashboard) },
    { key: "/messages", label: "留言审核", icon: renderIcon(MessageSquareMore) },
    { key: "/routes", label: "线路设置", icon: renderIcon(Route) },
    { key: "/settings", label: "系统设置", icon: renderIcon(Settings) },
  ];

  if (isSuperAdmin.value) {
    base.splice(1, 0, { key: "/families", label: "家族管理", icon: renderIcon(Shield) });
  }

  return base;
});

function resolveMenuKey(path: string) {
  if (path.startsWith("/families/")) return "/families";
  if (path.startsWith("/members/")) return "/members";
  if (path.startsWith("/tombs/")) return "/tombs";
  if (path.startsWith("/tasks/")) return "/tasks";
  if (path.startsWith("/routes/")) return "/routes";
  return path;
}

const isStandalonePage = computed(() => ["/login", "/about"].includes(route.path));
const pageTitle = computed(() => String(route.meta.title ?? "概览"));
const familyTitle = computed(() => adminStore.currentFamily?.name?.trim() || "");
const currentTitle = computed(() =>
  !isStandalonePage.value && familyTitle.value ? `${familyTitle.value} · ${pageTitle.value}` : pageTitle.value,
);
const activeMenu = computed(() => resolveMenuKey(route.path));
const naiveTheme = computed(() => (themeStore.actualTheme === "dark" ? darkTheme : undefined));
const themeIcon = computed(() => (themeStore.actualTheme === "dark" ? MoonStar : SunMedium));
const themeLabel = computed(() => (themeStore.actualTheme === "dark" ? "切换到浅色主题" : "切换到深色主题"));
const workspaceHint = computed(() => {
  if (isSuperAdmin.value) {
    return adminStore.currentFamily
      ? `当前工作家族：${adminStore.currentFamily.name}`
      : "可维护全部家族空间和品牌资源";
  }
  return adminStore.currentFamily
    ? `当前负责：${adminStore.currentFamily.name}`
    : "聚焦所属家族的协作与资料维护";
});
const routablePaths = computed(() => new Set(menuOptions.value.map((item) => String(item.key))));
const showTabs = computed(() => route.path !== "/dashboard" && visitedTabs.value.length > 0);
const headerHeight = computed(() => (showTabs.value ? 128 : 78));
const familyChooserVisible = ref(false);
const chooserFamilyId = ref("");
const familySwitcherValue = computed({
  get: () => adminStore.selectedFamilyId || adminStore.currentFamily?.id || "",
  set: (value: string) => {
    if (value) {
      void adminStore.selectFamily(value);
    }
  },
});

function handleMenuSelect(key: string) {
  void router.push(key);
}

function logout() {
  authStore.logout();
  void router.push("/login");
}

async function initializeWorkspace() {
  const hadSavedFamily = Boolean(adminStore.selectedFamilyId);
  await adminStore.loadSnapshot();

  if (isSuperAdmin.value && !hadSavedFamily && adminStore.familyOptions.length > 1) {
    chooserFamilyId.value = adminStore.currentFamily?.id || adminStore.familyOptions[0]?.value || "";
    familyChooserVisible.value = true;
  }
}

function confirmFamilyChoice() {
  familyChooserVisible.value = false;
  if (chooserFamilyId.value && chooserFamilyId.value !== adminStore.selectedFamilyId) {
    void adminStore.selectFamily(chooserFamilyId.value);
  }
}

function syncVisitedTabs(path: string, title: string) {
  const menuKey = resolveMenuKey(path);
  if (isStandalonePage.value || menuKey === "/dashboard" || !routablePaths.value.has(menuKey)) {
    return;
  }

  const exists = visitedTabs.value.find((item) => item.path === menuKey);
  if (exists) {
    exists.title = title;
    return;
  }

  visitedTabs.value.push({ path: menuKey, title });
}

function closeTab(path: string) {
  if (visitedTabs.value.length <= 1) {
    return;
  }

  const targetIndex = visitedTabs.value.findIndex((item) => item.path === path);
  if (targetIndex === -1) {
    return;
  }

  const isCurrent = resolveMenuKey(route.path) === path;
  visitedTabs.value.splice(targetIndex, 1);

  if (!isCurrent) {
    return;
  }

  const fallback = visitedTabs.value[targetIndex - 1] ?? visitedTabs.value[targetIndex] ?? visitedTabs.value[0];
  if (fallback) {
    void router.push(fallback.path);
  }
}

watch(
  () => [route.path, currentTitle.value] as const,
  ([path, title]) => {
    syncVisitedTabs(path, title);
  },
  { immediate: true },
);

watch(
  () => currentTitle.value,
  (title) => {
    document.title = title;
  },
  { immediate: true },
);

onMounted(() => {
  themeStore.applyTheme();
  brandStore.applyBrandAssets();

  if (authStore.isLoggedIn) {
    void initializeWorkspace();
  }
});

watch(
  () => authStore.isLoggedIn,
  (loggedIn, wasLoggedIn) => {
    if (loggedIn && !wasLoggedIn) {
      void initializeWorkspace();
    }
  },
);
</script>

<template>
  <NConfigProvider
    :theme="naiveTheme"
    :theme-overrides="getAdminThemeOverrides(themeStore.actualTheme)"
    :locale="zhCN"
    :date-locale="dateZhCN"
  >
    <NLoadingBarProvider>
      <NDialogProvider>
        <NNotificationProvider>
          <NMessageProvider>
            <NGlobalStyle />

            <div class="admin-app">
              <RouterView v-if="isStandalonePage" />

              <NLayout v-else has-sider class="admin-layout">
                <NLayoutSider
                  bordered
                  collapse-mode="width"
                  :collapsed-width="72"
                  :width="264"
                  style="height: 100vh;"
                  content-style="padding: 18px 14px;"
                >
                  <div class="admin-sider__inner">
                    <RouterLink to="/settings" class="mb-5 block">
                      <div class="admin-brand-card rounded-[20px] px-4 py-4">
                        <div class="flex items-start gap-3">
                          <BrandLogo compact />
                          <div class="min-w-0">
                            <p class="text-[11px] uppercase tracking-[0.28em] text-white/32">
                              {{ brandStore.settings.appNameEn }}
                            </p>
                            <p class="mt-2 text-lg font-semibold text-white">
                              {{ brandStore.settings.appNameZh }}
                            </p>
                          </div>
                        </div>
                      </div>
                    </RouterLink>

                    <div class="admin-sider__menu">
                      <NMenu
                        :value="activeMenu"
                        :options="menuOptions"
                        @update:value="handleMenuSelect"
                      />
                    </div>

                    <div class="mt-auto admin-brand-card rounded-[20px] px-4 py-4">
                      <p class="text-[11px] uppercase tracking-[0.28em] text-white/35">Workspace</p>
                      <p class="mt-3 text-sm font-semibold text-white">{{ roleLabel }}</p>
                      <template v-if="isSuperAdmin && adminStore.familyOptions.length">
                        <NSelect
                          v-model:value="familySwitcherValue"
                          class="mt-3"
                          size="small"
                          :options="adminStore.familyOptions"
                          placeholder="切换工作家族"
                        />
                      </template>
                      <p v-else class="mt-1 text-xs leading-5 text-white/50">
                        {{ workspaceHint }}
                      </p>
                    </div>
                  </div>
                </NLayoutSider>

                <NLayout>
                  <NLayoutHeader bordered :style="{ height: `${headerHeight}px`, padding: '0' }">
                    <div class="flex h-[78px] items-center justify-between gap-4 px-6">
                      <div>
                        <p class="text-xs uppercase tracking-[0.3em] text-white/30">{{ brandStore.settings.appNameEn }}</p>
                        <h1 class="mt-2 text-[22px] font-semibold text-white">{{ currentTitle }}</h1>
                      </div>

                      <NSpace align="center" :size="12">
                        <NTag round size="small" type="warning">
                          待审 {{ adminStore.summary.pendingMessages }}
                        </NTag>
                        <NInput round clearable placeholder="搜索页面、成员、点位" style="width: 260px">
                          <template #prefix>
                            <NIcon><Search /></NIcon>
                          </template>
                        </NInput>
                        <NButton quaternary circle>
                          <template #icon>
                            <NIcon><Bell /></NIcon>
                          </template>
                        </NButton>
                        <NButton quaternary circle :title="themeLabel" :aria-label="themeLabel" @click="themeStore.toggleTheme()">
                          <template #icon>
                            <NIcon><component :is="themeIcon" /></NIcon>
                          </template>
                        </NButton>
                        <div class="admin-brand-card flex items-center gap-3 rounded-2xl px-3 py-2">
                          <NAvatar round color="#2563eb" size="medium">
                            {{ (authStore.profile?.displayName ?? "宗").slice(0, 1) }}
                          </NAvatar>
                          <div class="hidden min-w-[120px] md:block">
                            <p class="text-sm font-medium text-white">
                              {{ authStore.profile?.displayName ?? "宗迹管理员" }}
                            </p>
                            <p class="text-xs text-white/45">
                              {{ roleLabel }}
                            </p>
                          </div>
                          <NButton text type="primary" @click="logout">
                            <template #icon>
                              <NIcon><LogOut /></NIcon>
                            </template>
                          </NButton>
                        </div>
                      </NSpace>
                    </div>

                    <div v-if="showTabs" class="admin-tabs-bar border-t border-white/5 px-6 py-3">
                      <button
                        v-for="tab in visitedTabs"
                        :key="tab.path"
                        type="button"
                        class="admin-tab"
                        :class="{ 'admin-tab--active': activeMenu === tab.path }"
                        @click="router.push(tab.path)"
                      >
                        <span>{{ tab.title }}</span>
                        <span
                          v-if="visitedTabs.length > 1"
                          class="admin-tab__close"
                          @click.stop="closeTab(tab.path)"
                        >
                          <X class="size-3.5" />
                        </span>
                      </button>
                    </div>
                  </NLayoutHeader>

                  <NLayoutContent>
                    <div class="admin-page" :style="{ height: `calc(100vh - ${headerHeight}px)` }">
                      <RouterView />
                    </div>
                  </NLayoutContent>
                </NLayout>
              </NLayout>
            </div>

            <NModal
              v-model:show="familyChooserVisible"
              preset="card"
              class="max-w-[440px]"
              title="选择进入的家族"
              :mask-closable="false"
              :closable="false"
            >
              <div class="space-y-4">
                <p class="text-sm leading-7 text-white/56">
                  超级管理员首次进入时需要确认当前工作家族。系统会记住这次选择，后续也可以在左下角随时切换。
                </p>
                <NSelect
                  v-model:value="chooserFamilyId"
                  :options="adminStore.familyOptions"
                  placeholder="请选择一个家族"
                />
                <div class="flex justify-end gap-3">
                  <NButton tertiary @click="familyChooserVisible = false">使用默认家族</NButton>
                  <NButton type="primary" @click="confirmFamilyChoice">确认进入</NButton>
                </div>
              </div>
            </NModal>
          </NMessageProvider>
        </NNotificationProvider>
      </NDialogProvider>
    </NLoadingBarProvider>
  </NConfigProvider>
</template>
