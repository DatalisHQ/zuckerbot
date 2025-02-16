<script setup lang="ts">
  import { passwordSchema } from "auth/lib/passwords";
  import { AlertTriangleIcon } from "lucide-vue-next";
  import { joinURL } from "ufo";
  import { z } from "zod";
  import { oAuthProviders } from "./SaasSocialSigninButton.client.vue";

  const { setReferrer, getReferrer } = useReferrer();

  const runtimeConfig = useRuntimeConfig();
  const { apiCaller } = useApiCaller();
  const { t } = useTranslations();
  const localePath = useLocalePath();

  const formSchema = toTypedSchema(
    z.object({
      root: z.string().optional(),
      email: z.string().email(),
      password: passwordSchema,
    }),
  );

  const { searchQuery: invitationCode } = useRouteSearchQuery({
    name: "invitationCode",
    replace: true,
  });
  const { searchQuery: redirectToParam } = useRouteSearchQuery({
    name: "redirectTo",
    replace: true,
  });
  const { searchQuery: emailParam } = useRouteSearchQuery({
    name: "email",
    replace: true,
  });
  const { searchQuery: referrerParam } = useRouteSearchQuery({
    name: "referrer",
    replace: true,
  });

  const redirectTo = computed(() => {
    return invitationCode.value
      ? `/team/invitation?code=${invitationCode.value}`
      : redirectToParam.value || runtimeConfig.public.auth.redirectPath;
  });

  const { zodErrorMap, setApiErrorsToForm } = useApiFormErrors();

  z.setErrorMap(zodErrorMap);

  const form = useForm({
    validationSchema: formSchema,
    initialValues: {
      email: "",
      password: "",
    },
  });

  const {
    handleSubmit,
    setFieldValue,
    isSubmitting,
    values: formValues,
    errors,
  } = form;

  watchEffect(() => {
    if (emailParam.value) {
      setFieldValue("email", emailParam.value);
    }
  });

  watchEffect(() => {
    if (referrerParam.value) {
      setReferrer(referrerParam.value);
    }
  });

  const onSubmit = handleSubmit(async (values) => {
    try {
      await apiCaller.auth.signup.mutate({
        email: values.email,
        password: values.password,
        referrer: getReferrer(),
        callbackUrl: joinURL(runtimeConfig.public.siteUrl, "/auth/verify"),
      });

      const redirectSearchParams = new URLSearchParams();
      redirectSearchParams.set("type", "SIGNUP");
      redirectSearchParams.set("redirectTo", redirectTo.value);
      if (invitationCode) {
        redirectSearchParams.set("invitationCode", invitationCode.value);
      }
      if (values.email) {
        redirectSearchParams.set("identifier", values.email);
      }

      navigateTo(localePath(`/auth/otp?${redirectSearchParams.toString()}`), {
        replace: true,
      });
    } catch (e) {
      setApiErrorsToForm(e, form, {
        defaultError: t("auth.signup.hints.signupFailed.message"),
      });
    }
  });
</script>

<template>
  <div>
    <h1 class="text-3xl font-bold">{{ $t("auth.signup.title") }}</h1>
    <p class="text-muted-foreground mb-6 mt-2">
      {{ $t("auth.signup.message") }}
    </p>

    <SaasTeamInvitationInfo v-if="invitationCode" class="mb-6" />

    <div class="grid grid-cols-1 items-stretch gap-4 md:grid-cols-2">
      <SaasSocialSigninButton
        v-for="providerId of Object.keys(oAuthProviders)"
        :key="providerId"
        :provider="providerId"
      />
    </div>

    <hr class="my-8" />

    <form @submit.prevent="onSubmit" class="flex flex-col items-stretch gap-6">
      <Alert v-if="errors.root" variant="error">
        <AlertTriangleIcon class="size-6" />
        <AlertDescription>{{ errors.root }}</AlertDescription>
      </Alert>

      <FormField v-slot="{ componentField }" name="email">
        <FormItem>
          <FormLabel for="name" required>
            {{ $t("auth.signup.email") }}
          </FormLabel>
          <FormControl>
            <Input v-bind="componentField" autocomplete="email" />
          </FormControl>
          <FormMessage />
        </FormItem>
      </FormField>

      <FormField v-slot="{ componentField }" name="password">
        <FormItem>
          <FormLabel for="password" required>
            {{ $t("auth.signup.password") }}
          </FormLabel>
          <FormControl>
            <SaasPasswordInput
              v-bind="componentField"
              autocomplete="new-password"
              required
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      </FormField>

      <Button :loading="isSubmitting" type="submit">
        {{ $t("auth.signup.submit") }} &rarr;
      </Button>

      <p>
        <span class="text-muted-foreground">
          {{ $t("auth.signup.alreadyHaveAccount") }}&nbsp;</span
        >
        <NuxtLinkLocale
          :to="`/auth/login${
            invitationCode
              ? `?invitationCode=${invitationCode}&email=${formValues.email}`
              : ''
          }`"
        >
          {{ $t("auth.signup.signIn") }} &rarr;
        </NuxtLinkLocale>
      </p>
    </form>
  </div>
</template>
