import OpenAI from "openai";
import { db } from "database";
import { z } from "zod";
import { protectedProcedure } from "../../trpc";
import { getSignedUrl } from "storage";
import { assistantConfig } from "utils";

export const create = protectedProcedure
  .input(
    z.object({
      name: z.string(),
    }),
  )
  .mutation(async ({ input: { name }, ctx: { user } }) => {
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY as string,
    });

    const knowledgeSignedUrl = await getSignedUrl("/knowledge.json", {
      bucket: "datalis-avatars",
      expiresIn: 360,
    });

    const response = await fetch(knowledgeSignedUrl);

    const knowledgeFile = await openai.files.create({
      file: response,
      purpose: "assistants",
    });

    const vectorStore = await openai.beta.vectorStores.create({
      name: "ZuckerBot",
      file_ids: [knowledgeFile.id],
    });

    const assistant = await openai.beta.assistants.create(assistantConfig);
    await openai.beta.assistants.update(assistant.id, {
      tool_resources: { file_search: { vector_store_ids: [vectorStore.id] } },
    });
    const thread = await openai.beta.threads.create();

    const session = await db.chatSession.create({
      data: {
        name,
        user: { connect: { id: user.id } },
        assistantId: assistant.id,
        threadId: thread.id,
      },
      select: {
        id: true,
        name: true,
        assistantId: true,
        threadId: true,
        createdAt: true,
      },
    });

    return session;
  });
