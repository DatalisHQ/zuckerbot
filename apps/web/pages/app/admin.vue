<script setup lang="ts">
  const { t } = useTranslations();
  const { user } = useUser();

  if (!user.value || user.value.role !== "ADMIN") {
    await navigateTo("/app");
    throw new Error("No admin role");
  }

  const menuItems = computed<{ title: string; to: string }[]>(() => {
    return [
      {
        title: t("admin.menu.users"),
        to: "/app/admin/users",
      },
    ];
  });
</script>

<template>
  <div class="p-8">
    <div class="flex flex-col items-start gap-8 md:flex-row">
      <div class="w-full md:max-w-[200px]">
        <SaasAdminMenu :items="menuItems" />
      </div>

      <div class="container max-w-6xl flex-1 ">
        <NuxtPage />
      </div>
    </div>
  </div>
</template>
