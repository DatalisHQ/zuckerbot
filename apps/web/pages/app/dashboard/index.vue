<script setup lang="ts">
  definePageMeta({
    layout: "saas-chat",
  });

  const creatingSession = ref(false);

  const handleSessionCreating = () => {
    creatingSession.value = true;
  };
</script>

<template>
  <SaasSessionsSidebar
    :creatingSession="creatingSession"
    @session-creating="handleSessionCreating"
  />
  <div class="h-full p-8">
    <SaasCreateSession
      :creatingSession="creatingSession"
      @session-creating="handleSessionCreating"
    />
  </div>
</template>
