import { createRouter, createWebHistory } from "vue-router";
import { useAuthStore } from "@/stores/auth";

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: "/", redirect: "/dashboard" },
    { path: "/login", component: () => import("@/pages/LoginPage.vue"), meta: { title: "管理员登录" } },
    { path: "/dashboard", component: () => import("@/pages/DashboardPage.vue"), meta: { title: "概览" } },
    { path: "/families", component: () => import("@/pages/FamiliesPage.vue"), meta: { title: "家族管理" } },
    { path: "/members", component: () => import("@/pages/MembersPage.vue"), meta: { title: "成员管理" } },
    { path: "/tombs", component: () => import("@/pages/TombsPage.vue"), meta: { title: "点位管理" } },
    { path: "/tasks", component: () => import("@/pages/TasksPage.vue"), meta: { title: "年度任务" } },
    { path: "/messages", component: () => import("@/pages/MessagesPage.vue"), meta: { title: "留言审核" } },
    { path: "/routes", component: () => import("@/pages/RoutesPage.vue"), meta: { title: "路线模板" } },
    { path: "/settings", component: () => import("@/pages/SettingsPage.vue"), meta: { title: "系统设置" } },
    { path: "/about", component: () => import("@/pages/AboutPage.vue"), meta: { title: "关于宗迹" } },
  ],
});

router.beforeEach((to) => {
  const authStore = useAuthStore();

  if (to.path === "/login" || to.path === "/about") {
    return true;
  }

  if (!authStore.isLoggedIn) {
    return "/login";
  }

  if (to.path === "/families" && authStore.profile?.role !== "super_admin") {
    return "/dashboard";
  }

  return true;
});

router.afterEach((to) => {
  let appName = "宗迹";
  try {
    const raw = localStorage.getItem("kintrace-admin-brand");
    if (raw) {
      appName = (JSON.parse(raw).appNameZh as string | undefined) || appName;
    }
  } catch {
    appName = "宗迹";
  }
  document.title = `${String(to.meta.title ?? `${appName}管理后台`)} · ${appName}管理后台`;
});
