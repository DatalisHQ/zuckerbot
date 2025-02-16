<script setup lang="ts">
  import { getFacebookAuthUrl } from "utils";

  const emit = defineEmits<{
    complete: [];
    back: [];
  }>();

  const { user } = useUser();

  const openFacebookAuth = () => {
    const authUrl = getFacebookAuthUrl(user.value);
    window.open(authUrl, "_blank");
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

    <div class="mt-4 flex gap-2">
      <Button variant="outline" @click="emit('back')" class="flex-1">
        <ArrowLeftIcon class="mr-2 size-4" />
        Back
      </Button>
    </div>
  </div>
</template>
