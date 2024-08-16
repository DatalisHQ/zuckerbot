<script setup lang="ts">
  definePageMeta({
    layout: "marketing",
  });

  useSeoMeta({
    title: "ZuckerBot Pricing - Affordable Plans for Every Business",
    description:
      "Check out ZuckerBot's pricing plans. Whether you're a small business or a large agency, find the perfect plan to suit your advertising needs and budget.",
  });

  const { apiCaller } = useApiCaller();

  const { data: plans } = await apiCaller.billing.plans.useQuery();
</script>

<template>
  <div class="pb-24 pt-40">
    <div class="container">
      <div class="mb-12 text-center">
        <h1 class="text-4xl font-bold lg:text-5xl">
          {{ $t("pricing.title") }}
        </h1>
        <p class="mt-3 text-lg opacity-50">
          {{ $t("pricing.description") }}
        </p>
      </div>

      <div class="mx-auto max-w-4xl">
        <MarketingPricingTable v-if="plans" :plans="plans" />
      </div>
    </div>
  </div>
</template>
