import { AssistantResponse } from "ai";
import OpenAI from "openai";
import { createApiCaller } from "api";
import type { AssistantStream } from "openai/lib/AssistantStream";
import {
  isFacebookAuth,
  getFacebookAuthUrl,
  listAccounts,
  listCampaigns,
  fetchFacebookInsights,
  createCampaign,
  createAdSet,
  createAdCreative,
  createAd,
  listPages,
} from "utils";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "",
});

export default defineEventHandler(async (event) => {
  const { message, sessionId, data } = await readBody(event);
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

  let content;
  try {
    content = JSON.parse(message);
  } catch (e) {
    // If not JSON, treat as regular text message
    content = [
      {
        type: "text",
        text: message,
      },
    ];
  }

  // Create the message in OpenAI thread
  const createdMessage = await openai.beta.threads.messages.create(threadId, {
    role: "user",
    content,
  });

  // Save the initial user message
  try {
    await apiCaller.chat.createMessage({
      sessionId,
      text: message,
      sender: "user",
      createdAt: new Date(),
      messageId: createdMessage.id,
    });

    // Trigger session name update
    apiCaller.chat.update({
      id: sessionId,
      // name: true,
    });
    // console.log("Initial user message saved:", createdMessage.id);
  } catch (error) {
    console.error("Error saving initial message:", error);
  }

  // Keep separate sets for created and done messages
  const createdMessageIds = new Set<string>();
  const doneMessageIds = new Set<string>();

  return AssistantResponse(
    { threadId, messageId: createdMessage.id },
    async ({ forwardStream }) => {
      const runStream = openai.beta.threads.runs.stream(threadId, {
        assistant_id: process.env.OPENAI_ASSISTANT_ID || "",
        additional_instructions: data?.today
          ? `Current date and time is ${data.today} (${data.currentTimezone}). Use this for any date calculations and never use dates in the past.`
          : undefined,
      });

      // Add general stream error handling
      runStream.on("error", (error) => {
        console.error("Stream error:", error);
      });

      // Handle message events
      (runStream as AssistantStream).on("messageCreated", async (message) => {
        console.log("Message created event:", message.id, message.role);

        if (createdMessageIds.has(message.id)) {
          console.log("Skipping duplicate created message:", message.id);
          return;
        }

        createdMessageIds.add(message.id);

        if (message.role === "user") {
          try {
            await apiCaller.chat.createMessage({
              sessionId,
              text:
                message.content[0]?.type === "text"
                  ? message.content[0].text.value
                  : "",
              sender: "user",
              createdAt: new Date(message.created_at),
              messageId: message.id,
            });
          } catch (error) {
            console.error("Error saving user message:", error);
          }
        }
      });

      (runStream as AssistantStream).on("messageDone", async (message) => {
        if (doneMessageIds.has(message.id)) {
          return;
        }

        doneMessageIds.add(message.id);

        if (message.role === "assistant") {
          try {
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
              messageId: message.id,
            });
          } catch (error) {
            console.error("Error saving assistant message:", error);
          }
        }
      });

      let runResult = await forwardStream(runStream);

      while (
        runResult?.status === "requires_action" &&
        runResult.required_action?.type === "submit_tool_outputs"
      ) {
        const tool_outputs = await Promise.all(
          runResult.required_action.submit_tool_outputs.tool_calls.map(
            async (toolCall) => {
              if (!isFacebookAuth(user)) {
                return {
                  tool_call_id: toolCall.id,
                  output: `Access token is missing or expired. Please authorize the app by visiting: ${getFacebookAuthUrl(
                    user,
                  )}`,
                };
              }

              switch (toolCall.function.name) {
                case "connectFacebookAccount":
                case "checkAccountConnection":
                  return {
                    tool_call_id: toolCall.id,
                    output: "User has connected their Facebook account",
                  };

                case "listAccounts":
                  return await listAccounts(
                    user.facebookAccessToken!,
                    sessionId,
                    toolCall,
                    apiCaller,
                  );

                case "listCampaigns":
                  return await listCampaigns(
                    user.facebookAccessToken!,
                    sessionId,
                    toolCall,
                    apiCaller,
                  );

                case "getFacebookInsights":
                  return await fetchFacebookInsights(
                    user.facebookAccessToken!,
                    toolCall,
                  );

                case "createFacebookAdCampaign":
                  return await createCampaign(
                    user.facebookAccessToken!,
                    sessionId,
                    toolCall,
                    apiCaller,
                  );

                case "createFacebookAdSet":
                  return await createAdSet(
                    user.facebookAccessToken!,
                    sessionId,
                    toolCall,
                    apiCaller,
                  );

                case "createFacebookAdCreative":
                  return await createAdCreative(
                    user.facebookAccessToken!,
                    sessionId,
                    toolCall,
                    apiCaller,
                  );

                case "createFacebookAd":
                  return await createAd(
                    user.facebookAccessToken!,
                    sessionId,
                    toolCall,
                    apiCaller,
                  );

                case "listPages":
                  return await listPages(
                    user.facebookAccessToken!,
                    sessionId,
                    toolCall,
                    apiCaller,
                  );

                case "listBusinesses":
                  return await listBusinesses(
                    user.facebookAccessToken!,
                    toolCall,
                  );

                case "createAdAccount":
                  return await createAdAccount(
                    user.facebookAccessToken!,
                    toolCall,
                  );

                default:
                  throw new Error(
                    `Unknown tool call function: ${toolCall.function.name}`,
                  );
              }
            },
          ),
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
