<script setup lang="ts">
  import type { ChatSession } from "database";
  import { Wand2Icon, MessageSquareMoreIcon } from "lucide-vue-next";

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

  const { user } = useUser();
  const { apiCaller } = useApiCaller();
  const router = useRouter();

  const sessions = ref<ChatSession[]>([]);

  const selectSession = (session: ChatSession) => {
    // Navigate to the session page
    // Assuming you're using Nuxt's useRouter
    const router = useRouter();
    router.push(`/app/dashboard/${session.id}`);
  };

  const paidEmails = ["brieuc@datalis.app", "davis@datalis.app"];

  const isPaidUser = computed(() => {
    // Allow all users to access the dashboard for now
    return true;

    // if (user.value) {
    //   return user.value.isPaidUser || paidEmails.includes(user.value.email);
    // }
    // return false;
  });

  const fetchSessions = async () => {
    try {
      const response = await apiCaller.chat.sessions.query();
      sessions.value = response;
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
        name: "New session",
      });
      router.push(`/app/dashboard/${response.id}`);
    } catch (error) {
      console.error("Error creating session:", error);
    }
  };

  onMounted(fetchSessions);
</script>

<template>
  <div class="h-chat scroll-hidden flex flex-col overflow-y-auto">
    <Button
      class="mt-4 w-full shrink-0"
      :loading="creatingSession"
      @click="createSession"
    >
      <Wand2Icon class="mr-2 size-4" />
      New session
    </Button>
    <div class="flex items-center justify-between border-gray-200 py-4">
      <ul class="w-full">
        <li
          class="mt-2 w-full"
          v-for="session in sessions"
          :key="session.id"
          @click="selectSession(session)"
        >
          <Button
            class="w-full justify-start bg-slate-300"
            :class="{
              'bg-primary/50':
                selectedSession && session.id === selectedSession.id,
            }"
            ><MessageSquareMoreIcon class="mr-2 size-4" />{{
              session.name
            }}</Button
          >
        </li>
      </ul>
    </div>
  </div>
</template>
