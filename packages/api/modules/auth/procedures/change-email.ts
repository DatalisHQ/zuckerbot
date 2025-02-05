import {
  createSessionCookie,
  generateVerificationToken,
  invalidateUserSessions,
} from "auth";
import { db } from "database";
import { setCookie } from "h3";
import { z } from "zod";
import { protectedProcedure } from "../../trpc";

export const changeEmail = protectedProcedure
  .input(
    z.object({
      email: z
        .string()
        .email()
        .min(1)
        .max(255)
        .transform((v) => v.toLowerCase()),
      callbackUrl: z.string(),
    }),
  )
  .mutation(async ({ ctx: { user, event }, input: { email, callbackUrl } }) => {
    if (!user) {
      return;
    }

    const updatedUser = await db.user.update({
      where: {
        id: user.id,
      },
      data: {
        email,
        emailVerified: false,
      },
    });

    await invalidateUserSessions(user.id);

    const sessionCookie = createSessionCookie(null);
    if (event) {
      setCookie(
        event,
        sessionCookie.name,
        sessionCookie.value,
        sessionCookie.attributes,
      );
    }

    const token = await generateVerificationToken({
      userId: user.id,
    });

    const url = new URL(callbackUrl);
    url.searchParams.set("token", token);

    // @ts-expect-error - sendEmail is auto-imported
    sendEmail({
      to: email,
      templateId: "emailChange",
      context: {
        name: updatedUser.name ?? updatedUser.email,
        url: url.toString(),
      },
    });
  });
