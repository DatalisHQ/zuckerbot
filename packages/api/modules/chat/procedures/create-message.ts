// import OpenAI from "openai";
import { db, MessageSchema } from "database";
import { z } from "zod";
import { protectedProcedure } from "../../trpc";

export const createMessage = protectedProcedure
  .input(
    z.object({
      sessionId: z.string(),
      text: z.string(),
    }),
  )
  .output(MessageSchema)
  .query(async ({ input: { sessionId, text } }) => {
    // const openai = new OpenAI({
    //   apiKey: process.env.OPENAI_API_KEY as string,
    // });

    const response = await db.message.create({
      data: {
        sessionId,
        text,
        sender: "user",
      },
    });

    return {
      id: response.id,
      sessionId: response.sessionId,
      sender: response.sender,
      text: response.text,
      createdAt: response.createdAt,
    };



    // const response = await openai.chat.completions.create({
    //   model: "gpt-3.5-turbo",
    //   messages: [
    //     {
    //       role: "user",
    //       content: `List me five funny product names that could be used for ${topic}`,
    //     },
    //   ],
    // });

    // const ideas = (response.choices[0].message.content ?? "")
    //   .split("\n")
    //   .filter((name) => name.length > 0);
  });
