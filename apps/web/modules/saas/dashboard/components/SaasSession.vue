<script setup lang="ts">
  import {
    UserIcon,
    BotIcon
  } from "lucide-vue-next";
  
  const props = defineProps({
    selectedSession: {
      type: Object,
      required: true,
    },
  });
  
  const { apiCaller } = useApiCaller();
  const messages = ref<any[]>([]);

  const fetchMessages = async (sessionId: string | null) => {
    if (!sessionId) {
      return;
    }

    try {
      const response = await apiCaller.chat.messages.query({sessionId});
      messages.value = response;
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const onMessageCreated = async (message: any) => {
    messages.value.push(message);
  }

  onMounted(() => {
    fetchMessages(props.selectedSession.id);
  });

  watch(
    () => props.selectedSession,
    (newSession) => {
      messages.value = [];
      fetchMessages(props.selectedSession.id);
    }
  );
</script>


<template>
  <div class="bg-card text-foreground container mt-4 h-full max-w-6xl rounded-lg border p-8">
    <div class="relative flex h-full flex-col">
      <div class="h-full overflow-y-scroll pb-24">
        <div v-if="selectedSession">
          <ul>
            <li v-for="message in messages" :key="message.id" class="mb-2 flex items-start gap-2">
              <div class="rounded-full bg-slate-300 p-2">
                <UserIcon v-if="message.sender === 'user'" class="text-primary-foreground size-4" />
                <BotIcon v-else class="text-primary-foreground size-4" />
              </div>
              <div class="flex">
                <div class="whitespace-pre-line rounded-lg rounded-tl-none px-4 py-2" :class="[message.sender === 'user' ? 'bg-primary' : 'bg-primary/5']">
                  <span class="max-w-lg  break-words" :class="[message.sender === 'user' ? 'text-primary-foreground' : 'text-primary-background']">{{ message.text }}</span>
                </div>
              </div>
            </li>
          </ul>
        </div>
      </div>
      <SaasSessionInput :selectedSession="selectedSession" @messageCreated="onMessageCreated" />
    </div>
  </div>
</template>