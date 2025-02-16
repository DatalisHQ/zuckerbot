<script setup lang="ts">
  import { getFacebookAuthUrl } from "utils";

  const emit = defineEmits<{
    complete: [];
    back: [];
  }>();

  const { user } = useUser();

  const openFacebookAuth = () => {
    const authUrl = getFacebookAuthUrl(user.value);
    window.location.href = authUrl;
  };
</script>

<template>
  <div class="flex flex-col gap-6">
    <div>
      <h3 class="mb-2 text-xl font-bold">Connect Facebook Account</h3>
      <p class="text-muted-foreground">
        Connect your Facebook account to manage your ads
      </p>
    </div>

    <div class="flex flex-col gap-4">
      <Button @click="openFacebookAuth" variant="outline" class="w-full">
        <FacebookIcon class="mr-2 size-4" />
        Connect Facebook Account
      </Button>

      <Button @click="emit('complete')" variant="ghost" class="w-full">
        Skip for now
      </Button>
    </div>
  </div>
</template>
