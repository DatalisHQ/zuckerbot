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
  <div class="h-full p-8">
    <div class="flex h-full flex-col items-start gap-8 md:flex-row">
      <div class="size-full md:max-w-[200px]">
        <SaasSessionsSidebar
          :creatingSession="creatingSession"
          @session-creating="handleSessionCreating"
        />
      </div>

      <SaasCreateSession
        :creatingSession="creatingSession"
        @session-creating="handleSessionCreating"
      />
    </div>
  </div>
</template>
