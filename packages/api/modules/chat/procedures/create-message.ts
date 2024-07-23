import OpenAI from "openai";
import { db } from "database";
import { z } from "zod";
import { protectedProcedure } from "../../trpc";

export const createMessage = protectedProcedure
  .input(
    z.object({
      sessionId: z.string(),
      threadId: z.string(),
      assistantId: z.string(),
      text: z.string(),
      sender: z.string(),
    }),
  )
  .output(
    z.object({
      sender: z.string(),
      text: z.string(),
    }),
  )
  .query(
    async ({ input: { sessionId, threadId, assistantId, sender, text } }) => {
      const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY as string,
      });

      if (sender === "user") {
        await db.message.create({
          data: {
            sessionId,
            text,
            sender,
          },
        });
      }

      try {
        await openai.beta.threads.messages.create(threadId, {
          role: sender as "user" | "assistant",
          content: text,
        });

        const run = await openai.beta.threads.runs.createAndPoll(threadId, {
          assistant_id: assistantId,
        });

        const messages = await openai.beta.threads.messages.list(run.thread_id);

        const response = await db.message.create({
          data: {
            sessionId,
            sender: messages.data[0].role,
            text: messages.data[0].content[0].text.value,
          },
        });

        return {
          id: response.id,
          sessionId: response.sessionId,
          sender: response.sender,
          text: response.text,
          createdAt: response.createdAt,
        };
      } catch (error) {
        console.error("Error processing chat message:", error);
        throw error;
      }
    },
  );
