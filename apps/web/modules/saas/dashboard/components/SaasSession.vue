<script setup lang="ts">
  import { UserIcon, BotIcon } from "lucide-vue-next";

  const props = defineProps({
    selectedSession: {
      type: Object,
      required: true,
    },
  });

  const { apiCaller } = useApiCaller();
  const messages = ref<any[]>([]);

  const initChat = async () => {
    try {
      messages.value.push({
        id: Math.random().toString(36).substring(7),
        sender: "assistant",
        text: "Writing a message...",
      });

      const response = await apiCaller.chat.createMessage.query({
        sessionId: props.selectedSession.id,
        threadId: props.selectedSession.threadId,
        assistantId: props.selectedSession.assistantId,
        sender: "assistant",
        text: "Hi! I'm ZuckerBot; I'm here to help you with your business on Facebook and Instagram. What do you need help with today?",
      });

      messages.value.splice(messages.value.length - 1, 1);
      messages.value.push(response);
    } catch (error) {
      console.error("Error sending message:", error);
      messages.value.splice(messages.value.length - 1, 1);
    }
  };

  const fetchMessages = async (sessionId: string | null) => {
    if (!sessionId) {
      return;
    }

    try {
      const response = await apiCaller.chat.messages.query({ sessionId });
      messages.value = response;

      if (messages.value.length === 0) {
        initChat();
      }
    } catch (error) {
      console.error("Error fetching messages:", error);
    }
  };

  const onMessageCreated = async (message: any) => {
    messages.value.push(message);
  };

  onMounted(() => {
    fetchMessages(props.selectedSession.id);
  });

  watch(
    () => props.selectedSession,
    (newSession) => {
      messages.value = [];
      fetchMessages(props.selectedSession.id);
    },
  );
</script>

<template>
  <div
    class="bg-card text-foreground container mt-4 h-full max-w-6xl rounded-lg border p-8"
  >
    <div class="relative flex h-full flex-col">
      <div class="scroll-hidden h-full overflow-y-scroll pb-24">
        <div v-if="selectedSession">
          <ul>
            <li
              v-for="message in messages"
              :key="message.id"
              class="mb-2 flex items-start gap-2"
            >
              <div class="rounded-full bg-slate-300 p-2">
                <UserIcon
                  v-if="message.sender === 'user'"
                  class="text-primary-foreground size-4"
                />
                <BotIcon v-else class="text-primary-foreground size-4" />
              </div>
              <div class="flex">
                <div
                  class="whitespace-pre-line rounded-lg rounded-tl-none px-4 py-2"
                  :class="[
                    message.sender === 'user' ? 'bg-primary' : 'bg-primary/5',
                  ]"
                >
                  <span
                    class="max-w-lg break-words"
                    :class="[
                      message.sender === 'user'
                        ? 'text-primary-foreground'
                        : 'text-primary-background',
                    ]"
                    >{{ message.text }}</span
                  >
                </div>
              </div>
            </li>
          </ul>
        </div>
      </div>
      <SaasSessionInput
        :selectedSession="selectedSession"
        @messageCreated="onMessageCreated"
      />
    </div>
  </div>
</template>
