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
      ctx: { user },
      input: { sessionId, threadId, assistantId, sender, text, files },
    }) => {
      const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY as string,
      });

      const handleRequiresAction = async (run) => {
        // Check if there are tools that require outputs
        if (
          run.required_action &&
          run.required_action.submit_tool_outputs &&
          run.required_action.submit_tool_outputs.tool_calls
        ) {
          // Loop through each tool in the required action section
          const toolOutputs = await Promise.all(
            run.required_action.submit_tool_outputs.tool_calls.map(
              async (tool) => {
                if (tool.function.name === "getFacebookInsights") {
                  // Fetch user from the database (sessionId is linked to the user)
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

                  // Step 1: Check if the token exists and is not expired
                  const token = currentUser?.facebookAccessToken;
                  const tokenExpiresAt = currentUser?.facebookTokenExpiresAt;

                  if (!token || new Date() > new Date(tokenExpiresAt)) {
                    // Step 2: Token is missing or expired, generate the authorization URL
                    const clientId = "1119807469249263"; // process.env.FACEBOOK_APP_ID; // Your Facebook App ID
                    const redirectUri =
                      "http://localhost:3000/auth/facebook/callback"; // process.env.FACEBOOK_REDIRECT_URI; // Your Redirect URI
                    const authUrl = `https://www.facebook.com/v20.0/dialog/oauth?client_id=${clientId}&redirect_uri=${redirectUri}&scope=ads_read&response_type=token`;

                    // Return the URL as a string
                    return {
                      tool_call_id: tool.id,
                      output: `Access token is missing or expired. Please authorize the app by visiting: ${authUrl}`,
                    };
                  }

                  return {
                    tool_call_id: tool.id,
                    output: `Impressions: 12057, clicks: 345, currentUser`,
                  };
                }
              },
            ),
          );

          // Submit all tool outputs at once after collecting them in a list
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

          // Check status after submitting tool outputs
          return handleRunStatus(run);
        }
      };

      const handleRunStatus = async (run) => {
        // Check if the run is completed
        if (run.status === "completed") {
          const messages = await openai.beta.threads.messages.list(threadId);
          console.log(messages.data);

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
          console.log(run.status);
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

        let run;
        if (text === initialMessage) {
          run = await openai.beta.threads.runs.createAndPoll(threadId, {
            assistant_id: assistantId,
          });
        }

        await openai.beta.threads.messages.create(threadId, messagePayload);

        if (text !== initialMessage) {
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
