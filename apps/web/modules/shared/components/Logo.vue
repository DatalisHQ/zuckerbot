<script setup lang="ts">
  const props = withDefaults(
    defineProps<{
      withLabel?: boolean;
      size?: string;
    }>(),
    {
      size: "size-10",
      withLabel: true,
    },
  );
</script>

<template>
  <span class="text-primary flex items-center font-semibold leading-none">
    <img :class="size" class="block max-w-none" src="/logo.png" />
    <span
      v-if="props.withLabel"
      class="text-foreground ml-1 hidden text-lg md:block"
      >ZuckerBot</span
    >
  </span>
</template>
