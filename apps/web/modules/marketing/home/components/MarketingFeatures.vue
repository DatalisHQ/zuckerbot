<script setup lang="ts">
  import {
    ArrowRightIcon,
  } from "lucide-vue-next";
</script>

<template>
  <section class="text-card-foreground py-24">
    <div class="container">
      <div class="text-center">
        <h1 class="text-4xl font-bold lg:text-5xl">
          Features your clients will love
        </h1>
        <p class="text-foreground/60 mt-3 text-lg">
          In this section you can showcase the features of your SaaS.
        </p>
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
            <h3 class="text-3xl font-bold">AI-Driven Ad Creation</h3>
            <p class="text-foreground/60 mt-2 leading-normal">
              Generate high-quality ads tailored to your brand with just a few clicks.
            </p>

            <p class="text-foreground/60 mt-2 leading-normal">
              1. Describe your ad<br>
              2.Tell us who your audience is<br>
              3. Set you budget<br>
              4. Go!
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
            <h3 class="text-3xl font-bold">Seamless Facebook Integration</h3>
            <p class="text-foreground/60 mt-2 leading-normal">
              Connect your Facebook Ads account effortlessly. ZuckerBot manages and optimizes your ad campaigns directly within the Facebook ecosystem, ensuring your ads reach the right audience with minimal hassle.
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
            <h3 class="text-3xl font-bold">Real-Time Performance Insights</h3>
            <p class="text-foreground/60 mt-2 leading-normal">
              Track the performance of your ads in real-time. Get detailed analytics and insights, allowing you to make data-driven decisions and continuously improve your ad strategies for better ROI.
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
