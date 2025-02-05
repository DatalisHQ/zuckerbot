<script setup lang="ts">
  import { useToast } from "@/modules/ui/components/toast";
  import { LoaderIcon } from "lucide-vue-next";
  import { v4 as uuid } from "uuid";

  const uploading = ref(false);
  const image = ref<File | null>(null);
  const cropDialogOpen = ref(false);
  const dropZoneRef = ref<HTMLDivElement>();
  const { reloadUser, currentTeam } = useUser();
  const { apiCaller } = useApiCaller();
  const { toast } = useToast();
  const { t } = useTranslations();
  const config = useRuntimeConfig();

  const getSignedUploadUrlMutation =
    apiCaller.uploads.signedUploadUrl.useMutation();
  const updateTeamMutation = apiCaller.team.update.useMutation();

  const { open: openFileDialog, onChange: onFilesSelected } = useFileDialog({
    accept: "image/*",
    multiple: false,
  });

  onFilesSelected((files) => {
    if (files?.length) {
      image.value = files[0];
      cropDialogOpen.value = true;
    }
  });

  const onCrop = async (croppedImageData: Blob | null) => {
    if (!croppedImageData || !currentTeam.value) {
      return;
    }

    uploading.value = true;
    try {
      const bucketName = config.public.s3AvatarsBucketName;
      const path = `/${currentTeam.value?.id}-${uuid()}.png`;
      const uploadUrl = await getSignedUploadUrlMutation.mutate({
        path,
        bucket: bucketName,
      });

      if (!uploadUrl) {
        throw new Error("Failed to get upload url");
      }

      await $fetch(uploadUrl, {
        method: "PUT",
        body: croppedImageData,
        headers: {
          "Content-Type": "image/png",
        },
      });

      await updateTeamMutation.mutate({
        id: currentTeam.value.id,
        avatarUrl: path,
      });

      toast({
        variant: "success",
        title: t("settings.notifications.avatarUpdated"),
      });

      await reloadUser();
    } catch (e) {
      toast({
        variant: "error",
        title: t("settings.notifications.avatarNotUpdated"),
      });
    } finally {
      uploading.value = false;
    }
  };
</script>

<template>
  <SaasActionBlock>
    <template #title>
      {{ $t("settings.account.avatar.title") }}
    </template>

    <div class="flex items-center gap-4">
      <div class="flex-1">
        <p>{{ $t("settings.account.avatar.description") }}</p>
      </div>

      <div
        ref="dropZoneRef"
        class="relative cursor-pointer rounded-full"
        @click="openFileDialog()"
      >
        <TeamAvatar
          class="size-24 cursor-pointer text-xl"
          :avatarUrl="currentTeam?.avatarUrl"
          :name="currentTeam?.name ?? ''"
        />

        <div
          v-if="uploading"
          class="bg-card/90 absolute inset-0 z-20 flex items-center justify-center"
        >
          <LoaderIcon class="text-primary size-6 animate-spin" />
        </div>
      </div>
    </div>

    <SaasCropImageDialog
      :open="cropDialogOpen"
      :image="image"
      @open-change="(open: boolean) => (cropDialogOpen = open)"
      @save="
        (imageData: Blob | null) => (
          onCrop(imageData), (cropDialogOpen = false)
        )
      "
    />
  </SaasActionBlock>
</template>
