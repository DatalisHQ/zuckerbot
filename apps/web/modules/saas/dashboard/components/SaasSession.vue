<script setup lang="ts">
  import { UserIcon, BotIcon, SendHorizonalIcon } from "lucide-vue-next";
  import type { Message } from "@ai-sdk/vue";
  import { useAssistant } from "@ai-sdk/vue";
  import { getInitialMessage } from "utils";
  import { marked } from "marked";
  import { nextTick, ref, onMounted, watch } from "vue";

  const { user } = useUser();
  const { apiCaller } = useApiCaller();

  const props = defineProps({
    selectedSession: {
      type: Object,
      required: true,
    },
  });

  const chatInstance = ref();
  const messagesContainer = ref<HTMLElement | null>(null);

  // Function to scroll to bottom
  const scrollToBottom = async () => {
    await nextTick();
    if (messagesContainer.value) {
      messagesContainer.value.scrollTo({
        top: messagesContainer.value.scrollHeight,
        behavior: "smooth",
      });
    }
  };

  // Watch for changes in messages to trigger scroll
  watch(
    () => chatInstance.value?.messages,
    () => {
      scrollToBottom();
    },
    { deep: true },
  );

  useAsyncData(`chat-${props.selectedSession.id}`, async () => {
    // Fetch both session and messages in parallel
    const [session, messages] = await Promise.all([
      apiCaller.chat.byId.query({
        id: props.selectedSession.id as string,
      }),
      apiCaller.chat.messages.query({
        sessionId: props.selectedSession.id as string,
      }),
    ]);

    // Add initial message if needed
    const initialMessage = {
      id: Math.random().toString(36).substring(7),
      createdAt: new Date(),
      sender: "assistant",
      text: getInitialMessage(user),
      sessionId: props.selectedSession.id,
    };

    messages.unshift(initialMessage);

    // Initialize chat instance
    chatInstance.value = useAssistant({
      api: "/api/assistant",
      body: {
        sessionId: session.id,
      },
      ...(session.threadId !== null && {
        threadId: session.threadId,
      }),
    });

    // Set existing messages
    if (messages.length > 0) {
      const existingMessages: Message[] = messages.map((message) => ({
        id: message.id,
        content: message.text,
        role: message.sender as "user" | "data" | "system" | "assistant",
        createdAt: message.createdAt,
      }));

      chatInstance.value.messages = existingMessages;
    }

    // Initial scroll after messages are loaded
    await scrollToBottom();

    return {
      session,
      messages,
    };
  });

  const formatMessage = (text: string) => {
    const renderer = new marked.Renderer();
    renderer.link = ({ href, title, text }) => {
      const titleAttr = title ? ` title="${title}"` : "";
      return `<a href="${href}" target="_blank" rel="noopener noreferrer"${titleAttr}>${text}</a>`;
    };
    return marked.parse(text, { renderer });
  };

  // Modified form submission to include scroll
  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    await chatInstance.value.handleSubmit(e);
    scrollToBottom();
  };

  const isReady = computed(() => Boolean(chatInstance.value));

  // Scroll to bottom when component is mounted
  onMounted(() => {
    scrollToBottom();
  });
</script>

<template>
  <div
    class="bg-card text-foreground container mt-4 h-full max-w-6xl rounded-lg border p-8"
  >
    <div class="relative flex h-full flex-col">
      <div
        ref="messagesContainer"
        class="scroll-hidden h-full overflow-y-scroll pb-24"
      >
        <div v-if="isReady">
          <div
            v-for="message in chatInstance.messages"
            :key="message.id"
            class="mb-2 flex items-start gap-2"
          >
            <div class="rounded-full bg-slate-300 p-2">
              <UserIcon
                v-if="message.role === 'user'"
                class="text-primary-foreground size-4"
              />
              <BotIcon v-else class="text-primary-foreground size-4" />
            </div>
            <div class="flex">
              <div
                class="whitespace-pre-line rounded-lg rounded-tl-none px-4 py-2"
                :class="[
                  message.role === 'user' ? 'bg-primary' : 'bg-primary/5',
                ]"
              >
                <span
                  class="session-message max-w-lg break-words"
                  :class="[
                    message.role === 'user'
                      ? 'text-primary-foreground'
                      : 'text-primary-background',
                  ]"
                  v-html="formatMessage(message.content)"
                ></span>
              </div>
            </div>
          </div>

          <div class="bg-card absolute bottom-0 left-0 w-full">
            <form
              @submit="handleSubmit"
              class="flex w-full items-center space-x-2"
            >
              <div class="relative grow">
                <Input
                  v-model="chatInstance.input"
                  class="bg-card text-foreground pl-12"
                />
              </div>
              <Button class="shrink-0">
                <SendHorizonalIcon class="size-4" />
              </Button>
            </form>
          </div>
        </div>
        <div v-else>Loading messages...</div>
      </div>
    </div>
  </div>
</template>
