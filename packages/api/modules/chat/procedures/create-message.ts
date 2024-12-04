import { db } from "database";
import { z } from "zod";
import { protectedProcedure } from "../../trpc";

export const createMessage = protectedProcedure
  .input(
    z.object({
      sessionId: z.string(),
      text: z.string(),
      sender: z.string(),
      createdAt: z.date().optional(),
      messageId: z.string().optional(),
    }),
  )
  .output(
    z.object({
      sender: z.string(),
      text: z.string(),
    }),
  )
  .mutation(
    async ({
      ctx: { user },
      input: { sessionId, sender, text, createdAt, messageId },
    }) => {
      try {
        const message = await db.message.create({
          data: {
            sessionId,
            text,
            sender,
            ...(createdAt && { createdAt }), // Only include if provided
            ...(messageId && { messageId }), // Only include if provided
          },
          select: {
            id: true,
            sender: true,
            text: true,
          },
        });

        return message;
      } catch (error) {
        console.error("Error processing chat message:", error);
        throw error;
      }
    },
  );
