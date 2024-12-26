<script setup lang="ts">
  import type { ApiOutput } from "api";
  import { MoreVerticalIcon, UndoIcon } from "lucide-vue-next";
  import { useToast } from "@/modules/ui/components/toast";

  const props = defineProps<{
    invitations: ApiOutput["team"]["invitations"];
  }>();

  const { t } = useTranslations();
  const { teamRole } = useUser();
  const { toast, dismiss } = useToast();
  const { apiCaller } = useApiCaller();

  const handleRevokeInvitation = async ({
    invitationId,
  }: {
    invitationId: string;
  }) => {
    if (!process.client || typeof window === "undefined") {
      return;
    }

    const loadingToast = toast({
      variant: "loading",
      description: t(
        "settings.team.members.notifications.revokeInvitation.loading.description",
      ),
    });

    try {
      await apiCaller.team.revokeInvitation.mutate({
        invitationId,
      });

      toast({
        variant: "success",
        description: t(
          "settings.team.members.notifications.revokeInvitation.success.description",
        ),
      });

      location.reload();
    } catch (error) {
      toast({
        variant: "error",
        description: t(
          "settings.team.members.notifications.revokeInvitation.error.description",
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
      <TableBody v-if="props.invitations.length">
        <TableRow v-for="row of props.invitations" :key="row.id">
          <!-- User Details -->
          <TableCell>
            <div>
              {{ row.email }}
            </div>
          </TableCell>

          <!-- Actions -->
          <TableCell>
            <div class="flex flex-row justify-end gap-2">
              <SaasTeamRoleSelect :modelValue="row.role" disabled />

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="icon" variant="ghost">
                    <MoreVerticalIcon class="size-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem
                    :disabled="teamRole !== 'OWNER'"
                    class="text-destructive"
                    @click="
                      () => handleRevokeInvitation({ invitationId: row.id })
                    "
                  >
                    <UndoIcon class="mr-2 size-4" />
                    {{ $t("settings.team.members.invitations.revoke") }}
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
            {{ $t("settings.team.members.invitations.empty") }}
          </TableCell>
        </TableRow>
      </TableBody>
    </Table>
  </div>
</template>
