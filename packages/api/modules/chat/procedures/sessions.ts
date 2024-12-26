import { ChatSessionSchema, db } from "database";
import { z } from "zod";
import { protectedProcedure } from "../../trpc";

export const sessions = protectedProcedure
  .output(z.array(ChatSessionSchema))
  .query(async ({ ctx: { user } }) => {
    const sessions = await db.chatSession.findMany({
      where: {
        userId: user.id,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 15,
    });

    return sessions ?? [];
  });
