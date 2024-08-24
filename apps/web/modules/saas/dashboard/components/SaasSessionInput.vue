<script setup lang="ts">
  import { toTypedSchema } from "@vee-validate/zod";
  import { useForm } from "vee-validate";
  import { z } from "zod";
  import {
    LoaderIcon,
    Trash2Icon,
    PaperclipIcon,
    SendHorizonalIcon,
  } from "lucide-vue-next";
  import { v4 as uuid } from "uuid";

  const props = defineProps({
    selectedSession: {
      type: Object,
      default: null,
    },
  });

  const formSchema = toTypedSchema(
    z.object({
      text: z.string().min(0),
    }),
  );

  const emit = defineEmits(["messageCreated", "messageReceived"]);

  const pending = ref(false);
  const uploading = ref(false);
  const files = ref<File[]>([]);
  const uploadedFiles = ref<{ name: string; url: string }[]>([]);
  const { apiCaller } = useApiCaller();

  const getSignedUploadUrlMutation =
    apiCaller.uploads.signedUploadUrl.useMutation();

  const uploadFileToS3 = async (file: File) => {
    const path = `uploads/${uuid()}-${file.name}`;
    const uploadUrl = await getSignedUploadUrlMutation.mutate({
      path,
      bucket: "datalis-avatars", // Replace with your bucket name
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

    return { name: file.name, url: uploadUrl.split("?")[0] }; // Return the URL without query parameters
  };

  const onFilesSelected = async (event: Event) => {
    const input = event.target as HTMLInputElement;
    const selectedFiles = input.files;

    if (selectedFiles?.length) {
      files.value = Array.from(selectedFiles);
      uploading.value = true;

      try {
        const uploaded = await Promise.all(files.value.map(uploadFileToS3));
        uploadedFiles.value.push(...uploaded);
        uploading.value = false;
      } catch (e) {
        console.error("Error uploading files:", e);
        uploading.value = false;
      }
    }
  };

  const removeFile = (fileIndex: number) => {
    uploadedFiles.value.splice(fileIndex, 1);
  };

  const { handleSubmit, values, resetForm } = useForm({
    validationSchema: formSchema,
    initialValues: {
      text: "",
    },
  });

  const sendMessage = handleSubmit(async () => {
    let { text } = values;

    if ((!text || text === "") && files.value.length > 0) {
      text = "Uploaded files";
    } else if (!text || text === "") {
      return;
    }

    pending.value = true;

    emit("messageCreated", {
      id: Math.random().toString(36).substring(7),
      sender: "user",
      text,
    });

    emit("messageCreated", {
      id: Math.random().toString(36).substring(7),
      sender: "assistant",
      text: "Writing a message...",
    });

    const uploadedFilesCopy = [...uploadedFiles.value];

    resetForm();
    uploadedFiles.value = [];

    const response = await apiCaller.chat.createMessage.mutate({
      sessionId: props.selectedSession.id,
      threadId: props.selectedSession.threadId,
      assistantId: props.selectedSession.assistantId,
      sender: "user",
      text,
      files: uploadedFilesCopy.map((file) => file.url),
    });

    emit("messageReceived");
    emit("messageCreated", response);

    pending.value = false;
  });

  const fileInputRef = ref<HTMLInputElement | null>(null);
</script>

<template>
  <div>
    <div class="absolute bottom-0 left-0 w-full bg-card">
      <form
        @submit.prevent="sendMessage"
        class="flex w-full items-center space-x-2"
      >
        <div class="relative grow">
          <FormField v-slot="{ componentField }" name="text">
            <FormItem>
              <FormControl>
                <Input
                  v-bind="componentField"
                  class="bg-card pl-12 text-foreground"
                />
              </FormControl>
            </FormItem>
          </FormField>
        </div>

        <Button class="shrink-0" :loading="pending">
          <SendHorizonalIcon class="size-4" />
        </Button>
      </form>
      <input
        type="file"
        multiple
        accept=".pdf,.txt,.md,.html,.xml,.tsv,.json,.yaml,.yml,.tex,.latex,.rtf,.epub,.odt,.ott,.sxw,.stw,.fodt,.uot,.doc,.docx,.dot,.dotx,.ppt,.pptx,.pps,.ppsx,.odp,.otp,.fodp,.uop"
        @change="onFilesSelected"
        class="hidden"
        ref="fileInputRef"
      />
      <div
        class="absolute left-4 top-1/2 -translate-y-1/2 cursor-pointer"
        @click="fileInputRef?.click()"
      >
        <PaperclipIcon class="size-5 cursor-pointer" />
      </div>
      <div
        v-if="uploading"
        class="absolute inset-0 flex items-center justify-center"
      >
        <LoaderIcon class="size-6 animate-spin text-primary" />
      </div>
      <div
        v-if="uploadedFiles.length > 0"
        class="absolute bottom-full mb-2 flex flex-col items-start gap-2"
      >
        <div
          v-for="(file, index) in uploadedFiles"
          :key="file.url"
          class="relative flex items-center space-x-2 rounded bg-white p-2 shadow"
        >
          <span>{{ file.name }}</span>
          <Trash2Icon
            class="size-4 cursor-pointer text-red-500"
            @click="removeFile(index)"
          />
        </div>
      </div>
    </div>
  </div>
</template>
