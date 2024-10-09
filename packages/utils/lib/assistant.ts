import { getFacebookAuthUrl, isFacebookAuth } from "./facebook";

export const getInitialMessage = (user: any) => {
  if (isFacebookAuth(user)) {
    const initialMessage = `
👋 **Welcome to ZuckerBot!**

I'm your AI-powered assistant dedicated to helping you create, analyze, and optimize your Meta (Facebook) ad campaigns effortlessly.

---

💡 **How to Interact with ZuckerBot**

You can use the following commands to manage your ad campaigns:

- **\`list my account ids\`**  
  Retrieves all your connected Facebook ad account IDs.

- **\`list my campaign ids\`**  
  Displays the IDs of all your ad campaigns within your connected ad accounts.

- **\`list my insights\`**  
  Provides detailed insights and performance metrics for your ad campaigns.
    `.trim(); // Removes leading and trailing whitespace

    return initialMessage;
  } else {
    const authUrl = getFacebookAuthUrl(user);

    const initialMessage = `
👋 **Welcome to ZuckerBot!**

I'm your AI-powered assistant dedicated to helping you create, analyze, and optimize your Meta (Facebook) ad campaigns effortlessly.

🔗 **Get Started by Connecting Your Facebook Ad Account**

To provide personalized insights and real-time recommendations, please connect your Facebook ad account via the Marketing API:

👉 **[Connect Your Facebook Ad Account Now](${authUrl})**

---

💡 **How to Interact with ZuckerBot**

You can use the following commands to manage your ad campaigns:

- **\`list my account ids\`**  
  Retrieves all your connected Facebook ad account IDs.

- **\`list my campaign ids\`**  
  Displays the IDs of all your ad campaigns within your connected ad accounts.

- **\`list my insights\`**  
  Provides detailed insights and performance metrics for your ad campaigns.
    `.trim(); // Removes leading and trailing whitespace

    return initialMessage;
  }
};
