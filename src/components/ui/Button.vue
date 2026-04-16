<script setup lang="ts">
import { computed, useAttrs } from "vue";
import { cn } from "@/lib/utils";

type ButtonVariant = "default" | "secondary" | "outline" | "ghost";
type ButtonSize = "default" | "sm";

const props = withDefaults(
  defineProps<{
    as?: "button" | "a";
    type?: "button" | "submit" | "reset";
    variant?: ButtonVariant;
    size?: ButtonSize;
  }>(),
  {
    as: "button",
    type: "button",
    variant: "default",
    size: "default",
  },
);

const attrs = useAttrs();

const variantClasses: Record<ButtonVariant, string> = {
  default:
    "bg-[linear-gradient(180deg,#2483ff,#1768d6)] text-primary-foreground shadow-[0_10px_24px_rgba(23,104,214,0.35)] hover:brightness-110",
  secondary:
    "bg-[linear-gradient(180deg,rgba(56,60,67,0.98),rgba(42,45,52,0.98))] text-foreground hover:border-white/10 hover:bg-secondary",
  outline:
    "border border-white/8 bg-[rgba(255,255,255,0.02)] text-foreground hover:border-white/14 hover:bg-white/5",
  ghost: "text-muted-foreground hover:bg-white/5 hover:text-foreground",
};

const sizeClasses: Record<ButtonSize, string> = {
  default: "h-10 px-4 py-2",
  sm: "h-8 px-3 text-xs",
};

const classes = computed(() =>
  cn(
    "inline-flex items-center justify-center rounded-xl text-sm font-medium transition duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
    variantClasses[props.variant],
    sizeClasses[props.size],
  ),
);
</script>

<template>
  <component :is="props.as" v-bind="attrs" :class="classes" :type="props.as === 'button' ? props.type : undefined">
    <slot />
  </component>
</template>
