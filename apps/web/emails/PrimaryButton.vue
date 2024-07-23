<script setup lang="ts">
  const props = defineProps<{
    href: string;
  }>();

  defineOptions({
    inheritAttrs: false,
  });

  const colors = {
    primary: "#044F98",
    primaryForeground: "#ffffff",
  };
</script>

<template>
  <ERow>
    <EButton
      :href="props.href"
      :style="{
        backgroundColor: colors.primary,
        color: colors.primaryForeground,
        borderRadius: '10px',
        paddingLeft: '16px',
        paddingRight: '16px',
        paddingTop: '8px',
        paddingBottom: '8px',
      }"
      v-bind="$attrs"
    >
      <slot />
    </EButton>
  </ERow>
</template>
