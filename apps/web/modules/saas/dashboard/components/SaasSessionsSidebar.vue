<script setup lang="ts">
  import { Wand2Icon, MessageSquareMoreIcon } from "lucide-vue-next";

  const props = defineProps({
    sessions: {
      type: Array,
      required: true,
    },
  });

  const { apiCaller } = useApiCaller();
  const emit = defineEmits(['session-selected']);
  const pending = ref(false);

  const selectSession = (sessionId: string) => {
    emit('sessionSelected', sessionId);
  };

  const createSession = async () => {
    pending.value = true;
    try {
      const response = await apiCaller.chat.create.mutate({
          name: 'New session',
        });
      emit('sessionSelected', response.id); 
    } catch (error) {
      console.error('Error creating session:', error);
    } finally {
      pending.value = false;
    }
  };
</script>

<template>
  <div class="flex h-full flex-col">
    <Button class="mt-4 w-full" :loading="pending" @click="createSession">
      <Wand2Icon class="mr-2 size-4" />
      New session
    </Button>
    <div class="flex items-center justify-between border-gray-200 py-4">
      <ul class="w-full">
        <li class="mt-2 w-full" v-for="session in sessions" :key="session.id" @click="selectSession(session.id)">
          <Button class="w-full justify-start bg-slate-300"><MessageSquareMoreIcon class="mr-2 size-4"/>{{ session.name }}</Button>
        </li>
      </ul>
    </div>
  </div>
</template>