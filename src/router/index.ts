import { createRouter, createWebHistory } from "vue-router";
import { useAuthStore } from "@/stores/auth";

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: "/", redirect: "/dashboard" },
    { path: "/login", component: () => import("@/pages/LoginPage.vue"), meta: { title: "管理员登录" } },
    { path: "/dashboard", component: () => import("@/pages/DashboardPage.vue"), meta: { title: "概览" } },
    { path: "/families", component: () => import("@/pages/FamiliesPage.vue"), meta: { title: "家族管理" } },
    { path: "/families/new", component: () => import("@/pages/FamilyFormPage.vue"), meta: { title: "新增家族" } },
    { path: "/families/:id/edit", component: () => import("@/pages/FamilyFormPage.vue"), meta: { title: "编辑家族" } },
    { path: "/members", component: () => import("@/pages/MembersPage.vue"), meta: { title: "成员管理" } },
    { path: "/members/new", component: () => import("@/pages/MemberFormPage.vue"), meta: { title: "新增成员" } },
    { path: "/members/:id/edit", component: () => import("@/pages/MemberFormPage.vue"), meta: { title: "编辑成员" } },
    { path: "/genealogy", component: () => import("@/pages/GenealogyPage.vue"), meta: { title: "族谱管理" } },
    { path: "/genealogy/new", component: () => import("@/pages/GenealogyFormPage.vue"), meta: { title: "新增族谱人物" } },
    { path: "/genealogy/:id/edit", component: () => import("@/pages/GenealogyFormPage.vue"), meta: { title: "编辑族谱人物" } },
    { path: "/tombs", component: () => import("@/pages/TombsPage.vue"), meta: { title: "点位管理" } },
    { path: "/tombs/new", component: () => import("@/pages/TombFormPage.vue"), meta: { title: "新增点位" } },
    { path: "/tombs/:id/edit", component: () => import("@/pages/TombFormPage.vue"), meta: { title: "编辑点位" } },
    { path: "/tasks", component: () => import("@/pages/TasksPage.vue"), meta: { title: "年度任务" } },
    { path: "/tasks/new", component: () => import("@/pages/TaskFormPage.vue"), meta: { title: "新增年度任务" } },
    { path: "/messages", component: () => import("@/pages/MessagesPage.vue"), meta: { title: "留言审核" } },
    { path: "/routes", component: () => import("@/pages/RoutesPage.vue"), meta: { title: "线路设置" } },
    { path: "/routes/new", component: () => import("@/pages/RouteFormPage.vue"), meta: { title: "新增路线模板" } },
    { path: "/routes/:id/edit", component: () => import("@/pages/RouteFormPage.vue"), meta: { title: "编辑路线模板" } },
    { path: "/settings", component: () => import("@/pages/SettingsPage.vue"), meta: { title: "系统设置" } },
    { path: "/about", component: () => import("@/pages/AboutPage.vue"), meta: { title: "关于" } },
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

  if (to.path.startsWith("/families") && authStore.profile?.role !== "super_admin") {
    return "/dashboard";
  }

  return true;
});
