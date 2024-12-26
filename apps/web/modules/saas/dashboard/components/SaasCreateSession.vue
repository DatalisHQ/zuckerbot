<script setup lang="ts">
  import { MessageSquareMoreIcon, PlusIcon } from "lucide-vue-next";

  const { apiCaller } = useApiCaller();
  const emit = defineEmits(["sessionSelected", "sessionCreating"]);
  const { user } = useUser();
  const router = useRouter();

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

  const message = ref("");

  // Add quick actions
  const quickActions = [
    { id: 1, text: "I want to schedule posts" },
    { id: 2, text: "I want to create an ad" },
    { id: 3, text: "What are my best & least performing ad?" },
    { id: 4, text: "I want to see my scheduled posts" },
  ];

  // Track if dropdown is open
  const showMore = ref(false);

  // Number of buttons to show before "more"
  const visibleButtons = 2;

  // Handle quick action click
  const handleQuickAction = async (text: string) => {
    if (props.creatingSession) {
      return;
    }

    emit("sessionCreating");
    showMore.value = false;

    try {
      const response = await apiCaller.chat.create.mutate({
        name: "(New session)",
      });

      // Create a session-specific pending message state
      const pendingMessage = useState<string>(`pending-message-${response.id}`);
      pendingMessage.value = text; // Use the quick action text directly

      // Navigate to the new session
      await navigateTo(`/app/dashboard/${response.id}`);
    } catch (error) {
      console.error("Error creating session:", error);
    }
  };

  const handleSubmit = async () => {
    if (props.creatingSession || !message.value.trim()) {
      return;
    }

    emit("sessionCreating");

    try {
      const response = await apiCaller.chat.create.mutate({
        name: "(New session)",
      });

      // Create a session-specific pending message state
      const pendingMessage = useState<string>(`pending-message-${response.id}`);
      pendingMessage.value = message.value;

      // Navigate to the new session
      await navigateTo(`/app/dashboard/${response.id}`);
    } catch (error) {
      console.error("Error creating session:", error);
    }
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  // Close dropdown when clicking outside
  const dropdownRef = ref(null);
  onClickOutside(dropdownRef, () => {
    showMore.value = false;
  });
</script>

<template>
  <div class="my-16">
    <div class="text-5xl">Hello, {{ user?.name }}.</div>
    <div class="text-5xl">How can I help you today?</div>
  </div>

  <!-- Quick Actions -->
  <div class="mb-4 flex flex-wrap gap-2">
    <!-- Show first N buttons -->
    <button
      v-for="action in quickActions.slice(0, visibleButtons)"
      :key="action.id"
      @click="handleQuickAction(action.text)"
      class="rounded-full border border-gray-200 bg-white px-4 py-2 text-sm transition-colors hover:bg-gray-50"
    >
      {{ action.text }}
    </button>

    <!-- Dropdown for additional actions -->
    <div class="relative" ref="dropdownRef">
      <button
        @click="showMore = !showMore"
        class="rounded-full border border-gray-200 bg-white p-2 transition-colors hover:bg-gray-50"
        :class="{ 'bg-gray-50': showMore }"
      >
        <PlusIcon class="size-5" />
      </button>

      <!-- Dropdown menu -->
      <div
        v-if="showMore"
        class="absolute right-0 top-full z-50 mt-2 w-80 rounded-md border bg-white py-1 shadow-lg"
      >
        <button
          v-for="action in quickActions.slice(visibleButtons)"
          :key="action.id"
          @click="handleQuickAction(action.text)"
          class="block w-full px-4 py-2 text-left text-sm transition-colors hover:bg-gray-50"
        >
          {{ action.text }}
        </button>
      </div>
    </div>
  </div>

  <form @submit.prevent="handleSubmit" class="relative mb-16">
    <textarea
      v-model="message"
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
        @click="navigateTo(`/app/dashboard/${session.id}`)"
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
