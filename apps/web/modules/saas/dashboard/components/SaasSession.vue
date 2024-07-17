<script setup lang="ts">
  const props = defineProps({
    selectedSessionId: {
      type: String,
      default: null,
    },
  });

  const { apiCaller } = useApiCaller();
  const messages = ref([]);

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

  onMounted(() => {
    fetchMessages(props.selectedSessionId);
  });

  watch(
    () => props.selectedSessionId,
    (newSessionId) => {
      fetchMessages(newSessionId);
    }
  );
</script>


<template>
  <div v-if="selectedSessionId">
    <h2>Messages for Session {{ selectedSessionId }}</h2>
    <ul>
    <li v-for="message in messages" :key="message.id">
      {{ message.text }}
    </li>
    </ul>
  </div>
  <div v-else>
    <p>Select a session to view messages</p>
  </div>
</template>