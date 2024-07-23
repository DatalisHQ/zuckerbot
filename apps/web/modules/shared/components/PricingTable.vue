<script setup lang="ts">
  import type {
    SubscriptionInterval,
    SubscriptionPlan,
  } from "@/modules/shared/components/PricingTableItem.vue";
  import type { ClassValue } from "class-variance-authority/types";

  const props = defineProps<{
    // This is a prop and not an emit, because it's a promise.
    onSelectPlan: (planId: string, variantId: string) => Promise<void> | void;
    plans: SubscriptionPlan[];
    activePlanId?: string;
    class?: ClassValue;
  }>();

  const { localeCurrency } = useLocaleCurrency();
  const { t } = useTranslations();

  const labels = computed(() => ({
    currentPlan: t("settings.billing.subscription.currentPlan"),
    yearly: t("settings.billing.subscription.yearly"),
    monthly: t("settings.billing.subscription.monthly"),
    year: t("settings.billing.subscription.year"),
    month: t("settings.billing.subscription.month"),
    subscribe: t("settings.billing.subscription.subscribe"),
    switchToPlan: t("settings.billing.subscription.switchToPlan"),
  }));

  const interval = ref<SubscriptionInterval>("month");

  const sortedAndFilteredPlans = computed(() => {
    return [...props.plans]
      .map((plan) => {
        const variants = plan.variants
          .filter(
            (v) =>
              v.interval === interval.value &&
              v.currency.toLowerCase() === localeCurrency.value.toLowerCase(),
          )
          .sort((a, b) => a.price - b.price);

        return { ...plan, variants };
      })
      .filter((plan) => plan.variants.length > 0)
      .sort((a, b) => {
        const lowestPriceA = a.variants.reduce(
          (lowest, variant) => Math.min(lowest, variant.price),
          Number.POSITIVE_INFINITY,
        );
        const lowestPriceB = b.variants.reduce(
          (lowest, variant) => Math.min(lowest, variant.price),
          Number.POSITIVE_INFINITY,
        );
        return lowestPriceA - lowestPriceB;
      });
  });
</script>

<template>
  <div :class="cn(props.class, '@container')">
    <div class="mb-6 flex justify-center">
      <Tabs v-model="interval" class="mb-4">
        <TabsList>
          <TabsTrigger value="month">{{ labels.monthly }}</TabsTrigger>
          <TabsTrigger value="year">{{ labels.yearly }}</TabsTrigger>
        </TabsList>
      </Tabs>
    </div>

    <div class="flex items-center justify-center">
      <PricingTableItem
        class="md:w-72"
        v-for="plan of sortedAndFilteredPlans"
        :onSelectPlan="props.onSelectPlan"
        :key="plan.id"
        :plan="plan"
        :interval="interval"
        :labels="{
          month: labels.month,
          year: labels.year,
          currentPlan: labels.currentPlan,
          switchToPlan: labels.switchToPlan,
          subscribe: labels.subscribe,
        }"
        :activePlanId="props.activePlanId"
      />
    </div>
  </div>
</template>
