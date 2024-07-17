<script setup lang="ts">
  const { t } = useTranslations();
  const { user } = useUser();

  definePageMeta({
    layout: "saas-app",
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
  <div class="container max-w-6xl py-8">
    <SaasSessionsSidebar :sessions="sessions" @session-selected="handleSessionSelected" />
    <SaasSession :selectedSessionId="selectedSessionId" />
  </div>
</template>
