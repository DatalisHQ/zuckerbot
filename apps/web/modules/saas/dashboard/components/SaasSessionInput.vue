<script setup lang="ts">
  import { toTypedSchema } from "@vee-validate/zod";
  import { SendHorizonalIcon } from "lucide-vue-next";
  import { useForm } from "vee-validate";
  import { z } from "zod";

  const props = defineProps({
    selectedSessionId: {
      type: String,
      default: null,
    },
  });

  const emit = defineEmits(['messageCreated']);

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
    pending.value = true;
    const response = await apiCaller.chat.createMessage.query({
      sessionId: props.selectedSessionId,
      text: text.value,
    });

    pending.value = false;
    resetForm();
    emit('messageCreated', response);
  });
</script>

<template>
  <div>
    <form @submit="onSubmit">
      <FormField v-slot="{ componentField }" name="text">
        <FormItem>
          <FormControl>
            <Input v-bind="componentField" />
          </FormControl>
          <FormMessage />
        </FormItem>
      </FormField>

      <Button class="mt-4 w-full" :loading="pending">
        <SendHorizonalIcon class="mr-2 size-4" />
      </Button>
    </form>
  </div>
</template>
