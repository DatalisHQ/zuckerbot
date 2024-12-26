<script setup lang="ts">
  import { ChevronsUpDownIcon, PlusIcon } from "lucide-vue-next";

  const localePath = useLocalePath();
  const { teamMemberships, currentTeam } = useUser();
  const { switchTeam } = useSwitchTeam();
  const { createTeamDialogOpen } = useDashboardState();
  const runtimeConfig = useRuntimeConfig();

  const activeTeamIdModel = computed({
    get: () => currentTeam.value?.id,
    set: async (newValue) => {
      if (newValue) {
        switchTeam(newValue);
        await navigateTo(localePath(runtimeConfig.public.auth.redirectPath));
      }
    },
  });
</script>

<template>
  <DropdownMenu v-if="currentTeam">
    <DropdownMenuTrigger
      class="focus-visible:border-primary focus-visible:ring-ring flex w-full items-center justify-between rounded-md p-2 text-left outline-none focus-visible:ring-1"
    >
      <div class="flex items-center justify-start gap-2 text-sm">
        <span class="hidden lg:block">
          <TeamAvatar
            class="size-8"
            :name="currentTeam.name"
            :avatar-url="currentTeam.avatarUrl"
          />
        </span>
        <span class="block flex-1 truncate">{{ currentTeam.name }}</span>
        <ChevronsUpDownIcon class="block size-4 opacity-50" />
      </div>
    </DropdownMenuTrigger>
    <DropdownMenuContent class="w-full">
      <DropdownMenuRadioGroup v-model="activeTeamIdModel">
        <DropdownMenuRadioItem
          v-for="teamMembership of teamMemberships"
          :key="teamMembership.team.id"
          :value="teamMembership.team.id"
        >
          <div class="flex flex-1 items-center justify-start gap-2">
            <TeamAvatar
              class="size-6"
              :name="teamMembership.team.name"
              :avatar-url="teamMembership.team.avatarUrl"
            />
            {{ teamMembership.team.name }}
          </div>
        </DropdownMenuRadioItem>
      </DropdownMenuRadioGroup>

      <DropdownMenuSeparator />

      <DropdownMenuGroup>
        <DropdownMenuItem @click="() => (createTeamDialogOpen = true)">
          <PlusIcon class="mr-2 size-4" />
          {{ $t("dashboard.sidebar.createTeam") }}
        </DropdownMenuItem>
      </DropdownMenuGroup>
    </DropdownMenuContent>
  </DropdownMenu>

  <SaasCreateTeamDialog @success="(newTeamId) => switchTeam(newTeamId)" />
</template>
