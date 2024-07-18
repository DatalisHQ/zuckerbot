<script setup lang="ts">
  const { user, reloadUser } = useUser();

  await reloadUser();

  const localePath = useLocalePath();
  const currentTeamId = useCurrentTeamIdCookie();

  if (!user.value) {
    await navigateTo(localePath("/auth/login"));
    throw new Error("User not found");
  }

  if (!user.value.onboardingComplete) {
    await navigateTo(localePath("/onboarding"));
    throw new Error("Onboarding not complete");
  }

  const teamMemberships = user.value.teamMemberships ?? [];
  const currentTeamMembership =
    teamMemberships.find(
      (membership) => membership.team.id === currentTeamId.value,
    ) ?? teamMemberships[0];

  if (!currentTeamMembership) {
    await navigateTo(localePath("/"));
  }

  currentTeamId.value = currentTeamMembership.team.id;
</script>

<template>
  <SaasNavBar />

  <main class="h-chat">
    <slot />
  </main>
</template>
