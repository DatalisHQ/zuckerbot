import OpenAI from "openai";
import { db } from "database";
import { z } from "zod";
import { protectedProcedure } from "../../trpc";
import {
  isFacebookAuth,
  listAccounts,
  listCampaigns,
  authUser,
  fetchFacebookInsights,
} from "utils";

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
      ctx: { user },
      input: { sessionId, threadId, assistantId, sender, text, files },
    }) => {
      const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY as string,
      });

      const handleRequiresAction = async (run) => {
        if (
          run.required_action &&
          run.required_action.submit_tool_outputs &&
          run.required_action.submit_tool_outputs.tool_calls
        ) {
          const toolOutputs = await Promise.all(
            run.required_action.submit_tool_outputs.tool_calls.map(
              async (tool) => {
                if (
                  tool.function.name === "getFacebookInsights" ||
                  tool.function.name === "listAccounts" ||
                  tool.function.name === "listCampaigns" ||
                  tool.function.name === "connectFacebookAccount" ||
                  tool.function.name === "checkAccountConnection"
                ) {
                  const currentUser = await db.user.findUnique({
                    where: { id: user.id },
                  });

                  if (!currentUser) {
                    return {
                      tool_call_id: tool.id,
                      output:
                        "User not found. Please ensure you are logged in.",
                    };
                  }

                  if (!isFacebookAuth(currentUser)) {
                    return authUser(currentUser, tool);
                  }

                  if (
                    tool.function.name === "connectFacebookAccount" ||
                    tool.function.name === "checkAccountConnection"
                  ) {
                    return {
                      tool_call_id: tool.id,
                      output: `User has connected their Facebook account`,
                    };
                  }

                  if (tool.function.name === "listAccounts") {
                    return await listAccounts(
                      currentUser.facebookAccessToken,
                      sessionId,
                      tool,
                      db,
                    );
                  } else if (tool.function.name === "listCampaigns") {
                    return await listCampaigns(
                      currentUser.facebookAccessToken,
                      sessionId,
                      tool,
                      db,
                    );
                  } else if (tool.function.name === "getFacebookInsights") {
                    return await fetchFacebookInsights(
                      currentUser.facebookAccessToken,
                      tool,
                    );
                  }
                }
              },
            ),
          );

          // Submit all tool outputs at once
          if (toolOutputs.length > 0) {
            run = await openai.beta.threads.runs.submitToolOutputsAndPoll(
              threadId,
              run.id,
              { tool_outputs: toolOutputs },
            );
            console.log("Tool outputs submitted successfully.");
          } else {
            console.log("No tool outputs to submit.");
          }

          return handleRunStatus(run);
        }
      };

      const handleRunStatus = async (run) => {
        if (run.status === "completed") {
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
        } else if (run.status === "requires_action") {
          return await handleRequiresAction(run);
        } else {
          console.error("Run did not complete:", run);
        }
      };

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

        // Handle file uploads if any
        if (files && files.length > 0) {
          for (const fileUrl of files) {
            const fileType = await getFileTypeFromUrl(fileUrl);
            if (fileType === "image") {
              messagePayload.content.push({
                type: "image_url",
                image_url: { url: fileUrl },
              });
            } else {
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

        let run;

        // Determine if the message is the initial welcome message
        const initialMessageStart = "Welcome to ZuckerBot!";
        const isInitialMessage = text.includes(initialMessageStart);

        if (isInitialMessage) {
          run = await openai.beta.threads.runs.createAndPoll(threadId, {
            assistant_id: assistantId,
          });

          const response = await db.message.create({
            data: {
              sessionId,
              sender,
              text,
            },
          });

          return {
            id: response.id,
            sessionId: response.sessionId,
            sender: response.sender,
            text: response.text,
            createdAt: response.createdAt,
          };
        }

        if (!isInitialMessage) {
          await openai.beta.threads.messages.create(threadId, messagePayload);
          run = await openai.beta.threads.runs.createAndPoll(threadId, {
            assistant_id: assistantId,
          });
        }

        return handleRunStatus(run);
      } catch (error) {
        console.error("Error processing chat message:", error);
        throw error;
      }
    },
  );

// Utility function to get the file type
function getFileTypeFromUrl(url: string): "image" | "other" {
  const cleanUrl = url.split("?")[0];
  const fileExtension = cleanUrl.split(".").pop()?.toLowerCase();
  return fileExtension && imageExtensions.includes(fileExtension)
    ? "image"
    : "other";
}
