<script setup lang="ts">
import { cn } from "@/lib/utils";

defineProps<{
  modelValue?: string;
  placeholder?: string;
  type?: string;
}>();

const emit = defineEmits<{
  "update:modelValue": [value: string];
}>();
</script>

<template>
  <input
    :value="modelValue"
    :placeholder="placeholder"
    :type="type ?? 'text'"
    :class="
      cn(
        'flex h-11 w-full rounded-xl border border-white/8 bg-[rgba(255,255,255,0.02)] px-4 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground/80 focus-visible:border-[hsl(var(--ring))] focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))/0.25]',
      )
    "
    @input="emit('update:modelValue', ($event.target as HTMLInputElement).value)"
  />
</template>
