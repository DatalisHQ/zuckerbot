import { TRPCError } from "@trpc/server";
import { ChatSessionSchema, db } from "database";
import { z } from "zod";
import { protectedProcedure } from "../../trpc";

export const byId = protectedProcedure
  .input(
    z.object({
      id: z.string(),
    }),
  )
  .output(ChatSessionSchema)
  .query(async ({ input: { id } }) => {
    const session = await db.chatSession.findFirst({
      where: {
        id,
      },
    });

    if (!session) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Session not found.",
      });
    }

    return session;
  });
