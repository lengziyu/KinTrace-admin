<script setup lang="ts">
import { cn } from "@/lib/utils";

defineProps<{
  class?: string;
}>();
</script>

<template>
  <section
    :class="
      cn(
        'rounded-2xl border border-white/5 bg-[linear-gradient(180deg,rgba(29,31,36,0.96),rgba(24,26,31,0.96))] p-5 shadow-[0_16px_40px_rgba(0,0,0,0.22)] backdrop-blur',
        $props.class,
      )
    "
  >
    <slot />
  </section>
</template>
