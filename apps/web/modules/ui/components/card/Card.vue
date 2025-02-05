<script setup lang="ts">
  import type { HTMLAttributes } from "vue";
  import { cn } from "@/modules/ui/lib/utils";

  const props = defineProps<{
    class?: HTMLAttributes["class"];
  }>();
</script>

<template>
  <div
    :class="
      cn('bg-card/75 text-card-foreground rounded-sm border', props.class)
    "
  >
    <slot />
  </div>
</template>
