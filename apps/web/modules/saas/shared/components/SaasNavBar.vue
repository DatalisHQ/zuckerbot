<script setup lang="ts">
  import {
    ChevronRightIcon,
    GridIcon,
    SettingsIcon,
    UserCogIcon,
  } from "lucide-vue-next";

  const route = useRoute();
  const { t } = useTranslations();
  const { user } = useUser();

  const isAdmin = computed(() => user.value?.role === "ADMIN");

  const currentTeamId = useCurrentTeamIdCookie();

  type MenuItem = {
    label: string;
    to: string;
    icon: Component;
  };

  const menuItems = computed<MenuItem[]>(() => {
    if (!currentTeamId.value) {
      return [];
    }
    return [
      {
        label: t("dashboard.menu.dashboard"),
        icon: GridIcon,
        to: "/app/dashboard",
      },
      {
        label: t("dashboard.menu.settings"),
        icon: SettingsIcon,
        to: "/app/settings",
      },
      ...(isAdmin.value
        ? ([
            {
              label: t("dashboard.menu.admin"),
              icon: UserCogIcon,
              to: `/app/admin`,
            },
          ] satisfies MenuItem[])
        : []),
    ];
  });

  const isActiveMenuItem = (href: string | null) => {
    return href && route.path.includes(href);
  };
</script>

<template>
  <nav class="w-full border-b">
    <div class="px-8 py-4">
      <div class="flex flex-wrap items-center justify-between gap-4">
        <div class="flex items-center gap-3">
          <NuxtLinkLocale to="/" class="block">
            <Logo />
          </NuxtLinkLocale>

          <span class="hidden opacity-30 md:block">
            <ChevronRightIcon class="size-4" />
          </span>

          <SaasTeamSelect />
        </div>

        <div class="ml-auto mr-0 flex items-center justify-end gap-4">
          <UserMenu />
        </div>
      </div>

      <ul
        class="no-scrollbar -mx-8 -mb-4 mt-6 flex list-none items-center justify-start gap-6 overflow-x-auto px-8 text-sm lg:text-base"
      >
        <li v-for="menuItem of menuItems" :key="menuItem.to">
          <NuxtLinkLocale
            :to="menuItem.to"
            class="flex items-center gap-2 border-b-2 px-1 pb-3 text-sm"
            :class="
              isActiveMenuItem(menuItem.to)
                ? 'border-primary font-bold'
                : 'border-transparent'
            "
          >
            <component
              :is="menuItem.icon"
              class="size-4 shrink-0"
              :class="isActiveMenuItem(menuItem.to) ? 'text-primary' : ''"
            />
            <span>{{ menuItem.label }}</span>
          </NuxtLinkLocale>
        </li>
      </ul>
    </div>
  </nav>
</template>
