<script setup lang="ts">
  import { Wand2Icon } from "lucide-vue-next";

  const { apiCaller } = useApiCaller();
  const emit = defineEmits(["sessionSelected", "sessionCreating"]);

  const router = useRouter();

  const props = defineProps({
    creatingSession: {
      type: Boolean,
      default: false,
    },
  });

  const createSession = async () => {
    if (props.creatingSession) {
      return;
    }

    emit("sessionCreating");
    try {
      const response = await apiCaller.chat.create.mutate({
        name: "(New session)",
      });
      router.push(`/app/dashboard/${response.id}`);
    } catch (error) {
      console.error("Error creating session:", error);
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
    <Button :loading="creatingSession" @click="createSession">
      <Wand2Icon class="mr-2 size-4" />
      New session
    </Button>
  </div>
</template>
