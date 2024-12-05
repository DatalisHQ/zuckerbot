import { AssistantResponse } from "ai";
import OpenAI from "openai";
import { createApiCaller } from "api";
import {
  isFacebookAuth,
  getFacebookAuthUrl,
  listAccounts,
  listCampaigns,
  fetchFacebookInsights,
} from "utils";

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

  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY || "",
  });

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

  return AssistantResponse(
    { threadId, messageId: createdMessage.id },
    async ({ forwardStream }) => {
      const runStream = openai.beta.threads.runs.stream(threadId, {
        assistant_id: process.env.OPENAI_ASSISTANT_ID || "",
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
