<script setup lang="ts">
  const { apiCaller } = useApiCaller();
  const localePath = useLocalePath();
  const { reloadUser } = useUser();

  const totalSteps = 3; // Updated to include Facebook step
  const { searchQuery: step } = useRouteSearchQuery({
    name: "step",
    replace: true,
    defaultValue: "1",
  });

  const setStep = (newStep: number) => {
    step.value = String(newStep);
  };

  // Watch for step changes to handle onboarding completion
  watch(
    step,
    async (newStep) => {
      if (newStep === "3") {
        try {
          await apiCaller.auth.update.mutate({
            onboardingComplete: true,
          });
          await reloadUser();
        } catch {}
      }
    },
    { immediate: true },
  );

  const onComplete = () => {
    navigateTo(localePath(`/app/dashboard`), {
      replace: true,
    });
  };
</script>

<template>
  <div>
    <h1 class="text-3xl font-bold">{{ $t("onboarding.title") }}</h1>
    <p class="text-muted-foreground mb-6 mt-2">
      {{ $t("onboarding.message") }}
    </p>

    <div class="mb-6 flex items-center gap-3">
      <Progress :model-value="(Number(step) / totalSteps) * 100" class="h-2" />
      <span class="text-muted-foreground shrink-0 text-xs">
        {{
          $t("onboarding.step", {
            step,
            total: totalSteps,
          })
        }}
      </span>
    </div>

    <SaasOnboardingStep1 v-if="Number(step) === 1" @complete="setStep(2)" />
    <SaasOnboardingStep2
      v-else-if="Number(step) === 2"
      @back="setStep(1)"
      @complete="setStep(3)"
    />
    <SaasOnboardingStep3
      v-else-if="Number(step) === 3"
      @back="setStep(2)"
      @complete="onComplete"
    />
  </div>
</template>
