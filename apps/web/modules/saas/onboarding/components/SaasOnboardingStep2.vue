<script setup lang="ts">
  import { ArrowLeftIcon, ArrowRightIcon } from "lucide-vue-next";
  import { z } from "zod";

  const emit = defineEmits<{
    complete: [];
    back: [];
  }>();

  const { apiCaller } = useApiCaller();
  const { t } = useTranslations();
  const { user } = useUser();

  const createTeamMutation = apiCaller.team.create.useMutation();

  const formSchema = toTypedSchema(
    z.object({
      teamName: z.string().min(1, "Name is required"),
    }),
  );

  const serverError = ref<null | string>(null);

  const { isSubmitting, handleSubmit } = useForm({
    validationSchema: formSchema,
    initialValues: {
      teamName: "",
    },
  });

  const onSubmit = handleSubmit(async ({ teamName }) => {
    serverError.value = null;

    try {
      await createTeamMutation.mutate({
        name: teamName,
      });

      emit("complete");
    } catch (e) {
      serverError.value = t("onboarding.notifications.teamSetupFailed");
    }
  });
</script>

<template>
  <template v-if="user?.teamMemberships?.length">
    <div class="flex flex-col items-stretch gap-4">
      <h3 class="text-xl font-bold">
        {{ t("onboarding.team.joinTeam") }}
      </h3>
      <p class="text-muted-foreground">
        {{
          $t("onboarding.team.joinTeamDescription", {
            teamName: user.teamMemberships[0].team.name,
          })
        }}
      </p>
      <Button @click="emit('complete')">
        <CheckIcon class="mr-2 size-4" />
        {{ t("onboarding.complete") }}
      </Button>
    </div>
  </template>
  <template v-else>
    <h3 class="mb-4 text-xl font-bold">
      {{ t("onboarding.team.title") }}
    </h3>
    <form @submit="onSubmit" class="flex flex-col items-stretch gap-8">
      <FormField v-slot="{ componentField }" name="teamName">
        <FormItem>
          <FormLabel for="teamName" required>
            {{ $t("onboarding.team.name") }}
          </FormLabel>
          <FormControl>
            <Input v-bind="componentField" autocomplete="company" />
          </FormControl>
          <FormMessage />
        </FormItem>
      </FormField>

      <div class="flex gap-2">
        <Button
          type="button"
          variant="outline"
          @click="$emit('back')"
          class="flex-1"
        >
          <ArrowLeftIcon class="mr-2 size-4" />
          {{ $t("onboarding.back") }}
        </Button>

        <Button type="submit" :loading="isSubmitting" class="flex-1">
          {{ $t("onboarding.continue") }}
          <ArrowRightIcon class="ml-2 size-4" />
        </Button>
      </div>
    </form>
  </template>
</template>
