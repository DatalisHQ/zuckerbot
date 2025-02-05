import OpenAI from "openai";

export const isPaidUser = (user: any) => {
  const paidEmails = [
    "brieuc@btribouillet.com",
    "brieuc@datalis.app",
    "davis@datalis.app",
    "dkkdek2536@gmail.com",
    "happinessoluwamayomikun@gmail.com",
    "brieuc+fbtest@datalis.app",
  ];

  if (user) {
    return user.isPaidUser || paidEmails.includes(user.email);
  }
  return false;
};

// Function to generate session name from conversation
export const generateSessionName = async (
  threadId: string,
): Promise<string> => {
  try {
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY as string,
    });

    // Create a separate run to analyze the conversation
    const nameGenerationRun = await openai.beta.threads.runs.create(threadId, {
      assistant_id: (process.env.OPENAI_ASSISTANT_ID as string) || "",
      instructions: `Generate a concise, descriptive title for this conversation based on the user's goal or request. The title should:

- Capture the main marketing objective or task
- Be specific and action-oriented
- Use professional marketing terminology
- Be 3-6 words long
- Use Title Case

For example:
If user asks about creating ads based on performance: "Coffee Shop Ad Optimization"
If user wants to analyze campaign data: "Campaign Performance Analysis"
If user needs help with targeting: "Audience Targeting Strategy"

Return only the title without any additional text, punctuation, or formatting.`,
    });

    // Poll for completion
    let runStatus = await openai.beta.threads.runs.retrieve(
      threadId,
      nameGenerationRun.id,
    );

    while (runStatus.status !== "completed") {
      if (runStatus.status === "failed") {
        return "New Ad Campaign";
      }
      await new Promise((resolve) => setTimeout(resolve, 500));
      runStatus = await openai.beta.threads.runs.retrieve(
        threadId,
        nameGenerationRun.id,
      );
    }

    // Get the generated title from the messages
    const messages = await openai.beta.threads.messages.list(threadId);
    const titleMessage = messages.data[0]?.content[0]?.text?.value;

    // Clean up and format the generated title
    const cleanTitle =
      titleMessage
        ?.replace(/["""]/g, "")
        ?.replace(/^\s*[-•]\s*/, "") // Remove leading bullet points or dashes
        ?.trim()
        ?.slice(0, 50) || "New Ad Campaign";

    // Ensure title case formatting
    return cleanTitle
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");
  } catch (error) {
    console.error("Error generating session name:", error);
    return "New Ad Campaign";
  }
};
