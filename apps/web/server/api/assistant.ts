import { AssistantResponse } from "ai";
import OpenAI from "openai";
import { createApiCaller } from "api";
import type { AssistantStream } from "openai/lib/AssistantStream";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "",
});

export default defineEventHandler(async (event) => {
  const { message, sessionId } = await readBody(event);
  const apiCaller = await createApiCaller(event);

  const user = await apiCaller.auth.user();
  if (!user) {
    throw createError({ statusCode: 401 });
  }

  const session = await apiCaller.chat.byId({
    id: sessionId,
  });

  if (!session) {
    throw createError({ statusCode: 404 });
  }

  // Create thread if needed
  const threadId = session.threadId ?? (await openai.beta.threads.create()).id;

  // Update session with thread ID if needed
  if (!session.threadId) {
    await apiCaller.chat.update({
      id: sessionId,
      threadId,
    });
  }

  // Create the message in OpenAI thread
  const createdMessage = await openai.beta.threads.messages.create(threadId, {
    role: "user",
    content: message,
  });

  // Keep track of saved message IDs to prevent duplicates
  const savedMessageIds = new Set<string>();

  return AssistantResponse(
    { threadId, messageId: createdMessage.id },
    async ({ forwardStream }) => {
      const runStream = openai.beta.threads.runs.stream(threadId, {
        assistant_id:
          process.env.OPENAI_ASSISTANT_ID ??
          (() => {
            throw new Error("ASSISTANT_ID is not set");
          })(),
      });

      // Handle message events
      (runStream as AssistantStream).on("messageCreated", async (message) => {
        // Skip if we've already saved this message
        if (savedMessageIds.has(message.id)) return;
        savedMessageIds.add(message.id);

        if (message.role === "user") {
          await apiCaller.chat.createMessage({
            sessionId,
            text:
              message.content[0]?.type === "text"
                ? message.content[0].text.value
                : "",
            sender: "user",
            createdAt: new Date(message.created_at),
            messageId: message.id, // Store OpenAI's message ID for reference
          });
        }
      });

      (runStream as AssistantStream).on("messageDone", async (message) => {
        // Skip if we've already saved this message
        if (savedMessageIds.has(message.id)) return;
        savedMessageIds.add(message.id);

        if (message.role === "assistant") {
          const textContent = message.content
            .filter((content) => content.type === "text")
            .map((content) =>
              content.type === "text" ? content.text.value : "",
            )
            .join("\n");

          await apiCaller.chat.createMessage({
            sessionId,
            text: textContent,
            sender: "assistant",
            createdAt: new Date(message.created_at),
            messageId: message.id, // Store OpenAI's message ID for reference
          });
        }
      });

      let runResult = await forwardStream(runStream);

      while (
        runResult?.status === "requires_action" &&
        runResult.required_action?.type === "submit_tool_outputs"
      ) {
        const toolCalls =
          runResult.required_action.submit_tool_outputs.tool_calls;

        const tool_outputs = await Promise.all(
          toolCalls.map(async (toolCall) => {
            const parameters = JSON.parse(toolCall.function.arguments);
            return {
              tool_call_id: toolCall.id,
              output: "", // Add your tool output here
            };
          }),
        );

        runResult = await forwardStream(
          openai.beta.threads.runs.submitToolOutputsStream(
            threadId,
            runResult.id,
            { tool_outputs },
          ),
        );
      }
    },
  );
});
