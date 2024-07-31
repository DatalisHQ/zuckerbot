<script setup lang="ts">
  import { MenuIcon } from "lucide-vue-next";
  import { VisuallyHidden } from "radix-vue";

  const route = useRoute();
  const { t } = useTranslations();
  const { y: verticalScrollPosition } = useWindowScroll();
  const { user, loaded: userLoaded } = useUser();

  const isTop = computed(() => verticalScrollPosition.value < 10);

  const { public: runtimeConfig } = useRuntimeConfig();

  const hasUser = computed(() => {
    return userLoaded.value && user.value;
  });

  const mobileMenuOpen = ref(false);

  const isMenuItemActive = (to: string) => {
    return route.fullPath.startsWith(to);
  };

  watch(
    () => route.fullPath,
    () => {
      mobileMenuOpen.value = false;
    },
  );

  type MenuItem = {
    label: string;
    to: string;
  };
  const menuItems = computed<MenuItem[]>(() => [
    {
      label: t("common.menu.pricing"),
      to: "/pricing",
    },
    {
      label: t("common.menu.changelog"),
      to: "/changelog",
    },
  ]);
</script>

<template>
  <nav
    class="fixed left-0 top-0 z-20 w-full transition-[height] duration-200"
    :class="[
      isTop ? 'shadow-none' : 'bg-background/80 shadow-sm backdrop-blur-lg',
    ]"
    data-test="navigation"
  >
    <div class="container">
      <div
        class="flex items-center justify-stretch gap-6 transition-all duration-200"
        :class="[isTop ? 'py-8' : 'py-4']"
      >
        <div class="flex flex-1 justify-start">
          <NuxtLinkLocale
            to="/"
            class="block hover:no-underline active:no-underline"
          >
            <Logo />
          </NuxtLinkLocale>
        </div>

        <div class="hidden flex-1 items-center justify-center lg:flex">
          <NuxtLinkLocale
            v-for="menuItem of menuItems"
            :key="menuItem.to"
            :to="menuItem.to"
            class="text-foreground/80 block shrink-0 px-3 py-2 text-sm"
            :class="[isMenuItemActive(menuItem.to) ? 'font-bold' : '']"
          >
            {{ menuItem.label }}
          </NuxtLinkLocale>
        </div>

        <div class="flex flex-1 items-center justify-end gap-3">
          <ColorModeToggle />
          <LocaleSwitch />

          <Sheet v-model:open="mobileMenuOpen">
            <SheetTrigger asChild>
              <Button class="lg:hidden" size="icon" variant="outline">
                <MenuIcon class="size-4" />
              </Button>
            </SheetTrigger>
            <SheetContent class="w-[250px]" side="right">
              <VisuallyHidden>
                <DialogTitle> Menu </DialogTitle>
                <DialogDescription> Navigation Menu </DialogDescription>
              </VisuallyHidden>

              <div class="flex flex-col items-start justify-center">
                <NuxtLinkLocale
                  v-for="menuItem of menuItems"
                  :key="menuItem.to"
                  :to="menuItem.to"
                  class="block px-3 py-2 text-sm"
                  :class="[isMenuItemActive(menuItem.to) ? 'font-bold' : '']"
                >
                  {{ menuItem.label }}
                </NuxtLinkLocale>

                <NuxtLinkLocale
                  :to="
                    hasUser ? runtimeConfig.auth.redirectPath : '/auth/login'
                  "
                  :prefetch="!hasUser"
                  class="block px-3 py-2 text-sm"
                >
                  {{
                    hasUser
                      ? t("common.menu.dashboard")
                      : t("common.menu.login")
                  }}
                </NuxtLinkLocale>
              </div>
            </SheetContent>
          </Sheet>

          <Button class="hidden lg:flex" asChild variant="secondary">
            <NuxtLinkLocale
              :to="hasUser ? runtimeConfig.auth.redirectPath : '/auth/login'"
              :prefetch="!hasUser"
            >
              {{
                hasUser ? t("common.menu.dashboard") : t("common.menu.login")
              }}
            </NuxtLinkLocale>
          </Button>
        </div>
      </div>
    </div>
  </nav>
</template>
