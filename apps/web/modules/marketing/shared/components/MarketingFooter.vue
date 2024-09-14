<template>
  <footer class="bg-muted text-muted-foreground py-12">
    <div class="container grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div>
        <Logo class="opacity-50 grayscale" />
        <p class="mt-3 text-sm opacity-70">
          © {{ new Date().getFullYear() }} ZuckerBot. All rights reserved.
        </p>
      </div>

      <!-- <div class="flex flex-col gap-2">
        <NuxtLinkLocale to="/changelog" class="block">
          Changlog
        </NuxtLinkLocale>
        <NuxtLinkLocale to="/pricing" class="block"> Pricing </NuxtLinkLocale>
      </div> -->

      <div class="flex flex-col gap-2">
        <NuxtLink to="/legal/privacy" class="block"> Privacy policy </NuxtLink>
        <NuxtLink href="/legal/terms" class="block">
          Terms and conditions
        </NuxtLink>
      </div>
      <div>
        <a
          href="https://aitools.inc/tools/zuckerbot-ai?utm_source=embed-badge-zuckerbot-ai&utm_medium=embed&utm_campaign=embed-badge-featured"
          target="_blank"
          style="width: 175px; height: 54px"
          ><img
            src="https://aitools.inc/tools/zuckerbot-ai/embeds/v1/featured-badge.svg?theme=light"
            alt="ZuckerBot | AI Tools"
            style="width: 175px; height: 54px"
            width="175"
            height="54"
        /></a>
      </div>
    </div>
  </footer>
</template>
