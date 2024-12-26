<script setup lang="ts">
  import { Wand2Icon } from "lucide-vue-next";
  import { z } from "zod";

  const { apiCaller } = useApiCaller();

  const formSchema = toTypedSchema(
    z.object({
      topic: z.string().min(1),
    }),
  );

  const { handleSubmit, values } = useForm({
    validationSchema: formSchema,
    initialValues: {
      topic: "",
    },
  });

  const topicValue = computed(() => {
    return values.topic || "";
  });

  const { data, pending, refresh, status } = useAsyncData(
    () => {
      return apiCaller.ai.generateProductNames.query({
        topic: topicValue.value,
      });
    },
    {
      immediate: false,
    },
  );

  const onSubmit = handleSubmit(async () => {
    refresh();
  });
</script>

<template>
  <div>
    <form @submit="onSubmit">
      <FormField v-slot="{ componentField }" name="topic">
        <FormItem>
          <FormControl>
            <Input v-bind="componentField" />
          </FormControl>
          <FormMessage />
        </FormItem>
      </FormField>

      <Button class="mt-4 w-full" :loading="pending && status !== 'idle'">
        <Wand2Icon class="mr-2 size-4" />
        Generate product names
      </Button>
    </form>

    <ul v-if="data" class="mt-8 grid grid-cols-1 gap-2">
      <li
        v-for="(name, key) of data"
        :key="key"
        class="rounded-sm border bg-muted p-4"
      >
        {{ name }}
      </li>
    </ul>
  </div>
</template>
