# components/SaasSession.vue
<script setup lang="ts">
  import {
    UserIcon,
    BotIcon,
    ImagePlus,
    PaperclipIcon,
    LoaderCircleIcon,
    XIcon,
  } from "lucide-vue-next";
  import type { Message } from "@ai-sdk/vue";
  import { useAssistant } from "@ai-sdk/vue";
  import { isPaidUser } from "utils";
  import { marked } from "marked";
  import { nextTick, ref, onMounted, watch, computed } from "vue";
  import SaasSessionInput from "./SaasSessionInput.vue";
  import { useDropZone } from "@vueuse/core";
  import { v4 as uuid } from "uuid";

  const { user } = useUser();
  const { apiCaller } = useApiCaller();
  const config = useRuntimeConfig();

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
  const uploadingFiles = ref(false);
  const dropZoneRef = ref<HTMLDivElement>();
  const fileInputRef = ref<HTMLInputElement | null>(null);
  const uploadedFiles = ref<{ name: string; url: string }[]>([]);
  const files = ref<File[]>([]);

  const getSignedUploadUrlMutation =
    apiCaller.uploads.signedUploadUrl.useMutation();

  const uploadFileToS3 = async (file: File) => {
    const path = `uploads/${uuid()}-${file.name}`;
    const uploadUrl = await getSignedUploadUrlMutation.mutate({
      path,
      bucket: config.public.s3AvatarsBucketName,
    });

    if (!uploadUrl) {
      throw new Error("Failed to get upload url");
    }

    await fetch(uploadUrl, {
      method: "PUT",
      body: file,
      headers: {
        "Content-Type": file.type,
      },
    });

    // Construct public URL directly
    const publicUrl = `${config.public.s3.endpoint}/${config.public.s3AvatarsBucketName}/${path}`;
    console.log("Uploaded file to:", publicUrl);
    return { name: file.name, url: publicUrl, path };
  };

  const handleFiles = async (newFiles: File[] | null) => {
    if (!newFiles?.length) return;

    files.value = Array.from(newFiles);
    uploadingFiles.value = true;

    // Process files in batches of 1
    const batchSize = 1;
    const fileBatches = Array.from(
      { length: Math.ceil(files.value.length / batchSize) },
      (_, i) => files.value.slice(i * batchSize, (i + 1) * batchSize),
    );

    try {
      const allUploads = [];

      // Process each batch sequentially
      for (const batch of fileBatches) {
        const batchResults = await Promise.all(
          batch.map((file) => uploadFileToS3(file)),
        );
        allUploads.push(...batchResults);

        // Optional: Add a small delay between batches
        await new Promise((resolve) => setTimeout(resolve, 500));
      }

      uploadedFiles.value.push(...allUploads);
    } catch (e) {
      console.error("Error uploading files:", e);
    } finally {
      uploadingFiles.value = false;
    }
  };

  const onFilesSelected = async (event: Event) => {
    const input = event.target as HTMLInputElement;
    await handleFiles(input.files ? Array.from(input.files) : null);
  };

  const onDrop = async (droppedFiles: File[] | null) => {
    await handleFiles(droppedFiles);
  };

  const removeFile = (fileIndex: number) => {
    uploadedFiles.value.splice(fileIndex, 1);
  };

  const { isOverDropZone } = useDropZone(dropZoneRef, {
    onDrop,
    dataTypes: ["image/jpeg", "image/png", "image/gif", "image/webp"],
    multiple: true,
    preventDefaultForUnhandled: false,
  });

  const scrollToBottom = async () => {
    await nextTick();
    if (messagesContainer.value) {
      messagesContainer.value.scrollTo({
        top: messagesContainer.value.scrollHeight,
        behavior: "smooth",
      });
    }
  };

  const formatMessage = (content: string) => {
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

    const parseOptions = {
      renderer,
      gfm: true,
      breaks: true,
    };

    try {
      const parsed = JSON.parse(content);

      // If it's not an array, process as regular markdown
      if (!Array.isArray(parsed)) {
        return marked.parse(content, parseOptions);
      }

      // Process each item separately and join with proper spacing
      const formattedContent = parsed
        .map((item, index, array) => {
          if (item.type === "text") {
            const parsedText = marked.parse(item.text, parseOptions);
            // Remove outer <p> tags if present and wrap with our own paragraph
            const cleanText = parsedText.replace(/<\/?p>/g, "").trim();
            const isLast = index === array.length - 1;
            return `<p class="${isLast ? "m-0" : "mb-3"}">${cleanText}</p>`;
          }
          if (item.type === "image_url") {
            return `<div class="flex flex-wrap w-full">
              <img 
                src="${item.image_url.url}" 
                alt="Image" 
                class="w-full h-auto rounded max-w-[180px]" 
                loading="lazy"
              />
            </div>`;
          }
          return "";
        })
        .filter(Boolean)
        .join("\n");

      return formattedContent;
    } catch (e) {
      // If parsing fails, treat as markdown
      const parsedContent = marked.parse(content, parseOptions);
      // Remove outer <p> tags if present and wrap with our own paragraph
      const cleanContent = parsedContent.replace(/<\/?p>/g, "").trim();
      return `<p class="m-0">${cleanContent}</p>`;
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

    const today = new Date().toISOString();

    chatInstance.value = useAssistant({
      api: "/api/assistant",
      body: {
        sessionId: session.id,
        data: {
          today,
          currentTimezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        },
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

  const handleSubmit = async () => {
    if (!chatInstance.value?.input?.trim() && !uploadedFiles.value.length) {
      return;
    }

    try {
      // Create the content array
      const content = [];

      // Add text if present
      if (chatInstance.value?.input?.trim()) {
        content.push({
          type: "text",
          text: chatInstance.value.input.trim(),
        });
      }

      // Add images with proper OpenAI format
      for (const file of uploadedFiles.value) {
        content.push({
          type: "image_url",
          image_url: {
            url: file.url,
          },
        });
      }

      // Set the JSON string as the input value
      chatInstance.value.input = JSON.stringify(content);
      console.log("Setting input to:", chatInstance.value.input);

      // Send through the assistant hook
      await chatInstance.value?.handleSubmit();

      // Clear the uploaded files
      uploadedFiles.value = [];
      scrollToBottom();
    } catch (error) {
      console.error("Error submitting:", error);
    }
  };

  const isReady = computed(() => Boolean(chatInstance.value));

  onMounted(() => {
    scrollToBottom();
  });
</script>

<template>
  <div ref="dropZoneRef">
    <Transition
      enter="transition-opacity duration-200"
      enter-from="opacity-0"
      enter-to="opacity-100"
      leave="transition-opacity duration-200"
      leave-from="opacity-100"
      leave-to="opacity-0"
    >
      <div
        v-if="isOverDropZone"
        class="absolute inset-0 z-50 flex flex-col items-center justify-center bg-blue-500/20 backdrop-blur-sm"
      >
        <div class="rounded-sm bg-white p-6 shadow-lg">
          <div class="flex flex-col items-center gap-4">
            <ImagePlus class="size-12 text-blue-500" />
            <p class="text-lg font-medium text-gray-900">
              Drop your images here
            </p>
            <p class="text-sm text-gray-500">Release to upload</p>
          </div>
        </div>
      </div>
    </Transition>

    <div class="relative h-[calc(100vh-85px)]" v-if="isReady">
      <div
        ref="messagesContainer"
        class="scroll-hidden h-[calc(100vh-139px)] overflow-y-scroll pb-24 pt-8"
      >
        <div class="my-16">
          <div class="text-5xl">Hello, {{ user?.name }}.</div>
        </div>
        <div
          v-for="message in chatInstance.messages"
          :key="message.id"
          class="mb-4 flex items-start gap-2"
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
                message.role === 'user' ? 'bg-primary/50' : 'bg-primary/5',
                message.content.includes('![') ? 'w-[664px]' : 'max-w-[664px]',
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
                We understand that not everyone may be ready or able to pay for
                ZuckerBot at this time, and we don't want that to stop you from
                benefiting from the platform. If that's the case, please feel
                free to contact us directly at
                <a
                  href="mailto:support@zuckerbot.ai"
                  class="font-medium text-red-600 underline hover:text-red-800"
                  >support@zuckerbot.ai</a
                >.
              </p>
              <p class="leading-relaxed text-red-700">
                We'd love to hear from you, gather your feedback, and see how we
                can continue to support you. Thank you for being part of the
                ZuckerBot community! Your support helps us build something truly
                valuable, and we can't wait to continue this journey with you.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div class="absolute bottom-0 left-0 w-full">
        <div class="relative flex w-full items-center">
          <div
            v-if="uploadedFiles.length > 0"
            class="absolute bottom-full mb-3 flex flex-wrap items-start gap-4"
          >
            <div
              v-for="(file, index) in uploadedFiles"
              :key="file.url"
              class="relative flex items-center gap-2 rounded bg-white shadow"
            >
              <div
                class="relative size-20 shrink-0 overflow-hidden rounded-sm bg-gray-100"
              >
                <div
                  v-if="!file.url"
                  class="absolute inset-0 flex items-center justify-center"
                >
                  <ImageIcon class="size-5 text-gray-400" />
                </div>
                <img
                  v-else
                  :src="file.url"
                  :alt="file.name"
                  class="absolute inset-0 size-full object-cover"
                />
              </div>

              <div class="absolute -right-2 -top-2 rounded-full bg-white p-1">
                <XIcon
                  class="size-3 cursor-pointer text-gray-500 hover:text-gray-600"
                  @click="removeFile(index)"
                />
              </div>
            </div>
          </div>

          <SaasSessionInput
            v-model="chatInstance.input"
            @submit="handleSubmit"
            :show-quick-actions="uploadedFiles.length === 0"
          />
          <input
            type="file"
            multiple
            accept="image/*"
            @change="onFilesSelected"
            class="hidden"
            ref="fileInputRef"
          />

          <div
            class="absolute bottom-5 right-3 cursor-pointer"
            @click="fileInputRef?.click()"
          >
            <PaperclipIcon
              class="size-5 cursor-pointer"
              v-if="!uploadingFiles"
            />
            <LoaderCircleIcon class="size-5 animate-spin" v-else />
          </div>
        </div>
      </div>
    </div>
    <div v-else><!-- Loading messages... --></div>
  </div>
</template>

<style scoped>
  .transition-opacity {
    transition-property: opacity;
  }
  .duration-200 {
    transition-duration: 200ms;
  }
  .opacity-0 {
    opacity: 0;
  }
  .opacity-100 {
    opacity: 1;
  }
</style>
