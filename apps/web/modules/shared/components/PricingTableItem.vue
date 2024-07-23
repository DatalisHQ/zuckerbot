<script setup lang="ts">
  import type { ApiOutput } from "api";

  export type SubscriptionPlan = ApiOutput["billing"]["plans"][number] & {
    features?: Array<string>;
  };

  export type SubscriptionInterval = "month" | "year";

  const props = defineProps<{
    // This is a prop and not an emit, because it's a promise.
    onSelectPlan: (planId: string, variantId: string) => Promise<void> | void;
    plan: SubscriptionPlan;
    interval: SubscriptionInterval;
    activePlanId: string | undefined;
    labels: {
      month: string;
      year: string;
      currentPlan: string;
      switchToPlan: string;
      subscribe: string;
    };
  }>();

  const { n } = useTranslations();

  const variant = computed(() => {
    return props.plan.variants.find((v) => v.interval === props.interval);
  });

  const isActivePlan = computed(() => {
    return props.activePlanId === props.plan.id;
  });

  const selectPlanLabel = computed(() => {
    if (isActivePlan.value) {
      return props.labels.currentPlan;
    } else if (props.activePlanId) {
      return props.labels.switchToPlan;
    } else {
      return props.labels.subscribe;
    }
  });

  const planSelectionPending = ref(false);

  const handleSelectPlan = async () => {
    try {
      if (!variant.value) {
        throw new Error("No variant found");
      }
      planSelectionPending.value = true;
      await props.onSelectPlan(props.plan.id, String(variant.value.id));
      planSelectionPending.value = false;
    } catch (error) {
    } finally {
      planSelectionPending.value = false;
    }
  };
</script>

<template>
  <div v-if="variant" class="bg-card/50 rounded-xl p-6 shadow">
    <div class="flex h-full flex-col justify-between gap-4">
      <div>
        <h3 class="mb-4 text-2xl font-bold">{{ props.plan.name }}</h3>
        <div
          v-if="props.plan.description"
          class="prose text-muted-foreground mb-2"
          v-html="props.plan.description"
        />
        <ul
          v-if="props.plan.features?.length"
          class="text-muted-foreground grid list-disc gap-2 pl-4"
        >
          <li v-for="(feature, key) of plan.features" :key="key">
            {{ feature }}
          </li>
        </ul>
      </div>

      <div>
        <strong class="text-2xl font-bold">
          {{ n(variant.price / 100, "currency") }}
          <span class="text-sm font-normal opacity-70">
            / {{ props.labels[interval] }}
          </span>
        </strong>

        <Button
          :disabled="isActivePlan"
          :loading="planSelectionPending"
          @click="handleSelectPlan"
          class="mt-4 w-full"
        >
          {{ selectPlanLabel }}
        </Button>
      </div>
    </div>
  </div>
</template>
