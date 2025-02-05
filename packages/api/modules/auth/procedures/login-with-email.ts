import { TRPCError } from "@trpc/server";
import { generateOneTimePassword, generateVerificationToken } from "auth";
import { db } from "database";
import { logger } from "logs";
import { z } from "zod";
import { sendEmail } from "../../../../../apps/web/server/utils/mail/send";
import { publicProcedure } from "../../trpc";

export const loginWithEmail = publicProcedure
  .input(
    z.object({
      email: z
        .string()
        .email()
        .min(1)
        .max(255)
        .transform((v) => v.trim().toLowerCase())
        .superRefine(async (email, ctx) => {
          const existingUser = await db.user.findUnique({ where: { email } });

          if (!existingUser) {
            ctx.addIssue({
              code: "custom",
              params: {
                i18n: {
                  key: "email_not_found",
                },
              },
            });
          } else if (!existingUser.emailVerified) {
            ctx.addIssue({
              code: "custom",
              params: {
                i18n: {
                  key: "email_not_verified",
                },
              },
            });
          }
        }),
      callbackUrl: z.string(),
    }),
  )
  .mutation(async ({ input: { email, callbackUrl } }) => {
    try {
      const user = await db.user.findUnique({
        where: {
          email,
        },
      });

      if (!user) {
        throw new Error("User not found");
      }

      const token = await generateVerificationToken({
        userId: user.id,
      });
      const otp = await generateOneTimePassword({
        userId: user.id,
        type: "LOGIN",
        identifier: email,
      });

      const url = new URL(callbackUrl);
      url.searchParams.set("token", token);

      await sendEmail({
        templateId: "magicLink",
        to: email,
        context: {
          url: url.toString(),
          name: user.name ?? user.email,
          otp,
        },
      });
    } catch (e) {
      logger.error(e);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
      });
    }
  });
