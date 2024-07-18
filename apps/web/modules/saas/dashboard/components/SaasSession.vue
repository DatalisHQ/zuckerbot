<script setup lang="ts">
  import {
    UserIcon,
  } from "lucide-vue-next";


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
  <div class="bg-card text-foreground container mt-4 h-full max-w-6xl rounded-lg border p-8">
    <div class="relative flex h-full flex-col">
      <div class="h-full overflow-y-scroll">
        <div v-if="selectedSessionId">
          <ul>
            <li v-for="message in messages" :key="message.id" class="mb-2 flex items-center gap-2">
              <div class="rounded-full bg-slate-300 p-2">
                <UserIcon v-if="message.sender === 'user'" class="text-primary-foreground size-4" />
              </div>
              <div class="flex">
                <div class="bg-primary whitespace-pre-line rounded-lg px-4 py-2">
                  <span class="text-primary-foreground break-words">{{ message.text }}</span>
                </div>
              </div>
            </li>
          </ul>
        </div>
      </div>
      <SaasSessionInput :selectedSessionId="selectedSessionId" @messageCreated="onMessageCreated" />
    </div>
  </div>
</template>