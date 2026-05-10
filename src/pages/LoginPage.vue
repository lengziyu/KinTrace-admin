<script setup lang="ts">
import { ref } from "vue";
import { RouterLink, useRouter } from "vue-router";
import { NAlert, NButton, NCard, NForm, NFormItem, NInput, NSpace, NTag } from "naive-ui";
import BrandLogo from "@/components/BrandLogo.vue";
import { useAuthStore } from "@/stores/auth";

const APP_VERSION = "MVP 0.3.0";

const phone = ref("");
const password = ref("");
const router = useRouter();
const authStore = useAuthStore();
const error = ref("");

async function submit() {
  error.value = "";

  try {
    await authStore.login({
      phone: phone.value.trim(),
      password: password.value.trim(),
    });

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
              统一管理后台
            </h1>
            <p class="mt-4 max-w-2xl text-base leading-8 text-white/56">
              全部账号统一手机号 + 密码登录。超管账号固定唯一，家族管理员与普通成员使用同一套成员账号体系。
            </p>
          </div>

          <div class="grid gap-4 md:grid-cols-3">
            <div class="admin-surface-muted p-4">
              <p class="text-sm text-white/48">登录方式</p>
              <p class="mt-3 text-lg font-semibold text-white">手机号 + 密码</p>
            </div>
            <div class="admin-surface-muted p-4">
              <p class="text-sm text-white/48">普通成员</p>
              <p class="mt-3 text-lg font-semibold text-white">无法进入后台</p>
            </div>
            <div class="admin-surface-muted p-4">
              <p class="text-sm text-white/48">邀请码</p>
              <p class="mt-3 text-lg font-semibold text-white">仅首次注册使用</p>
            </div>
          </div>
        </div>
      </NCard>

      <NCard class="admin-toolbar-card" :bordered="false">
        <div class="space-y-6 p-2">
          <BrandLogo />

          <div>
            <div class="flex items-center gap-3">
              <h2 class="text-2xl font-semibold text-white">后台登录</h2>
              <NTag round size="small" type="info">{{ APP_VERSION }}</NTag>
            </div>
            <p class="mt-2 text-sm leading-7 text-white/52">
              请输入手机号和密码登录。若账号不是管理员角色，系统会自动拦截后台访问。
            </p>
          </div>

          <NAlert v-if="error" type="error" :show-icon="false">
            {{ error }}
          </NAlert>

          <NForm label-placement="top" @submit.prevent="submit">
            <NFormItem label="手机号">
              <NInput
                v-model:value="phone"
                size="large"
                placeholder="请输入手机号"
                :input-props="{ autocomplete: 'off' }"
              />
            </NFormItem>
            <NFormItem label="密码">
              <NInput
                v-model:value="password"
                size="large"
                type="password"
                show-password-on="click"
                placeholder="请输入登录密码"
                :input-props="{ autocomplete: 'new-password' }"
              />
            </NFormItem>

            <NSpace vertical :size="14">
              <NButton type="primary" block size="large" :loading="authStore.loading" @click="submit">
                {{ authStore.loading ? "登录中..." : "进入后台" }}
              </NButton>
            </NSpace>
          </NForm>

          <RouterLink to="/about" class="text-sm text-[#93c5fd]">
            查看产品介绍
          </RouterLink>
        </div>
      </NCard>
    </div>
  </div>
</template>
