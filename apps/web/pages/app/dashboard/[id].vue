<script setup lang="ts">
  import type { ChatSession } from "database";

  definePageMeta({
    layout: "saas-chat",
  });

  const route = useRoute();
  const router = useRouter();

  const { t } = useTranslations();
  const { user } = useUser();
  const { apiCaller } = useApiCaller();

  const selectedSession = ref<ChatSession | null>(null);
  const loading = ref(true);
  const error = ref<string | null>(null);
  const creatingSession = ref(false);

  const paidEmails = ["brieuc@datalis.app", "davis@datalis.app"];

  const isPaidUser = computed(() => {
    return true;

    // if (user.value) {
    //   return user.value.isPaidUser || paidEmails.includes(user.value.email);
    // }
    // return false;
  });

  const fetchSession = async () => {
    if (!isPaidUser.value) {
      router.replace("/app/dashboard"); // Redirect to dashboard if not paid
      return;
    }
    try {
      loading.value = true;
      const response = await apiCaller.chat.session.query({
        id: route.params.id,
      });
      selectedSession.value = response;
    } catch (err) {
      console.error("Error fetching session:", err);
      error.value = "Failed to load session.";
    } finally {
      loading.value = false;
    }
  };

  const handleSessionCreating = () => {
    creatingSession.value = true;
  };

  onMounted(fetchSession);
</script>

<template>
  <div class="h-full p-8">
    <div class="flex h-full flex-col items-start gap-8 md:flex-row">
      <template v-if="isPaidUser">
        <template v-if="selectedSession">
          <div class="size-full md:max-w-[200px]">
            <SaasSessionsSidebar
              @session-creating="handleSessionCreating"
              :creating-session="creatingSession"
              :selected-session="selectedSession"
            />
          </div>
          <SaasSession :selectedSession="selectedSession" />
        </template>
      </template>

      <div
        v-else
        class="flex size-full flex-col content-center items-center justify-center"
      >
        <Logo size="size-32" :with-label="false" />
        <div class="mb-4 max-w-96 text-center">
          A subscription is required to use ZuckerBot. Please subscribe to start
          using ZuckerBot.
        </div>
        <Button>
          <NuxtLinkLocale to="/app/settings/team/billing" class="block py-1.5">
            Try it for 14 days
          </NuxtLinkLocale>
        </Button>
      </div>
    </div>
  </div>
</template>
