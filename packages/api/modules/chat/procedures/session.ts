import { ChatSessionSchema, db } from "database";
import { z } from "zod";
import { protectedProcedure } from "../../trpc";
import { TRPCError } from "@trpc/server";

export const session = protectedProcedure
  .input(
    z.object({
      id: z.string().min(1, { message: "Session ID is required" }),
    }),
  )
  .output(ChatSessionSchema)
  .query(async ({ input: { id }, ctx: { user } }) => {
    const session = await db.chatSession.findUnique({
      where: {
        id,
        userId: user.id,
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
