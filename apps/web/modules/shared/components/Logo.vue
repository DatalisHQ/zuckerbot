<script setup lang="ts">
  const props = withDefaults(
    defineProps<{
      withLabel?: boolean;
    }>(),
    {
      withLabel: true,
    },
  );
</script>

<template>
  <span class="text-primary flex items-center font-semibold leading-none">
    <img class="block size-10 max-w-none" src="/logo.png" />
    <span
      v-if="props.withLabel"
      class="text-foreground ml-1 hidden text-lg md:block"
      >ZuckerBot</span
    >
  </span>
</template>
