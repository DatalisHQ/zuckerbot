<script setup lang="ts">
  const props = defineProps<{
    name: string;
    avatarUrl?: string | null;
  }>();
</script>

<template>
  <Avatar>
    <AvatarImage v-if="props.avatarUrl" :src="props.avatarUrl" />
    <AvatarFallback class="bg-primary/10 text-primary"> </AvatarFallback>
  </Avatar>
</template>
