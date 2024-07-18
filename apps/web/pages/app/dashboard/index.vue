<script setup lang="ts">
  const { t } = useTranslations();
  const { user } = useUser();

  definePageMeta({
    layout: "saas-chat",
  });

  const { apiCaller } = useApiCaller();

  const selectedSessionId = ref<string | null>(null);
  const sessions = ref([]);

  const handleSessionSelected = (sessionId: string) => {
    selectedSessionId.value = sessionId;
    fetchSessions();
  };


const fetchSessions = async () => {
  try {
    const response = await apiCaller.chat.sessions.query();
    sessions.value = response;
  } catch (error) {
    console.error('Error fetching sessions:', error);
  }
};

  onMounted(fetchSessions);
</script>

<template>
  <div class="h-full p-8">
    <div class="flex h-full flex-col items-start gap-8 md:flex-row">
      <div class="size-full md:max-w-[200px]">
        <SaasSessionsSidebar :sessions="sessions" @session-selected="handleSessionSelected" />
      </div>

      <SaasSession :selectedSessionId="selectedSessionId" />
    </div>
  </div>
</template>
