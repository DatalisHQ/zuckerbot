<script setup lang="ts">
  import { UserCogIcon } from "lucide-vue-next";
  import { isFacebookAuth, getFacebookAuthUrl } from "utils";

  const route = useRoute();
  const { t } = useTranslations();
  const { user } = useUser();

  const isAdmin = computed(() => user.value?.role === "ADMIN");

  type MenuItem = {
    label: string;
    to: string;
    icon: Component;
  };

  const menuItems = computed<MenuItem[]>(() => {
    return [
      ...(isAdmin.value
        ? ([
            {
              label: t("dashboard.menu.admin"),
              icon: UserCogIcon,
              to: "/app/admin",
            },
          ] satisfies MenuItem[])
        : []),
    ];
  });

  const isActiveMenuItem = (href: string | null) => {
    return href && route.path.includes(href);
  };

  const isFacebookConnected = computed(() => isFacebookAuth(user.value));

  const openFacebookAuth = () => {
    const authUrl = getFacebookAuthUrl(user.value);
    window.location.href = authUrl;
  };
</script>

<template>
  <nav class="w-full bg-white shadow-sm">
    <div class="container max-w-none py-4">
      <div class="flex items-center justify-between gap-6">
        <a href="https://zuckerbot.ai/app/dashboard" class="block">
          <Logo />
        </a>

        <div class="flex items-center justify-end gap-6">
          <Button
            variant="outline"
            size="sm"
            @click="openFacebookAuth"
            class="flex items-center gap-2 whitespace-nowrap"
          >
            <span
              class="size-2 rounded-full"
              :class="isFacebookConnected ? 'bg-green-500' : 'bg-red-500'"
            />
            {{
              isFacebookConnected ? "Reconnect Facebook" : "Connect Facebook"
            }}
          </Button>
          <SaasTeamSelect />
          <UserMenu />
        </div>
      </div>

      <ul
        class="no-scrollbar -mx-8 -mb-4 mt-6 flex list-none items-center justify-start gap-6 overflow-x-auto px-8 text-sm lg:hidden lg:text-base"
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
