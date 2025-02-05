import { TRPCError } from "@trpc/server";
import { generateOneTimePassword, generateVerificationToken } from "auth";
import { hashPassword } from "auth/lib/hashing";
import { passwordSchema } from "auth/lib/passwords";
import { UserRoleSchema, db } from "database";
import { logger } from "logs";
import { z } from "zod";
import { sendEmail } from "../../../../../apps/web/server/utils/mail/send";
import { publicProcedure } from "../../trpc";

export const signup = publicProcedure
  .input(
    z.object({
      email: z
        .string()
        .email()
        .min(1)
        .max(255)
        .transform((v) => v.trim().toLowerCase())
        .refine(
          async (email) =>
            !(await db.user.findUnique({
              where: {
                email,
              },
            })),
          {
            params: {
              i18n: {
                key: "email_already_exists",
              },
            },
          },
        ),
      password: passwordSchema,
      callbackUrl: z.string(),
    }),
  )
  .mutation(async ({ input: { email, password, callbackUrl } }) => {
    try {
      const hashedPassword = await hashPassword(password);
      const user = await db.user.create({
        data: {
          email,
          role: UserRoleSchema.Values.USER,
          hashedPassword,
        },
      });

      const token = await generateVerificationToken({
        userId: user.id,
      });
      const otp = await generateOneTimePassword({
        userId: user.id,
        type: "SIGNUP",
        identifier: email,
      });

      const url = new URL(callbackUrl);
      url.searchParams.set("token", token);

      await sendEmail({
        templateId: "newUser",
        to: email,
        context: {
          url: url.toString(),
          otp,
          name: user.name ?? user.email,
        },
      });
    } catch (e) {
      logger.error(e);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "An unknown error occurred.",
      });
    }
  });
