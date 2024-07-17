<script setup lang="ts">
  import { Wand2Icon } from "lucide-vue-next";

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
    <div class="flex items-center justify-between border-b border-gray-200 p-4">
      <ul>
      <li v-for="session in sessions" :key="session.id" @click="selectSession(session.id)">
        {{ session.name }}
      </li>
    </ul>
    </div>
    <Button class="mt-4 w-full" :loading="pending" @click="createSession">
        <Wand2Icon class="mr-2 size-4" />
        New session
      </Button>
  </div>
</template>