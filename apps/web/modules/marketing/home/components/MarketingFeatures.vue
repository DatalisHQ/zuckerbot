<script setup lang="ts">
  import { ArrowRightIcon } from "lucide-vue-next";
</script>

<template>
  <section class="text-card-foreground py-24">
    <div class="container">
      <div class="text-center">
        <h1 class="text-4xl font-bold lg:text-5xl">
          Why Small and Medium Businesses Choose ZuckerBot
        </h1>
      </div>

      <div class="mt-12 grid grid-cols-1 gap-8">
        <div
          class="bg-card/50 grid items-center gap-8 rounded-2xl border p-8 lg:grid-cols-2 lg:gap-16"
        >
          <div class="bg-primary/10 overflow-hidden rounded-xl p-12">
            <NuxtImg
              src="/images/feature-image.svg"
              class="block dark:hidden"
              alt="Feature 1"
            />
            <NuxtImg
              src="/images/feature-image-dark.svg"
              class="hidden dark:block"
              alt="Feature 1"
            />
          </div>

          <div>
            <h3 class="text-3xl font-bold">Effortless Ad Creation</h3>
            <p class="text-foreground/60 mt-2 leading-normal">
              ZuckerBot’s advanced AI crafts compelling ad copy that connects
              with your audience, saving you from the hassle and guesswork. With
              our smart algorithms, you can create ads that are always optimized
              for success without needing expert knowledge.
            </p>

            <Button variant="secondary" size="sm" class="mt-4">
              Try it now
              <ArrowRightIcon class="ml-2 size-4" />
            </Button>
          </div>
        </div>

        <div
          class="bg-card/50 grid items-center gap-8 rounded-2xl border p-8 lg:grid-cols-2 lg:gap-16"
        >
          <div class="bg-primary/10 overflow-hidden rounded-xl p-12 lg:order-2">
            <NuxtImg
              src="/images/feature-image.svg"
              class="block dark:hidden"
              alt="Feature 2"
            />
            <NuxtImg
              src="/images/feature-image-dark.svg"
              class="hidden dark:block"
              alt="Feature 2"
            />
          </div>

          <div class="lg:order-1">
            <h3 class="text-3xl font-bold">
              Seamless Integration
              <span
                class="me-2 rounded bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800 dark:bg-blue-900 dark:text-blue-300"
                >coming soon</span
              >
            </h3>
            <p class="text-foreground/60 mt-2 leading-normal">
              Link ZuckerBot to your Facebook Ads account effortlessly. Our
              user-friendly platform simplifies campaign management, providing
              real-time insights and superior ROI without the high costs of an
              agency or dedicated employee.
            </p>
            <Button variant="secondary" size="sm" class="mt-4">
              Try it now
              <ArrowRightIcon class="ml-2 size-4" />
            </Button>
          </div>
        </div>

        <div
          class="bg-card/50 grid items-center gap-8 rounded-2xl border p-8 lg:grid-cols-2 lg:gap-16"
        >
          <div class="bg-primary/10 overflow-hidden rounded-xl p-12">
            <NuxtImg
              src="/images/feature-image.svg"
              class="block dark:hidden"
              alt="Feature 3"
            />
            <NuxtImg
              src="/images/feature-image-dark.svg"
              class="hidden dark:block"
              alt="Feature 3"
            />
          </div>

          <div>
            <h3 class="text-3xl font-bold">Time and Cost Efficiency</h3>
            <p class="text-foreground/60 mt-2 leading-normal">
              Say goodbye to expensive agency fees and the complexity of Meta
              Ads. ZuckerBot streamlines your advertising efforts, allowing you
              to focus on growing your business. Save both time and money while
              achieving better results.
            </p>
            <Button variant="secondary" size="sm" class="mt-4">
              Try it now
              <ArrowRightIcon class="ml-2 size-4" />
            </Button>
          </div>
        </div>

        <div
          class="bg-card/50 grid items-center gap-8 rounded-2xl border p-8 lg:grid-cols-2 lg:gap-16"
        >
          <div class="bg-primary/10 overflow-hidden rounded-xl p-12 lg:order-2">
            <NuxtImg
              src="/images/feature-image.svg"
              class="block dark:hidden"
              alt="Feature 2"
            />
            <NuxtImg
              src="/images/feature-image-dark.svg"
              class="hidden dark:block"
              alt="Feature 2"
            />
          </div>

          <div class="lg:order-1">
            <h3 class="text-3xl font-bold">Comprehensive Analytics</h3>
            <p class="text-foreground/60 mt-2 leading-normal">
              Gain a deeper understanding of your ad performance with detailed,
              easy-to-read reports. Make informed, data-driven decisions to
              continuously improve your campaigns and drive more leads or sales.
            </p>
            <Button variant="secondary" size="sm" class="mt-4">
              Try it now
              <ArrowRightIcon class="ml-2 size-4" />
            </Button>
          </div>
        </div>

        <div
          class="bg-card/50 grid items-center gap-8 rounded-2xl border p-8 lg:grid-cols-2 lg:gap-16"
        >
          <div class="bg-primary/10 overflow-hidden rounded-xl p-12">
            <NuxtImg
              src="/images/feature-image.svg"
              class="block dark:hidden"
              alt="Feature 3"
            />
            <NuxtImg
              src="/images/feature-image-dark.svg"
              class="hidden dark:block"
              alt="Feature 3"
            />
          </div>

          <div>
            <h3 class="text-3xl font-bold">Future Enhancements</h3>
            <p class="text-foreground/60 mt-2 leading-normal">
              ZuckerBot is constantly evolving to bring you more value. Here’s
              what’s coming soon:<br /><br />- Automated Video Ad Creation:
              Easily generate engaging video content.<br />- Multi-Platform
              Integration: Expand your reach to Instagram, TikTok, and more.<br />-
              Text-to-Image Capabilities: Create stunning visuals from simple
              text prompts.
            </p>
            <Button variant="secondary" size="sm" class="mt-4">
              Try it now
              <ArrowRightIcon class="ml-2 size-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
