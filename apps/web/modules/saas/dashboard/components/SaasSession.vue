<script setup lang="ts">
  const props = defineProps({
    selectedSessionId: {
      type: String,
      default: null,
    },
  });

  const { apiCaller } = useApiCaller();
  const messages = ref<any[]>([]); // Update the type of messages to an array of strings

  const fetchMessages = async (sessionId: string | null) => {
    if (!sessionId) {
      return;
    }

    try {
      const response = await apiCaller.chat.messages.query({sessionId});
      messages.value = response;
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const onMessageCreated = (message: string) => {
    messages.value.push(message);
  };

  onMounted(() => {
    fetchMessages(props.selectedSessionId);
  });

  watch(
    () => props.selectedSessionId,
    (newSessionId) => {
      messages.value = [];
      fetchMessages(newSessionId);
    }
  );
</script>


<template>
  <div class="bg-card text-foreground mx-auto max-w-3xl rounded-lg border p-8">
    <div>
      <div v-if="selectedSessionId">
        <h2>Messages for Session {{ selectedSessionId }}</h2>
        <ul>
        <li v-for="message in messages" :key="message.id">
          {{ message.text }}
        </li>
        </ul>
      </div>
      <SaasSessionInput :selectedSessionId="selectedSessionId" @messageCreated="onMessageCreated" />
    </div>
  </div>
</template>