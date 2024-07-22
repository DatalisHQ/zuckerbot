<script setup lang="ts">
  import { Wand2Icon } from "lucide-vue-next";

  const { apiCaller } = useApiCaller();
  const emit = defineEmits(["sessionSelected"]);
  const pending = ref(false);

  const createSession = async () => {
    pending.value = true;
    try {
      const response = await apiCaller.chat.create.mutate({
        name: "New session",
      });
      emit("sessionSelected", response);
    } catch (error) {
      console.error("Error creating session:", error);
    } finally {
      pending.value = false;
    }
  };
</script>

<template>
  <div
    class="container mt-4 flex h-full max-w-6xl items-center justify-center p-8"
  >
    <Button class="mt-4" :loading="pending" @click="createSession">
      <Wand2Icon class="mr-2 size-4" />
      New session placeholder
    </Button>
  </div>
</template>
