import { db } from "database";
import { z } from "zod";
import { protectedProcedure } from "../../trpc";
import { TRPCError } from "@trpc/server";
import { generateSessionName } from "utils";
import OpenAI from "openai";

export const update = protectedProcedure
  .input(
    z.object({
      id: z.string(),
      name: z.boolean().optional(),
      currentStep: z.string().optional(),
      adAccountId: z.string().optional(),
      campaignId: z.string().optional(),
    }),
  )
  .mutation(async ({ input }) => {
    const { currentStep, adAccountId, campaignId, name, id, ...otherData } =
      input;

    const data: any = { ...otherData };

    try {
      if (currentStep) {
        data.currentStep = currentStep;
      }

      if (adAccountId) {
        data.adAccountId = adAccountId;
      }

      if (campaignId) {
        data.campaignId = campaignId;
      }

      if (name) {
        const session = await db.chatSession.findUnique({
          where: { id },
          select: { threadId: true, assistantId: true },
        });

        if (session) {
          const openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY as string,
          });

          const newName = await generateSessionName(
            session.threadId,
            session.assistantId,
            openai,
          );

          data.name = newName;
        }
      }

      await db.chatSession.update({
        where: {
          id,
        },
        data,
      });
    } catch (e) {
      console.error(e);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
      });
    }
  });
