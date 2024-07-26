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
    class="flex size-full flex-col content-center items-center justify-center"
  >
    <Logo size="size-32" :with-label="false" />
    <div class="mb-4 max-w-96 text-center">
      Start chatting with ZuckerBot to optimize your ad campaigns, receive
      expert recommendations, and manage your ads across multiple platforms
      seamlessly.
    </div>
    <Button :loading="pending" @click="createSession">
      <Wand2Icon class="mr-2 size-4" />
      New session
    </Button>
  </div>
</template>
