<script setup lang="ts">
  import type { ChatSession } from "database";

  definePageMeta({
    layout: "saas-chat",
  });

  const route = useRoute();
  const { apiCaller } = useApiCaller();

  const selectedSession = ref<ChatSession | null>(null);
  const loading = ref(true);
  const error = ref<string | null>(null);
  const creatingSession = ref(false);

  const fetchSession = async () => {
    try {
      loading.value = true;
      const response = await apiCaller.chat.session.query({
        id: route.params.id,
      });
      selectedSession.value = response;
    } catch (err) {
      console.error("Error fetching session:", err);
      error.value = "Failed to load session.";
    } finally {
      loading.value = false;
    }
  };

  const handleSessionCreating = () => {
    creatingSession.value = true;
  };

  onMounted(fetchSession);
</script>

<template>
  <template v-if="selectedSession">
    <SaasSessionsSidebar
      @session-creating="handleSessionCreating"
      :creating-session="creatingSession"
      :selected-session="selectedSession"
    />
  </template>
  <div class="h-full p-8">
    <template v-if="selectedSession">
      <SaasSession :selectedSession="selectedSession" />
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
          Subscribe
        </NuxtLinkLocale>
      </Button>
    </div>
  </div>
</template>
