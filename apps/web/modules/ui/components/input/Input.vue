<script setup lang="ts">
  import type { HTMLAttributes } from "vue";
  import { cn } from "@/modules/ui/lib/utils";

  const props = defineProps<{
    defaultValue?: string | number;
    modelValue?: string | number;
    class?: HTMLAttributes["class"];
  }>();

  const emits =
    defineEmits<(e: "update:modelValue", payload: string | number) => void>();

  const modelValue = useVModel(props, "modelValue", emits, {
    passive: true,
    defaultValue: props.defaultValue,
  });
</script>

<template>
  <input
    v-model="modelValue"
    :class="
      cn(
        'border-input placeholder:text-muted-foreground focus-visible:ring-ring focus-visible:border-primary flex h-10 w-full rounded-sm border bg-transparent px-3 py-1 text-base transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:outline-none focus-visible:ring-1 disabled:cursor-not-allowed disabled:opacity-50',
        props.class,
      )
    "
  />
</template>
