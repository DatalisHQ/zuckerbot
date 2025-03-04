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
  <span class="flex items-center font-semibold leading-none text-primary">
    <img :class="size" class="block max-w-none" src="/logo.png" />
    <span
      v-if="props.withLabel"
      class="ml-3 hidden text-lg text-foreground md:block"
      >ZuckerBot</span
    >
  </span>
</template>
