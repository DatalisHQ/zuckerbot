<script setup lang="ts">
  import type { SaasSettingsMenuItemGroup } from "@/modules/saas/settings/components/SaasSettingsMenuGroup.vue";

  const { t } = useTranslations();

  const menuItems = computed<SaasSettingsMenuItemGroup[]>(() => {
    return [
      {
        title: t("settings.menu.team.title"),
        avatar: "team",
        items: [
          {
            title: t("settings.menu.team.general"),
            to: "/app/settings/team/general",
          },
          {
            title: t("settings.menu.team.members"),
            to: "/app/settings/team/members",
          },
          // {
          //   title: t("settings.menu.team.billing"),
          //   to: "/app/settings/team/billing",
          // },
        ],
      },
      {
        title: t("settings.menu.account.title"),
        avatar: "user",
        items: [
          {
            title: t("settings.menu.account.general"),
            to: "/app/settings/account/general",
          },
        ],
      },
    ];
  });
</script>

<template>
  <div class="p-8">
    <div class="flex flex-col items-start gap-8 md:flex-row">
      <div class="w-full md:max-w-[200px]">
        <SaasSettingsMenu :menuItems="menuItems" />
      </div>

      <div class="container max-w-6xl flex-1">
        <!-- Nested route -->
        <NuxtPage />
      </div>
    </div>
  </div>
</template>
