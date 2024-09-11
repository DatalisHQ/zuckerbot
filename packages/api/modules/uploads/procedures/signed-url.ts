import { TRPCError } from "@trpc/server";
import { getSignedUrl } from "storage";
import { z } from "zod";
import { protectedProcedure } from "../../trpc";

export const signedUrl = protectedProcedure
  .input(
    z.object({
      bucket: z.string().min(1),
      path: z.string().min(1),
    }),
  )
  .mutation(async ({ input: { bucket, path } }) => {
    // ATTENTION: be careful with how you give access to write to the storage
    // always check if the user has the right to write to the desired bucket before giving them a signed url

    if (bucket === process.env.NUXT_PUBLIC_S3_AVATARS_BUCKET_NAME) {
      return await getSignedUrl(path, { bucket });
    }

    throw new TRPCError({
      code: "FORBIDDEN",
    });
  });
