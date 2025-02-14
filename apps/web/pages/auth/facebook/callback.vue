<script setup lang="ts">
  const { apiCaller } = useApiCaller();
  const { reloadUser } = useUser();

  const loginMessage = ref("Processing your login...");

  const extractHashParams = () => {
    const fragment = window.location.hash.substring(1);
    const params = new URLSearchParams(fragment);

    const accessToken = params.get("access_token");
    const dataAccessExpirationTime = params.get("data_access_expiration_time");
    const rawState = params.get("state");

    let state = null;
    try {
      if (rawState) {
        state = JSON.parse(decodeURIComponent(rawState));
      }
    } catch (error) {
      console.error("Error parsing state:", error);
    }

    return { accessToken, dataAccessExpirationTime, state };
  };

  // Handle the response once the component is mounted
  onMounted(async () => {
    const { accessToken, dataAccessExpirationTime, state } =
      extractHashParams();

    if (!accessToken || !dataAccessExpirationTime) {
      console.error("Missing required auth parameters");
      loginMessage.value = "Error: Missing authentication parameters";
      return;
    }

    try {
      // Use data_access_expiration_time instead of expires_in
      const facebookTokenExpiresAt = new Date(
        Number(dataAccessExpirationTime) * 1000,
      );

      await apiCaller.auth.update.mutate({
        accessToken,
        facebookTokenExpiresAt,
      });

      await reloadUser();

      loginMessage.value = "You can now close this tab.";
    } catch (error) {
      console.error("Auth error:", error);
      loginMessage.value = "Error connecting Facebook account";
    }
  });
</script>

<template>
  <div class="flex h-screen w-screen items-center justify-center text-center">
    <p>{{ loginMessage }}</p>
  </div>
</template>
