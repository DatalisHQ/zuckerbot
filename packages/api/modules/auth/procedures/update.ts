import { db } from "database";
import { z } from "zod";
import { protectedProcedure } from "../../trpc";
import { getUserAvatarUrl } from "../lib/avatar-url";

export const update = protectedProcedure
  .input(
    z.object({
      name: z.string().min(1).optional(),
      avatarUrl: z.string().min(1).optional(),
      onboardingComplete: z.boolean().optional(),
      accessToken: z.string().optional(),
      facebookTokenExpiresAt: z.date().optional(),
    }),
  )
  .mutation(async ({ ctx: { user }, input }) => {
    const { accessToken, facebookTokenExpiresAt, ...otherData } = input;

    // Prepare data for update
    const data: any = { ...otherData };

    // If access token and expiration time are provided, update them
    if (accessToken && facebookTokenExpiresAt) {
      data.facebookAccessToken = accessToken;
      data.facebookTokenExpiresAt = facebookTokenExpiresAt;
    }

    // Update the user in the database
    const updatedUser = await db.user.update({
      where: {
        id: user.id,
      },
      data,
      select: {
        id: true,
        email: true,
        role: true,
        avatarUrl: true,
        name: true,
        onboardingComplete: true,
        facebookAccessToken: true, // Optionally select these fields to return them
        facebookTokenExpiresAt: true, // Optionally select these fields to return them
      },
    });

    return {
      ...updatedUser,
      avatarUrl: await getUserAvatarUrl(updatedUser.avatarUrl),
    };
  });
