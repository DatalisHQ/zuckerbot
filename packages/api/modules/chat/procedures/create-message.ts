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

      // Fetch current session context
      const session = await db.chatSession.findUnique({
        where: { id: sessionId },
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

                  const token = currentUser?.facebookAccessToken;
                  const tokenExpiresAt = currentUser?.facebookTokenExpiresAt;

                  console.log(token);

                  if (!token || new Date() > new Date(tokenExpiresAt)) {
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
                    return await listAccounts(token, sessionId, tool);
                  } else if (tool.function.name === "listCampaigns") {
                    return await listCampaigns(token, sessionId, tool);
                  } else if (tool.function.name === "getFacebookInsights") {
                    return await fetchFacebookInsights(token, tool);
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

        // Initial welcome message
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

// Utility function to fetch ad accounts
async function fetchAdAccounts(token) {
  const response = await fetch(
    `https://graph.facebook.com/v20.0/me/adaccounts?access_token=${token}`,
  );
  const data = await response.json();
  return data.data.map((account) => account.id); // Return an array of ad account IDs
}

// Utility function to fetch campaigns
async function fetchCampaigns(adAccountId, token) {
  if (adAccountId.startsWith("act_")) {
    adAccountId = adAccountId.split("act_")[1];
  }

  const response = await fetch(
    `https://graph.facebook.com/v20.0/act_${adAccountId}/campaigns?access_token=${token}`,
  );

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error.message || "Failed to fetch campaigns");
  }
  // Extracting campaign IDs from the response
  return data.data.map((campaign) => campaign.id);
}

// Utility function to get the file type
function getFileTypeFromUrl(url: string): "image" | "other" {
  const cleanUrl = url.split("?")[0];
  const fileExtension = cleanUrl.split(".").pop()?.toLowerCase();
  return fileExtension && imageExtensions.includes(fileExtension)
    ? "image"
    : "other";
}

function authUser(currentUser, tool) {
  const clientId = "1119807469249263";
  const redirectUri = "https://zuckerbot.ai/auth/facebook/callback";
  const state = encodeURIComponent(JSON.stringify({ userId: currentUser.id }));

  const authUrl = `https://www.facebook.com/v20.0/dialog/oauth?client_id=${clientId}&redirect_uri=${redirectUri}&state=${state}&scope=ads_management&response_type=token`;

  return {
    tool_call_id: tool.id,
    output: `Access token is missing or expired. Please authorize the app by visiting: ${authUrl}`,
  };
}

async function listAccounts(token, sessionId, tool) {
  const adAccounts = await fetchAdAccounts(token);
  if (adAccounts.length > 1) {
    return {
      tool_call_id: tool.id,
      output: `Please select an ad account: ${adAccounts.join(", ")}`,
    };
  } else if (adAccounts.length === 1) {
    await db.chatSession.update({
      where: {
        id: sessionId,
      },
      data: {
        adAccountId: adAccounts[0],
      },
    });

    return {
      tool_call_id: tool.id,
      output: `Only one ad account found: ${adAccounts[0]} selected`,
    };
  } else {
    return {
      tool_call_id: tool.id,
      output: `No ad accounts found.`,
    };
  }
}

async function listCampaigns(token, sessionId, tool) {
  const args = JSON.parse(tool.function.arguments);
  const adAccountId = args.ad_account_id;

  const campaigns = await fetchCampaigns(adAccountId, token);

  if (campaigns.length > 1) {
    return {
      tool_call_id: tool.id,
      output: `Here are the available campaigns for Ad Account ${adAccountId}: ${campaigns.join(
        ", ",
      )}`,
    };
  } else if (campaigns.length === 1) {
    const campaignId = campaigns[0];

    await db.chatSession.update({
      where: {
        id: sessionId,
      },
      data: {
        campaignId,
      },
    });

    return {
      tool_call_id: tool.id,
      output: `Only one campaign found: ${campaignId} selected`,
    };
  } else {
    return {
      tool_call_id: tool.id,
      output: `No campaigns found for Ad Account ${adAccountId}.`,
    };
  }
}

async function fetchFacebookInsights(token, tool) {
  const args = JSON.parse(tool.function.arguments);
  const campaignId = args.campaign_id;

  const insightsUrl = `https://graph.facebook.com/v20.0/${campaignId}/insights?fields=impressions,clicks,spend&date_preset=${args.date_preset}&access_token=${token}`;

  try {
    const response = await fetch(insightsUrl, {
      method: "GET",
    });
    const data = await response.json();

    if (!response.ok || !data.data || data.data.length === 0) {
      return {
        tool_call_id: tool.id,
        output: `No insights data available for this campaign. Please try another date range. Possible values: today, yesterday, this_month, last_month, this_quarter, maximum, data_maximum, last_3d, last_7d, last_14d, last_28d, last_30d, last_90d, last_week_mon_sun, last_week_sun_sat, last_quarter, last_year, this_week_mon_today, this_week_sun_today, this_year.`,
      };
    }

    const insights = data.data![0];

    return {
      tool_call_id: tool.id,
      output: `Impressions: ${insights.impressions}, clicks: ${insights.clicks}, spend: ${insights.spend}`,
    };
  } catch (error) {
    return {
      tool_call_id: tool.id,
      output: `Error fetching insights: ${error.message}`,
    };
  }
}
