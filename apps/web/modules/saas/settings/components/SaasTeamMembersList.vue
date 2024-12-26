<script setup lang="ts">
  import type { ApiOutput } from "api";
  import type { TeamMemberRoleType } from "database";
  import { LogOutIcon, TrashIcon, MoreVerticalIcon } from "lucide-vue-next";
  import { useToast } from "@/modules/ui/components/toast";

  const props = defineProps<{
    memberships: ApiOutput["team"]["memberships"];
  }>();

  const { t } = useTranslations();
  const { user, teamRole } = useUser();
  const { toast, dismiss } = useToast();
  const { apiCaller } = useApiCaller();

  const handleUpdateRole = async ({
    membershipId,
    role,
  }: {
    membershipId: string;
    role: TeamMemberRoleType;
  }) => {
    if (!process.client || typeof window === "undefined") {
      return;
    }

    const loadingToast = toast({
      variant: "loading",
      description: t(
        "settings.team.members.notifications.updateMembership.loading.description",
      ),
    });

    try {
      await apiCaller.team.updateMembership.mutate({
        id: membershipId,
        role,
      });

      toast({
        variant: "success",
        description: t(
          "settings.team.members.notifications.updateMembership.success.description",
        ),
      });

      location.reload();
    } catch (error) {
      toast({
        variant: "error",
        description: t(
          "settings.team.members.notifications.updateMembership.error.description",
        ),
      });
    } finally {
      dismiss(loadingToast.id);
    }
  };

  const handleRemoveMember = async ({
    membershipId,
  }: {
    membershipId: string;
  }) => {
    if (!process.client || typeof window === "undefined") {
      return;
    }

    const loadingToast = toast({
      variant: "loading",
      description: t(
        "settings.team.members.notifications.removeMember.loading.description",
      ),
    });

    try {
      await apiCaller.team.removeMember.mutate({
        membershipId,
      });

      toast({
        variant: "success",
        description: t(
          "settings.team.members.notifications.removeMember.success.description",
        ),
      });

      location.reload();
    } catch (error) {
      toast({
        variant: "error",
        description: t(
          "settings.team.members.notifications.removeMember.error.description",
        ),
      });
    } finally {
      dismiss(loadingToast.id);
    }
  };
</script>

<template>
  <div class="rounded-sm border">
    <Table>
      <TableBody v-if="props.memberships.length">
        <TableRow v-for="row of props.memberships" :key="row.id">
          <!-- User Details -->
          <TableCell>
            <div v-if="row.user" class="flex items-center gap-2">
              <UserAvatar
                :name="row.user.name ?? row.user.email"
                :avatarUrl="row.user.avatarUrl"
              />
              <div>
                <strong class="block">{{ row.user.name }}</strong>
                <small class="text-muted-foreground">
                  {{ row.user.email }}
                </small>
              </div>
            </div>
          </TableCell>

          <!-- Actions -->
          <TableCell>
            <div class="flex flex-row justify-end gap-2">
              <SaasTeamRoleSelect
                :modelValue="row.role"
                @update:modelValue="
                  (val) => handleUpdateRole({ membershipId: row.id, role: val })
                "
                :disabled="teamRole !== 'OWNER' || row.isCreator"
              />

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="icon" variant="ghost">
                    <MoreVerticalIcon class="size-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem
                    :disabled="row.isCreator"
                    class="text-destructive"
                    @click="() => handleRemoveMember({ membershipId: row.id })"
                  >
                    <component
                      :is="row.user?.id === user?.id ? LogOutIcon : TrashIcon"
                      class="mr-2 size-4"
                    />
                    {{ $t("settings.team.members.removeMember") }}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </TableCell>
        </TableRow>
      </TableBody>

      <TableBody v-else>
        <TableRow>
          <TableCell colspan="2" class="h-24 text-center">
            No results.
          </TableCell>
        </TableRow>
      </TableBody>
    </Table>
  </div>
</template>
