<script setup lang="ts">
  import type { ChatSession } from "database";

  const { t } = useTranslations();
  const { user } = useUser();

  definePageMeta({
    layout: "saas-chat",
  });

  const { apiCaller } = useApiCaller();

  const selectedSession = ref<ChatSession | null>(null);
  const sessions = ref([]);
  const creatingSession = ref(false);

  const handleSessionSelected = (session: ChatSession) => {
    selectedSession.value = session;
    creatingSession.value = false;
    fetchSessions();
  };

  const handleSessionCreating = () => {
    creatingSession.value = true;
  };

  const fetchSessions = async () => {
    try {
      const response = await apiCaller.chat.sessions.query();
      sessions.value = response;
    } catch (error) {
      console.error("Error fetching sessions:", error);
    }
  };

  const paidEmails = ["brieuc@datalis.app", "davis@datalis.app"];

  const isPaidUser = computed(() => {
    if (user.value) {
      return user.value.isPaidUser || paidEmails.includes(user.value.email);
    }
    return false;
  });

  onMounted(fetchSessions);
</script>

<template>
  <div class="h-full p-8">
    <div class="flex h-full flex-col items-start gap-8 md:flex-row">
      <template v-if="isPaidUser">
        <div class="size-full md:max-w-[200px]">
          <SaasSessionsSidebar
            :sessions="sessions"
            :selectedSession="selectedSession"
            :creatingSession="creatingSession"
            @session-creating="handleSessionCreating"
            @session-selected="handleSessionSelected"
          />
        </div>

        <SaasSession
          v-if="selectedSession"
          :selectedSession="selectedSession"
        />
        <SaasCreateSession
          :creatingSession="creatingSession"
          @session-creating="handleSessionCreating"
          @session-selected="handleSessionSelected"
          v-else
        />
      </template>
      <div
        v-else
        class="flex size-full flex-col content-center items-center justify-center"
      >
        <Logo size="size-32" :with-label="false" />
        <div class="mb-4 max-w-96 text-center">
          A subscription is required to use ZuckerBot. Please subscribe to start
          using ZuckerBot.
        </div>
        <Button>
          <NuxtLinkLocale to="/app/settings/team/billing" class="block py-1.5">
            Try it for 14 days
          </NuxtLinkLocale>
        </Button>
      </div>
    </div>
  </div>
</template>
