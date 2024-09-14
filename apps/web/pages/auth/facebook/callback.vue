<script setup lang="ts">
  const { apiCaller } = useApiCaller();
  const { reloadUser } = useUser();

  const loginMessage = ref("Processing your login...");

  const extractHashParams = () => {
    // Remove the `#` and parse the fragment
    const fragment = window.location.hash.substring(1); // Remove the `#`
    const params = new URLSearchParams(fragment); // Parse the fragment

    // Extract access_token, expires_in, state, and other fields
    const accessToken = params.get("access_token");
    const expiresIn = params.get("expires_in");
    const rawState = params.get("state"); // Raw URL-encoded state

    let state = null;
    try {
      if (rawState) {
        state = JSON.parse(decodeURIComponent(rawState)); // Decode and parse state
      }
    } catch (error) {
      console.error("Error parsing state:", error);
    }

    return { accessToken, expiresIn, state };
  };

  // Handle the response once the component is mounted
  onMounted(async () => {
    const { accessToken, expiresIn, state } = extractHashParams();

    console.log(accessToken, expiresIn, state);

    if (!accessToken || !expiresIn) {
      console.error("Missing access token or state in URL fragment");
    }

    const facebookTokenExpiresAt = new Date(
      new Date().getTime() + Number.parseInt(expiresIn as string) * 1000,
    );

    // Step 3: Send the access token to the backend
    try {
      await apiCaller.auth.update.mutate({
        accessToken: accessToken as string,
        facebookTokenExpiresAt,
      });

      await reloadUser();

      loginMessage.value = "You can now close this tab.";
    } catch {}
  });
</script>

<template>
  <div class="flex h-screen w-screen items-center justify-center text-center">
    <p>{{ loginMessage }}</p>
  </div>
</template>
