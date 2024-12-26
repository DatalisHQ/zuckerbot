<script setup lang="ts">
  import { MessageSquareMoreIcon } from "lucide-vue-next";

  const { apiCaller } = useApiCaller();
  const emit = defineEmits(["sessionSelected", "sessionCreating"]);
  const router = useRouter();
  const { user } = useUser();

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const props = defineProps({
    creatingSession: {
      type: Boolean,
      default: false,
    },
  });

  const { data } = useAsyncData(
    async () => {
      try {
        const response = await apiCaller.chat.sessions.query();
        return response.slice(0, 6);
      } catch (error) {
        console.error("Error fetching sessions:", error);
      }
    },
    { immediate: true },
  );

  const handleSubmit = async () => {
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

  const handleKeyDown = (e: KeyboardEvent) => {
    // Submit on Enter, but not when Shift is pressed
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };
</script>

<template>
  <div class="my-16">
    <div class="text-5xl">Hello, {{ user?.name }}.</div>
    <div class="text-5xl">How can I help you today?</div>
  </div>
  <form @submit.prevent="handleSubmit" class="relative mb-16">
    <textarea
      class="border-primary/10 focus:border-primary/10 min-h-44 w-full resize-none rounded-sm bg-white text-gray-700 placeholder:text-gray-700 focus:outline-0 focus:ring-0 disabled:cursor-not-allowed disabled:opacity-50"
      placeholder="Chat with Zuckerbot..."
      @keydown="handleKeyDown"
      :disabled="creatingSession"
    />
    <div
      class="pointer-events-none absolute right-4 flex items-center pr-3 text-gray-700"
      style="bottom: 28px"
    >
      Press ⮐ to send
    </div>
  </form>

  <h2 class="mb-2 font-medium">Continue with recent conversations</h2>
  <div class="-mx-2 mb-16 flex flex-wrap">
    <div class="w-1/2 grow p-2" v-for="session in data" :key="session.id">
      <Card
        class="text-primary hover:bg-primary/10 flex min-h-28 cursor-pointer flex-col justify-between p-4 text-black"
      >
        <div class="mb-3">
          <MessageSquareMoreIcon class="mb-2 size-4" />
          <div class="text-xs font-medium">
            {{ session.name }}
          </div>
        </div>
        <div class="text-xs font-medium">
          {{ formatDate(session.createdAt) }}
        </div>
      </Card>
    </div>
  </div>
</template>
