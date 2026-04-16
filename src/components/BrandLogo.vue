<script setup lang="ts">
import { computed } from "vue";
import { cn } from "@/lib/utils";
import { useBrandStore } from "@/stores/brand";

const props = withDefaults(
  defineProps<{
    compact?: boolean;
    class?: string;
    markClass?: string;
    textClass?: string;
  }>(),
  {
    compact: false,
    class: "",
    markClass: "",
    textClass: "",
  },
);

const brandStore = useBrandStore();
const markSize = computed(() => (props.compact ? 44 : 60));
</script>

<template>
  <div :class="cn('inline-flex items-center gap-3', props.class)">
    <img
      v-if="brandStore.displayLogo"
      :src="brandStore.displayLogo"
      :alt="brandStore.settings.appNameZh"
      :width="markSize"
      :height="markSize"
      :class="cn('shrink-0 rounded-[14px] object-cover ring-1 ring-white/10', props.markClass)"
    />

    <svg
      v-else
      :width="markSize"
      :height="markSize"
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      :class="cn('shrink-0 drop-shadow-[0_10px_24px_rgba(37,99,235,0.16)]', props.markClass)"
      aria-hidden="true"
    >
      <rect x="2" y="2" width="60" height="60" rx="20" fill="url(#kintrace-admin-bg)" />
      <path d="M12 43C18.5 36.5 24.5 33.5 32 33.5C39.5 33.5 45.5 36.5 52 43" stroke="#F8FAFC" stroke-width="2.5" stroke-linecap="round" />
      <path d="M18 42C22.8 29.8 27.5 22.5 32 20C36.5 22.5 41.2 29.8 46 42" stroke="#BFDBFE" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />
      <path d="M25 20.5H39" stroke="#DBEAFE" stroke-width="2" stroke-linecap="round" />
      <path d="M28 15.5H36" stroke="#DBEAFE" stroke-width="2" stroke-linecap="round" />
      <circle cx="32" cy="14" r="2.4" fill="#DBEAFE" />
      <path d="M23 47H41" stroke="#86EFAC" stroke-width="2.5" stroke-linecap="round" />
      <path d="M20 51H44" stroke="#86EFAC" stroke-width="2.5" stroke-linecap="round" opacity="0.72" />
      <defs>
        <linearGradient id="kintrace-admin-bg" x1="8" y1="8" x2="55" y2="58" gradientUnits="userSpaceOnUse">
          <stop stop-color="#2563EB" />
          <stop offset="1" stop-color="#0F172A" />
        </linearGradient>
      </defs>
    </svg>

    <div v-if="!compact" :class="cn('min-w-0', props.textClass)">
      <p class="text-[11px] uppercase tracking-[0.35em] text-white/40">{{ brandStore.settings.appNameEn }}</p>
      <div class="mt-1 flex items-end gap-2">
        <h1 class="text-2xl font-semibold tracking-[0.08em] text-white">{{ brandStore.settings.appNameZh }}</h1>
        <span class="pb-1 text-xs text-white/42">Memorial Operations</span>
      </div>
    </div>
  </div>
</template>
