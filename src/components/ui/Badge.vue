<script setup lang="ts">
import { computed } from "vue";
import { cn } from "@/lib/utils";

type BadgeVariant = "default" | "success" | "warning" | "outline";

const props = withDefaults(
  defineProps<{
    variant?: BadgeVariant;
  }>(),
  {
    variant: "default",
  },
);

const variantClasses: Record<BadgeVariant, string> = {
  default: "bg-[rgba(36,131,255,0.14)] text-[#5da0ff]",
  success: "bg-[rgba(16,185,129,0.14)] text-emerald-400",
  warning: "bg-[rgba(245,158,11,0.14)] text-amber-400",
  outline: "border border-white/8 bg-[rgba(255,255,255,0.03)] text-muted-foreground",
};

const classes = computed(() =>
  cn("inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium", variantClasses[props.variant]),
);
</script>

<template>
  <span :class="classes"><slot /></span>
</template>
