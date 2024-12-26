<template>
  <div class="flex min-h-screen w-full p-8">
    <div class="flex w-full flex-col items-center justify-between gap-8">
      <div class="container max-w-none">
        <div class="flex items-center justify-between">
          <NuxtLinkLocale to="/" class="block">
            <Logo />
          </NuxtLinkLocale>

          <div class="flex items-center justify-end gap-2">
            <LocaleSwitch />
            <ColorModeToggle />
          </div>
        </div>
      </div>

      <main class="w-full max-w-md">
        <slot />
      </main>

      <SaasFooter />
    </div>
  </div>
</template>
