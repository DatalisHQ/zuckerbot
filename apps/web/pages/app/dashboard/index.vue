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

  const handleSessionSelected = (session: ChatSession) => {
    selectedSession.value = session;
    fetchSessions();
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
            @session-selected="handleSessionSelected"
          />
        </div>

        <SaasSession
          v-if="selectedSession"
          :selectedSession="selectedSession"
        />
        <SaasCreateSession @session-selected="handleSessionSelected" v-else />
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
            Subscribe Now
          </NuxtLinkLocale>
        </Button>
      </div>
    </div>
  </div>
</template>
