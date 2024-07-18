<script setup lang="ts">
  import type { ChatSession } from 'database';

  const { t } = useTranslations();
  const { user } = useUser();

  definePageMeta({
    layout: "saas-chat",
  });

  const { apiCaller } = useApiCaller();

  const selectedSession = ref<ChatSession | null>(null);
  const sessions = ref([]);

  const handleSessionSelected = (session: ChatSession) => {
    selectedSession.value = session;
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

      <SaasSession  v-if="selectedSession" :selectedSession="selectedSession" />
    </div>
  </div>
</template>
