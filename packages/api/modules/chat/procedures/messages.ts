import { MessageSchema, db } from "database";
import { z } from "zod";
import { protectedProcedure } from "../../trpc";

export const messages = protectedProcedure
  .input(
    z.object({
      sessionId: z.string(),
    }),
  )
  .output(
    z.array(
        MessageSchema,
    ),
  )
  .query(async ({ input: { sessionId } }) => {
    const messages = await db.message.findMany({
      where: {
        sessionId
      },
    });

    return messages ?? []
  });
