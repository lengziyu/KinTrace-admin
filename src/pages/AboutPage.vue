<script setup lang="ts">
import { RouterLink } from "vue-router";
import { NButton, NCard, NGrid, NGridItem, NTag } from "naive-ui";
import BrandLogo from "@/components/BrandLogo.vue";

const APP_VERSION = "MVP 0.3.0";

const modules = [
  "家族、成员、祭扫点位、年度任务、留言与路线模板的后台维护",
  "祭拜时间设置并同步到 H5 首页倒计时",
  "本地图片上传与默认 SVG 封面兜底",
  "地图协作与实时位置共享的后台联动基础",
];

const roadmap = [
  "更细粒度的管理员权限与日志审计",
  "位置共享升级为 WebSocket 实时推送",
  "点位媒体资料压缩、分类与批量整理",
  "家谱树、通知中心与代祭业务扩展",
];
</script>

<template>
  <div class="min-h-screen px-4 py-10">
    <div class="mx-auto max-w-5xl space-y-6">
      <NCard class="admin-toolbar-card" :bordered="false">
        <div class="space-y-5 p-2">
          <BrandLogo />
          <div class="flex items-center gap-3">
            <NTag type="info" round>Admin Workspace</NTag>
            <NTag type="warning" round>{{ APP_VERSION }}</NTag>
          </div>
          <h1 class="text-3xl font-semibold text-white">宗迹后台</h1>
          <p class="max-w-3xl text-sm leading-8 text-white/56">
            宗迹后台是 KinTrace 的深灰运营控制台，面向管理员完成点位录入、年度任务编排、留言审核、路线沉淀和整体运行维护。
          </p>
        </div>
      </NCard>

      <NGrid cols="1 xl:2" responsive="screen" :x-gap="16" :y-gap="16">
        <NGridItem>
          <NCard class="admin-toolbar-card" :bordered="false" title="当前能力">
            <div class="space-y-3">
              <div
                v-for="item in modules"
                :key="item"
                class="admin-surface-muted px-4 py-3 text-sm text-white/60"
              >
                {{ item }}
              </div>
            </div>
          </NCard>
        </NGridItem>

        <NGridItem>
          <NCard class="admin-toolbar-card" :bordered="false" title="下一步优化">
            <div class="space-y-3">
              <div
                v-for="item in roadmap"
                :key="item"
                class="admin-surface-muted px-4 py-3 text-sm text-white/60"
              >
                {{ item }}
              </div>
            </div>
          </NCard>
        </NGridItem>
      </NGrid>

      <div class="flex flex-wrap gap-3">
        <RouterLink to="/login">
          <NButton type="primary">进入后台</NButton>
        </RouterLink>
        <a href="http://localhost:5173/about" target="_blank" rel="noreferrer">
          <NButton tertiary>查看 H5 介绍页</NButton>
        </a>
      </div>
    </div>
  </div>
</template>
