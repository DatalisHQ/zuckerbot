<script setup lang="ts">
  import { UserIcon, BotIcon } from "lucide-vue-next";
  import { marked } from "marked";
  import { getInitialMessage } from "utils";

  const props = defineProps({
    selectedSession: {
      type: Object,
      required: true,
    },
  });

  const { user } = useUser();
  const { apiCaller } = useApiCaller();
  const messages = ref<any[]>([]);

  const formatMessage = (text: string) => {
    // Create a custom renderer
    const renderer = new marked.Renderer();

    // Override the default link rendering method to include target="_blank"
    renderer.link = ({ href, title, text }) => {
      const titleAttr = title ? ` title="${title}"` : "";
      return `<a href="${href}" target="_blank" rel="noopener noreferrer"${titleAttr}>${text}</a>`;
    };

    // Parse the text with the custom renderer
    return marked.parse(text, { renderer });
  };

  const initChat = async () => {
    try {
      messages.value.push({
        id: Math.random().toString(36).substring(7),
        sender: "assistant",
        text: "Writing a message...",
      });

      // Initial welcome message
      const initialMessage = getInitialMessage(user);

      const response = await apiCaller.chat.createMessage.mutate({
        sessionId: props.selectedSession.id,
        threadId: props.selectedSession.threadId,
        assistantId: props.selectedSession.assistantId,
        sender: "assistant",
        text: initialMessage,
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

  const onMessageReceived = async () => {
    messages.value.splice(messages.value.length - 1, 1);
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
                    class="session-message max-w-lg break-words"
                    :class="[
                      message.sender === 'user'
                        ? 'text-primary-foreground'
                        : 'text-primary-background',
                    ]"
                    v-html="formatMessage(message.text)"
                  ></span>
                </div>
              </div>
            </li>
          </ul>
        </div>
      </div>
      <SaasSessionInput
        :selectedSession="selectedSession"
        @messageReceived="onMessageReceived"
        @messageCreated="onMessageCreated"
      />
    </div>
  </div>
</template>
