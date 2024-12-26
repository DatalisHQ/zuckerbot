<script setup lang="ts">
  import { UserIcon, BotIcon } from "lucide-vue-next";
  import type { Message } from "@ai-sdk/vue";
  import { useAssistant } from "@ai-sdk/vue";
  import { isPaidUser } from "utils";
  import { marked } from "marked";
  import { nextTick, ref, onMounted, watch, computed } from "vue";
  import SaasSessionInput from "./SaasSessionInput.vue";

  const { user } = useUser();
  const { apiCaller } = useApiCaller();

  const props = defineProps({
    selectedSession: {
      type: Object,
      required: true,
    },
    initialMessage: {
      type: [String, null],
      default: null,
    },
  });

  const chatInstance = ref();
  const messagesContainer = ref<HTMLElement | null>(null);

  const scrollToBottom = async () => {
    await nextTick();
    if (messagesContainer.value) {
      messagesContainer.value.scrollTo({
        top: messagesContainer.value.scrollHeight,
        behavior: "smooth",
      });
    }
  };

  watch(
    () => chatInstance.value?.messages,
    () => {
      scrollToBottom();
    },
    { deep: true },
  );

  useAsyncData(`chat-${props.selectedSession.id}`, async () => {
    const [session, messages] = await Promise.all([
      apiCaller.chat.byId.query({
        id: props.selectedSession.id as string,
      }),
      apiCaller.chat.messages.query({
        sessionId: props.selectedSession.id as string,
      }),
    ]);

    chatInstance.value = useAssistant({
      api: "/api/assistant",
      body: {
        sessionId: session.id,
      },
      ...(session.threadId !== null && {
        threadId: session.threadId,
      }),
    });

    if (messages.length > 0) {
      const existingMessages: Message[] = messages.map((message) => ({
        id: message.id,
        content: message.text,
        role: message.sender as "user" | "data" | "system" | "assistant",
        createdAt: message.createdAt,
      }));

      chatInstance.value.messages = existingMessages;
    }

    if (props.initialMessage) {
      chatInstance.value.input = props.initialMessage;
      await nextTick();
      handleSubmit();
    }

    await scrollToBottom();

    return {
      session,
      messages,
    };
  });

  const formatMessage = (text: string) => {
    const renderer = new marked.Renderer();

    renderer.link = ({ href, title, text: linkText }: any) => {
      const titleAttr = title ? ` title="${title}"` : "";
      const parsedText = marked.parseInline(linkText, { renderer });
      return `<a href="${href}" class="text-blue-500 hover:text-blue-700 underline" target="_blank" rel="noopener noreferrer"${titleAttr}>${parsedText}</a>`;
    };

    renderer.strong = ({ text: strongText }: any) => {
      const parsedText = marked.parseInline(strongText, { renderer });
      return `<strong class="font-bold">${parsedText}</strong>`;
    };

    const paragraphs = text.split(/\n\n/).filter((p) => p.trim());

    return paragraphs
      .map((paragraph, index) => {
        const isLast = index === paragraphs.length - 1;
        const parsedContent = marked
          .parse(paragraph, {
            renderer,
            gfm: true,
            breaks: true,
          })
          .replace(/<\/?p>/g, "");

        return `<p class="${isLast ? "m-0" : "mb-6"}">${parsedContent}</p>`;
      })
      .join("");
  };

  const handleSubmit = async () => {
    await chatInstance.value?.handleSubmit();
    scrollToBottom();
  };

  const isReady = computed(() => Boolean(chatInstance.value));

  onMounted(() => {
    scrollToBottom();
  });
</script>

<template>
  <div
    class="bg-card text-foreground container mt-4 h-full max-w-6xl rounded-sm border p-8"
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
                class="whitespace-pre-line rounded-sm px-4 py-2"
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
          <div
            v-if="!isPaidUser(user) && chatInstance.messages.length > 6"
            class="absolute bottom-0 left-0 space-y-4 rounded-sm border border-red-200 bg-red-50 p-6"
          >
            <div class="flex flex-col space-y-6">
              <div class="space-y-3">
                <p class="text-lg font-semibold text-red-900">
                  Ready to unlock unlimited conversations?
                </p>
                <p class="text-red-700">
                  To continue using the chat, please
                  <a
                    href="https://zuckerbot.ai/app/settings/team/billing"
                    class="font-medium text-red-600 underline hover:text-red-800"
                    target="_blank"
                    rel="noopener noreferrer"
                    >upgrade your plan</a
                  >.
                </p>
              </div>
              <div class="space-y-3">
                <p class="font-semibold text-red-900">A Special Note:</p>
                <p class="leading-relaxed text-red-700">
                  We understand that not everyone may be ready or able to pay
                  for ZuckerBot at this time, and we don't want that to stop you
                  from benefiting from the platform. If that's the case, please
                  feel free to contact us directly at
                  <a
                    href="mailto:support@zuckerbot.ai"
                    class="font-medium text-red-600 underline hover:text-red-800"
                    >support@zuckerbot.ai</a
                  >.
                </p>
                <p class="leading-relaxed text-red-700">
                  We'd love to hear from you, gather your feedback, and see how
                  we can continue to support you. Thank you for being part of
                  the ZuckerBot community! Your support helps us build something
                  truly valuable, and we can't wait to continue this journey
                  with you.
                </p>
              </div>
            </div>
          </div>
          <div class="bg-card absolute bottom-0 left-0 w-full" v-else>
            <div class="flex w-full items-center space-x-2">
              <SaasSessionInput
                v-model="chatInstance.input"
                @submit="handleSubmit"
              />
            </div>
          </div>
        </div>
        <div v-else><!-- Loading messages... --></div>
      </div>
    </div>
  </div>
</template>
