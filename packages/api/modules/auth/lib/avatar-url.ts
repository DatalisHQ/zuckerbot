import { getSignedUrl } from "storage";

export async function getUserAvatarUrl(pathOrUrl: string | undefined | null) {
  // if avatar url is only the path (e.g. /avatars/1234.png)
  // we need to create a signed url for accessing the storage
  let avatarUrl = pathOrUrl ?? null;
  if (avatarUrl && !avatarUrl.startsWith("http")) {
    avatarUrl = await getSignedUrl(avatarUrl, {
      bucket: "datalis-avatars",
      expiresIn: 360,
    });
  }

  return avatarUrl;
}
