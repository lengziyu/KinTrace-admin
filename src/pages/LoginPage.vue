<script setup lang="ts">
import { computed, ref } from "vue";
import { RouterLink, useRouter } from "vue-router";
import { NAlert, NButton, NCard, NForm, NFormItem, NInput, NSpace, NTag } from "naive-ui";
import BrandLogo from "@/components/BrandLogo.vue";
import { useAuthStore } from "@/stores/auth";

const APP_VERSION = "MVP 0.3.0";

const username = ref("admin");
const password = ref("KinTrace123");
const router = useRouter();
const authStore = useAuthStore();
const error = ref("");
const loadingText = computed(() => (authStore.loading ? "登录中..." : "进入后台"));

async function submit() {
  error.value = "";

  try {
    await authStore.login(username.value, password.value);
    await router.push("/dashboard");
  } catch (submitError) {
    error.value = submitError instanceof Error ? submitError.message : "登录失败，请稍后重试";
  }
}
</script>

<template>
  <div class="flex min-h-screen items-center justify-center px-4 py-10">
    <div class="grid w-full max-w-6xl gap-6 lg:grid-cols-[1.1fr_460px]">
      <NCard class="admin-toolbar-card hidden lg:block" :bordered="false">
        <div class="flex h-full flex-col justify-between gap-10 p-4">
          <div>
            <div class="flex items-center gap-3">
              <NTag type="info" round size="small">KinTrace Admin</NTag>
              <NTag type="warning" round size="small">{{ APP_VERSION }}</NTag>
            </div>
            <h1 class="mt-5 text-4xl font-semibold leading-[1.25] text-white">
              家族祭扫协作
              <br />
              深灰运营控制台
            </h1>
            <p class="mt-4 max-w-2xl text-base leading-8 text-white/56">
              用统一的后台完成家族、成员、祭扫点位、年度任务、留言审核与路线模板管理。地图优先，录入效率优先，视觉保持克制与庄重。
            </p>
          </div>

          <div class="grid gap-4 md:grid-cols-3">
            <div class="admin-surface-muted p-4">
              <p class="text-sm text-white/48">后台账号</p>
              <p class="mt-3 text-lg font-semibold text-white">admin</p>
            </div>
            <div class="admin-surface-muted p-4">
              <p class="text-sm text-white/48">默认密码</p>
              <p class="mt-3 text-lg font-semibold text-white">KinTrace123</p>
            </div>
            <div class="admin-surface-muted p-4">
              <p class="text-sm text-white/48">当前风格</p>
              <p class="mt-3 text-lg font-semibold text-white">Naive 深灰控制台</p>
            </div>
          </div>
        </div>
      </NCard>

      <NCard class="admin-toolbar-card" :bordered="false">
        <div class="space-y-6 p-2">
          <BrandLogo />

          <div>
            <div class="flex items-center gap-3">
              <h2 class="text-2xl font-semibold text-white">管理员登录</h2>
              <NTag round size="small" type="info">{{ APP_VERSION }}</NTag>
            </div>
            <p class="mt-2 text-sm leading-7 text-white/52">
              超级管理员可维护家族空间与品牌设置，家族管理员聚焦所属家族的成员、点位、任务和留言。
            </p>
          </div>

          <NAlert v-if="error" type="error" :show-icon="false">
            {{ error }}
          </NAlert>

          <NForm label-placement="top" @submit.prevent="submit">
            <NFormItem label="用户名">
              <NInput
                v-model:value="username"
                size="large"
                placeholder="请输入管理员用户名"
              />
            </NFormItem>
            <NFormItem label="密码">
              <NInput
                v-model:value="password"
                size="large"
                type="password"
                show-password-on="click"
                placeholder="请输入登录密码"
              />
            </NFormItem>

            <NSpace vertical :size="14">
              <NButton type="primary" block size="large" :loading="authStore.loading" @click="submit">
                {{ loadingText }}
              </NButton>
              <RouterLink to="/about" class="text-sm text-[#93c5fd]">
                查看产品介绍
              </RouterLink>
            </NSpace>
          </NForm>
        </div>
      </NCard>
    </div>
  </div>
</template>
