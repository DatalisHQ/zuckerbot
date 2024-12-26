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

  // Create a ref to pass the initial message to SaasSession
  const initialMessage = ref<string | null>(null);

  const fetchSession = async () => {
    const sessionId = route.params.id as string;
    const pendingMessage = useState<string>(`pending-message-${sessionId}`);

    // Store the initial message in our ref
    initialMessage.value = pendingMessage.value;

    // Clear it after storing
    pendingMessage.value = "";

    try {
      loading.value = true;
      const response = await apiCaller.chat.session.query({
        id: sessionId,
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
    <div class="mx-auto max-w-3xl p-8">
      <SaasSession
        :selectedSession="selectedSession"
        :initialMessage="initialMessage"
      />
    </div>
  </template>
</template>
