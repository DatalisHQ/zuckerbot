<script setup lang="ts">
  import { LoaderIcon } from "lucide-vue-next";
  import { v4 as uuid } from "uuid";

  const emit = defineEmits<{
    success: [];
    error: [];
  }>();

  const uploading = ref(false);
  const image = ref<File | null>(null);
  const cropDialogOpen = ref(false);
  const dropZoneRef = ref<HTMLDivElement>();
  const { updateUser, user } = useUser();
  const { apiCaller } = useApiCaller();
  const config = useRuntimeConfig();

  const getSignedUploadUrlMutation =
    apiCaller.uploads.signedUploadUrl.useMutation();
  const updateUserMutation = apiCaller.auth.update.useMutation();

  const { open: openFileDialog, onChange: onFilesSelected } = useFileDialog({
    accept: "image/png,image/jpg,image/jpg",
    multiple: false,
  });

  onFilesSelected((files) => {
    if (files?.length) {
      image.value = files[0];
      cropDialogOpen.value = true;
    }
  });

  const onCrop = async (croppedImageData: Blob | null) => {
    if (!croppedImageData || !user.value) {
      return;
    }

    uploading.value = true;

    try {
      const bucketName = config.public.s3AvatarsBucketName;
      const path = `/${user.value.id}-${uuid()}.png`;
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

      const updatedUser = await updateUserMutation.mutate({
        avatarUrl: path,
      });

      if (updateUser) {
        updateUser({
          avatarUrl: updatedUser?.avatarUrl,
        });
      }

      emit("success");
    } catch (e) {
      emit("error");
    } finally {
      uploading.value = false;
    }
  };
</script>

<template>
  <div
    ref="dropZoneRef"
    class="relative cursor-pointer rounded-full"
    @click="openFileDialog()"
  >
    <UserAvatar
      class="size-24 cursor-pointer text-xl"
      :avatarUrl="user?.avatarUrl"
      :name="user?.name ?? ''"
    />

    <div
      v-if="uploading"
      class="bg-card/90 absolute inset-0 z-20 flex items-center justify-center"
    >
      <LoaderIcon class="text-primary size-6 animate-spin" />
    </div>
  </div>

  <SaasCropImageDialog
    :open="cropDialogOpen"
    :image="image"
    @open-change="(open: boolean) => (cropDialogOpen = open)"
    @save="
      (imageData: Blob | null) => (onCrop(imageData), (cropDialogOpen = false))
    "
  />
</template>
