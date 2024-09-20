import { db } from "database";
import { z } from "zod";
import { protectedProcedure } from "../../trpc";
import { TRPCError } from "@trpc/server";

export const update = protectedProcedure
  .input(
    z.object({
      id: z.string(),
      currentStep: z.string().optional(),
      adAccountId: z.string().optional(),
      campaignId: z.string().optional(),
    }),
  )
  .mutation(async ({ input }) => {
    const { currentStep, adAccountId, campaignId, id, ...otherData } = input;

    const data: any = { ...otherData };

    if (currentStep) {
      data.currentStep = currentStep;
    }

    if (adAccountId) {
      data.adAccountId = adAccountId;
    }

    if (campaignId) {
      data.campaignId = campaignId;
    }

    try {
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
