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
      files: z.array(z.string()).optional(),
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
      input: { sessionId, threadId, assistantId, sender, text, files },
    }) => {
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
        const messagePayload: any = {
          role: sender as "user" | "assistant",
          content: [
            {
              type: "text",
              text,
            },
          ],
          attachments: [],
        };

        if (files && files.length > 0) {
          for (const fileUrl of files) {
            const fileType = await getFileTypeFromUrl(fileUrl);

            if (fileType === "image") {
              // Push images into the content array
              messagePayload.content.push({
                type: "image_url",
                image_url: { url: fileUrl },
              });
            } else {
              // Handle other files by uploading them to OpenAI
              const response = await fetch(fileUrl);
              const file = await openai.files.create({
                file: response,
                purpose: "assistants",
              });
              messagePayload.attachments.push({
                file_id: file.id,
                tools: [{ type: "file_search" }],
              });
            }
          }
        }

        const initialMessage =
          "Welcome to ZuckerBot, your AI-powered assistant designed to revolutionize your advertising efforts. Whether you're a small business owner or an entrepreneur without a dedicated marketing team, ZuckerBot is here to simplify the complexities of online advertising. With ZuckerBot, you can create, manage, and optimize your ad campaigns across multiple platforms through a simple text chat interface. Please note that ZuckerBot currently does not support uploading files with .xlsx or .csv extensions. For best results, convert these files to PDF or TXT format before uploading.";

        if (text === initialMessage) {
          await openai.beta.threads.runs.createAndPoll(threadId, {
            assistant_id: assistantId,
          });
        }

        await openai.beta.threads.messages.create(threadId, messagePayload);

        if (text !== initialMessage) {
          await openai.beta.threads.runs.createAndPoll(threadId, {
            assistant_id: assistantId,
          });
        }

        const messages = await openai.beta.threads.messages.list(threadId);

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

function getFileTypeFromUrl(url: string): "image" | "other" {
  const imageExtensions = ["jpg", "jpeg", "png", "gif", "bmp"];

  // Remove query parameters by splitting at the "?"
  const cleanUrl = url.split("?")[0];

  // Extract the file extension
  const fileExtension = cleanUrl.split(".").pop()?.toLowerCase();

  if (fileExtension && imageExtensions.includes(fileExtension)) {
    return "image";
  }
  return "other";
}
