<script setup lang="ts">
  import { toTypedSchema } from "@vee-validate/zod";
  import { SendHorizonalIcon } from "lucide-vue-next";
  import { useForm } from "vee-validate";
  import { z } from "zod";

  const props = defineProps({
    selectedSession: {
      type: Object,
      default: null,
    },
  });

  const emit = defineEmits(["messageCreated"]);

  const { apiCaller } = useApiCaller();

  const pending = ref(false);

  const formSchema = toTypedSchema(
    z.object({
      text: z.string().min(1),
    }),
  );

  const { handleSubmit, values, resetForm } = useForm({
    validationSchema: formSchema,
    initialValues: {
      text: "",
    },
  });

  const text = computed(() => {
    return values.text || "";
  });

  const onSubmit = handleSubmit(async () => {
    const { text } = values;

    if (!text || text === "") {
      return;
    }

    emit("messageCreated", {
      id: Math.random().toString(36).substring(7),
      sender: "user",
      text,
    });

    resetForm();

    pending.value = true;
    const response = await apiCaller.chat.createMessage.query({
      sessionId: props.selectedSession.id,
      threadId: props.selectedSession.threadId,
      assistantId: props.selectedSession.assistantId,
      sender: "user",
      text,
    });

    pending.value = false;
    emit("messageCreated", response);
  });
</script>

<template>
  <div class="absolute bottom-0 left-0 w-full">
    <form @submit="onSubmit" class="flex w-full items-center space-x-2">
      <div class="grow">
        <FormField v-slot="{ componentField }" name="text">
          <FormItem>
            <FormControl>
              <Input v-bind="componentField" class="bg-white" />
            </FormControl>
            <FormMessage />
          </FormItem>
        </FormField>
      </div>

      <Button class="shrink-0" :loading="pending">
        <SendHorizonalIcon class="size-4" />
      </Button>
    </form>
  </div>
</template>
