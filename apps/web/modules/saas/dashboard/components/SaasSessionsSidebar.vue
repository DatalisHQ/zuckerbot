<script setup lang="ts">
  import type { ChatSession } from "database";
  import {
    Wand2Icon,
    MessageSquareMoreIcon,
    MenuIcon,
    XIcon,
  } from "lucide-vue-next";

  const props = defineProps({
    selectedSession: {
      type: Object,
      default: null,
    },
    creatingSession: {
      type: Boolean,
      default: false,
    },
  });

  const emit = defineEmits(["sessionCreating"]);

  const { apiCaller } = useApiCaller();
  const router = useRouter();

  const sessions = ref<ChatSession[]>([]);
  const isOpen = ref(false);

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

  const selectSession = (session: ChatSession) => {
    router.push(`/app/dashboard/${session.id}`);
    isOpen.value = false;
  };

  const fetchSessions = async () => {
    try {
      const response = await apiCaller.chat.sessions.query();
      sessions.value = response.slice(0, 15);
    } catch (error) {
      console.error("Error fetching sessions:", error);
    }
  };

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

  const toggleSidebar = () => {
    isOpen.value = !isOpen.value;
  };

  onMounted(fetchSessions);
</script>

<template>
  <div>
    <!-- Trigger Button -->
    <button
      class="bg-primary hover:bg-primary/90 fixed bottom-4 left-4 z-50 flex size-12 items-center justify-center rounded-full text-white shadow-lg transition-opacity duration-300"
      :class="{
        'md:pointer-events-none md:opacity-0': isOpen,
      }"
      @click="toggleSidebar"
      @mouseenter="isOpen = true"
    >
      <MenuIcon class="hidden size-5 md:block" />
      <MenuIcon v-show="!isOpen" class="block size-5 md:hidden" />
      <XIcon v-show="isOpen" class="block size-5 md:hidden" />
    </button>

    <!-- Backdrop (mobile only) -->
    <div
      v-show="isOpen"
      class="fixed inset-0 z-30 bg-black/20 md:hidden"
      @click="toggleSidebar"
    />

    <!-- Sidebar -->
    <div
      class="fixed inset-y-0 left-0 z-40 w-[280px] bg-white shadow-lg transition-transform duration-300 ease-in-out"
      :class="{
        'translate-x-0': isOpen,
        '-translate-x-full': !isOpen,
      }"
      @mouseleave="isOpen = false"
    >
      <div class="h-chat scroll-hidden flex flex-col overflow-y-auto p-4">
        <Button
          class="mt-4 w-full shrink-0"
          :loading="creatingSession"
          @click="createSession"
        >
          <Wand2Icon class="mr-2 size-4" />
          Start a new session
        </Button>
        <div class="flex items-center justify-between border-gray-200 py-4">
          <ul class="w-full">
            <li
              class="mt-0.5 w-full"
              v-for="session in sessions"
              :key="session.id"
              @click="selectSession(session)"
            >
              <Button
                class="text-primary hover:bg-primary flex h-auto w-full justify-start px-3 py-2 hover:text-white"
                :class="
                  selectedSession && session.id === selectedSession.id
                    ? 'bg-primary text-white'
                    : 'bg-transparent text-black'
                "
              >
                <MessageSquareMoreIcon class="mr-2 size-4" />
                <div class="max-w-60 truncate text-xs font-medium leading-none">
                  {{ session.name }} - {{ formatDate(session.createdAt) }}
                </div>
              </Button>
            </li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
  .h-chat {
    height: calc(100vh - theme("spacing.16"));
  }
</style>
