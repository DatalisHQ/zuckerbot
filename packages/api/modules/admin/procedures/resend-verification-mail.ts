import { TRPCError } from "@trpc/server";
import { generateOneTimePassword, generateVerificationToken } from "auth";
import { db } from "database";
import { getBaseUrl } from "utils";
import { z } from "zod";
import { sendEmail } from "../../../../../apps/web/server/utils/mail/send";
import { adminProcedure } from "../../trpc";

export const resendVerificationMail = adminProcedure
  .input(
    z.object({
      userId: z.string(),
    }),
  )
  .mutation(async ({ input: { userId } }) => {
    const user = await db.user.findUnique({
      where: {
        id: userId,
      },
    });

    if (!user) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "User not found.",
      });
    }

    if (user.emailVerified) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "User's email is already verified.",
      });
    }

    const token = await generateVerificationToken({
      userId: user.id,
    });
    const otp = await generateOneTimePassword({
      userId: user.id,
      type: "SIGNUP",
      identifier: user.email,
    });

    const url = new URL(getBaseUrl());
    url.searchParams.set("token", token);

    try {
      await sendEmail({
        templateId: "newUser",
        to: user.email,
        context: {
          url: url.toString(),
          otp,
          name: user.name ?? user.email,
        },
      });
    } catch (e) {
      console.error(e);

      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Could not send email",
      });
    }
  });
