<script setup lang="ts">
  import { Wand2Icon } from "lucide-vue-next";

  const { apiCaller } = useApiCaller();

  const pending = ref(false);
  const sessions = ref([]);

  const fetchSessions = async () => {
    try {
      const response = await apiCaller.chat.sessions.query();
      sessions.value = response;
    } catch (error) {
      console.error('Error fetching sessions:', error);
    }
  };

  const createSession = async () => {
    pending.value = true;
    try {
      const response = await apiCaller.chat.create.mutate({
          name: 'New session',
        });
    
      fetchSessions();
    } catch (error) {
      console.error('Error creating session:', error);
    } finally {
      pending.value = false;
    }
  };

  onMounted(fetchSessions);
</script>

<template>
  <div class="flex h-full flex-col">
    <div class="flex items-center justify-between border-b border-gray-200 p-4">
      <ul>
      <li v-for="session in sessions" :key="session.id">
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