import { z } from "zod";
import { sendEmail } from "../../../../../apps/web/server/utils/mail/send";
import { publicProcedure } from "../../trpc/trpc";

export const signup = publicProcedure
  .input(
    z.object({
      email: z.string(),
    }),
  )
  .mutation(async ({ input: { email } }) => {
    return await sendEmail({
      to: email,
      templateId: "newsletterSignup",
      context: {},
    });
  });
