<script setup lang="ts">
  const { t } = useTranslations();
  const { user } = useUser();

  definePageMeta({
    layout: "saas-app",
  });
</script>

<template>
  <div class="container max-w-6xl py-8">
    <SessionsSidebar />
  </div>
</template>
