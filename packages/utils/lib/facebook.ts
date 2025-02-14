// src/utils/facebook.ts
export const getFacebookAuthUrl = (user: any) => {
  const clientId = "1119807469249263";
  const redirectUri = "https://zuckerbot.ai/auth/facebook/callback";
  const state = encodeURIComponent(JSON.stringify({ userId: user.id }));
  const scope = "pages_show_list,ads_management,ads_read";
  // business_management

  const authUrl = `https://www.facebook.com/v22.0/dialog/oauth?client_id=${clientId}&redirect_uri=${redirectUri}&state=${state}&scope=${scope}&response_type=token&config_id=1611077456348594`;
  return authUrl;
};

export const isFacebookAuth = (user: any) => {
  const token = user?.facebookAccessToken;
  const tokenExpiresAt = user?.facebookTokenExpiresAt;

  const isAuth = token && new Date() < new Date(tokenExpiresAt);
  return isAuth;
};

export const fetchAdAccounts = async (token: string) => {
  const response = await fetch(
    `https://graph.facebook.com/v22.0/me/adaccounts?fields=id,name,account_status,currency&access_token=${token}`,
  );
  const data = await response.json();
  return data.data.map((account: any) => ({
    id: account.id,
    name: account.name || "Unnamed Account",
    status: account.account_status,
    currency: account.currency,
  }));
};

export const fetchCampaigns = async (adAccountId: string, token: string) => {
  if (adAccountId.startsWith("act_")) {
    adAccountId = adAccountId.split("act_")[1];
  }

  const response = await fetch(
    `https://graph.facebook.com/v22.0/act_${adAccountId}/campaigns?fields=id,name,status,objective&access_token=${token}`,
  );

  const data = await response.json();
  if (data.error) {
    throw new Error(data.error || "Failed to fetch campaigns");
  }
  return data.data.map((campaign: any) => ({
    id: campaign.id,
    name: campaign.name || "Unnamed Campaign",
    status: campaign.status,
    objective: campaign.objective,
  }));
};

export const listAccounts = async (
  token: string,
  sessionId: string,
  tool: any,
  apiCaller: any,
) => {
  const adAccounts = await fetchAdAccounts(token);

  if (adAccounts.length > 1) {
    const accountsList = adAccounts.map((acc: any) => acc.name).join(", ");

    return {
      tool_call_id: tool.id,
      output: `Please select one of the following accounts:\n\n${accountsList}\n\nAvailable accounts data: ${JSON.stringify(
        adAccounts,
      )}\n\nWhich account would you like to use?`,
    };
  } else if (adAccounts.length === 1) {
    const account = adAccounts[0];
    await apiCaller.chat.update({
      id: sessionId,
      data: {
        adAccountId: account.id,
      },
    });

    return {
      tool_call_id: tool.id,
      output: `Only one account found: "${
        account.name
      }". This account has been selected. Account data: ${JSON.stringify(
        account,
      )}`,
    };
  } else {
    return {
      tool_call_id: tool.id,
      output: `No ad accounts found.`,
    };
  }
};

export const listCampaigns = async (
  token: string,
  sessionId: string,
  tool: any,
  apiCaller: any,
) => {
  const args = JSON.parse(tool.function.arguments);
  const adAccountId = args.ad_account_id;

  const campaigns = await fetchCampaigns(adAccountId, token);

  if (campaigns.length > 1) {
    const campaignsList = campaigns.map((camp: any) => camp.name).join(", ");

    return {
      tool_call_id: tool.id,
      output: `Available campaigns:\n${campaignsList}\n\nCampaigns data: ${JSON.stringify(
        campaigns,
      )}\n\nWhich campaign would you like to use?`,
    };
  } else if (campaigns.length === 1) {
    const campaign = campaigns[0];
    await apiCaller.chat.update({
      id: sessionId,
      data: {
        campaignId: campaign.id,
      },
    });

    return {
      tool_call_id: tool.id,
      output: `Only one campaign found: "${
        campaign.name
      }". This campaign has been selected. Campaign data: ${JSON.stringify(
        campaign,
      )}`,
    };
  } else {
    return {
      tool_call_id: tool.id,
      output: `No campaigns found for Ad Account ${adAccountId}.`,
    };
  }
};

export const fetchFacebookInsights = async (token: string, tool: any) => {
  const args = JSON.parse(tool.function.arguments);
  const campaignId = args.campaign_id;

  const insightsUrl = `https://graph.facebook.com/v22.0/${campaignId}/insights?fields=impressions,clicks,spend,cost_per_unique_click,cost_per_outbound_click,campaign_name,account_id,account_currency,conversion_rate_ranking,engagement_rate_ranking,cost_per_action_type,cost_per_inline_link_click,cost_per_inline_post_engagement,cost_per_unique_action_type,cost_per_unique_inline_link_click,cost_per_unique_outbound_click&date_preset=${args.date_preset}&access_token=${token}`;

  try {
    const response = await fetch(insightsUrl, {
      method: "GET",
    });
    const data = await response.json();

    if (data.error || !data.data || data.data.length === 0) {
      return {
        tool_call_id: tool.id,
        output: `No insights data available for this campaign. Please try another date range. Possible values: today, yesterday, this_month, last_month, this_quarter, maximum, data_maximum, last_3d, last_7d, last_14d, last_28d, last_30d, last_90d, last_week_mon_sun, last_week_sun_sat, last_quarter, last_year, this_week_mon_today, this_week_sun_today, this_year.`,
      };
    }

    const insights = data.data![0];

    return {
      tool_call_id: tool.id,
      output: `
      You are ZuckerBot, an AI assistant for managing Meta (Facebook) ad campaigns.
      Based on the following campaign performance metrics, analyze whether the campaign is performing well or underperforming. Provide insights and recommendations.
      insights: ${JSON.stringify(insights)}
      Please provide your analysis and recommendations based on these metrics.
      Ask the user if they would like to create a new campaign, you will need to generate the ad creative and copy for the new campaign, if you don't have enough information, ask the use to provide more details.
      `,
    };
  } catch (error: any) {
    return {
      tool_call_id: tool.id,
      output: `Error fetching insights: ${error.message}`,
    };
  }
};

export const createCampaign = async (
  token: string,
  sessionId: string,
  tool: any,
  apiCaller: any,
) => {
  const args = JSON.parse(tool.function.arguments);
  let adAccountId = args.ad_account_id;

  if (!adAccountId) {
    return {
      tool_call_id: tool.id,
      output:
        "Please select an ad account first. Then try creating the campaign again.",
    };
  }

  if (adAccountId.startsWith("act_")) {
    adAccountId = adAccountId.split("act_")[1];
  }

  const campaignUrl = `https://graph.facebook.com/v22.0/act_${adAccountId}/campaigns`;

  try {
    const response = await fetch(campaignUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: args.name,
        objective: args.objective,
        status: args.status,
        start_time: args.start_time,
        end_time: args.end_time,
        special_ad_categories: [],
        access_token: token,
      }),
    });

    const data = await response.json();

    if (data.error) {
      return {
        tool_call_id: tool.id,
        output: `Failed to create campaign: ${JSON.stringify(
          data.error,
          null,
          2,
        )}`,
      };
    }

    apiCaller.chat.update({
      id: sessionId,
      data: {
        campaignId: data.id,
      },
    });

    return {
      tool_call_id: tool.id,
      output: `Campaign created successfully with ID: ${data.id}`,
    };
  } catch (error: any) {
    return {
      tool_call_id: tool.id,
      output: `Error creating campaign: ${JSON.stringify(error, null, 2)}`,
    };
  }
};

export const createAdSet = async (
  token: string,
  sessionId: string,
  tool: any,
  apiCaller: any,
) => {
  const args = JSON.parse(tool.function.arguments);
  let adAccountId = args.ad_account_id;
  const campaignId = args.campaign_id;

  if (!adAccountId) {
    return {
      tool_call_id: tool.id,
      output:
        "Please select an ad account first. Then try creating the campaign again.",
    };
  }

  if (!campaignId) {
    return {
      tool_call_id: tool.id,
      output:
        "Please create a campaign first. Then try creating the ad set again.",
    };
  }

  if (adAccountId.startsWith("act_")) {
    adAccountId = adAccountId.split("act_")[1];
  }

  const adSetUrl = `https://graph.facebook.com/v22.0/act_${adAccountId}/adsets`;

  const body: any = {
    campaign_id: args.campaign_id,
    name: args.name,
    optimization_goal: args.optimization_goal,
    billing_event: args.billing_event,
    bid_strategy: "LOWEST_COST_WITHOUT_CAP", // Always use this strategy
    daily_budget: args.daily_budget,
    targeting: {
      age_min: args.age_min,
      age_max: args.age_max,
      genders: args.genders,
      geo_locations: {
        countries: args.countries,
      },
    },
    status: "ACTIVE",
    access_token: token,
    start_time: args.start_time,
    end_time: args.end_time,
  };

  try {
    const response = await fetch(adSetUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (data.error) {
      return {
        tool_call_id: tool.id,
        output: `Failed to create ad set: ${JSON.stringify(
          data.error,
          null,
          2,
        )}`,
      };
    }

    return {
      tool_call_id: tool.id,
      output: `Ad set created successfully with ID: ${data.id}`,
    };
  } catch (error: any) {
    return {
      tool_call_id: tool.id,
      output: `Error creating ad set: ${JSON.stringify(error, null, 2)}`,
    };
  }
};

export const createAdCreative = async (
  token: string,
  sessionId: string,
  tool: any,
  apiCaller: any,
) => {
  const args = JSON.parse(tool.function.arguments);
  let adAccountId = args.ad_account_id;

  if (!adAccountId) {
    return {
      tool_call_id: tool.id,
      output:
        "Please select an ad account first. Then try creating the campaign again.",
    };
  }

  if (adAccountId.startsWith("act_")) {
    adAccountId = adAccountId.split("act_")[1];
  }

  const creativeUrl = `https://graph.facebook.com/v22.0/act_${adAccountId}/adcreatives`;

  try {
    const response = await fetch(creativeUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: args.name,
        object_story_spec: {
          page_id: args.page_id,
          link_data: {
            message: args.message,
            link: args.link,
            picture: args.picture,
            call_to_action: {
              type: args.call_to_action_type,
            },
          },
        },
        access_token: token,
      }),
    });

    const data = await response.json();

    if (data.error) {
      return {
        tool_call_id: tool.id,
        output: `Failed to create ad creative: ${JSON.stringify(
          data.error,
          null,
          2,
        )}`,
      };
    }

    await apiCaller.chat.update({
      id: sessionId,
      data: {
        creativeId: data.id,
      },
    });

    return {
      tool_call_id: tool.id,
      output: `Ad creative created successfully with ID: ${data.id}`,
    };
  } catch (error: any) {
    return {
      tool_call_id: tool.id,
      output: `Error creating ad creative: ${JSON.stringify(error, null, 2)}`,
    };
  }
};

export const createAd = async (
  token: string,
  sessionId: string,
  tool: any,
  apiCaller: any,
) => {
  const args = JSON.parse(tool.function.arguments);
  let adAccountId = args.ad_account_id;
  const adsetId = args.adset_id;
  const creativeId = args.creative_id;

  if (!adAccountId) {
    return {
      tool_call_id: tool.id,
      output:
        "Please select an ad account first. Then try creating the campaign again.",
    };
  }

  if (!adsetId) {
    return {
      tool_call_id: tool.id,
      output: "Please create an ad set first. Then try creating the ad again.",
    };
  }

  if (!creativeId) {
    return {
      tool_call_id: tool.id,
      output:
        "Please create an ad creative first. Then try creating the ad again.",
    };
  }

  if (adAccountId.startsWith("act_")) {
    adAccountId = adAccountId.split("act_")[1];
  }

  const adUrl = `https://graph.facebook.com/v22.0/act_${adAccountId}/ads`;

  try {
    const response = await fetch(adUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: args.name,
        adset_id: adsetId,
        creative: {
          creative_id: creativeId,
        },
        status: "ACTIVE",
        access_token: token,
      }),
    });

    const data = await response.json();

    if (data.error) {
      return {
        tool_call_id: tool.id,
        output: `Failed to create ad: ${JSON.stringify(data.error, null, 2)}`,
      };
    }

    await apiCaller.chat.update({
      id: sessionId,
      data: {
        adId: data.id,
      },
    });

    return {
      tool_call_id: tool.id,
      output: `Ad created successfully with ID: ${data.id}`,
    };
  } catch (error: any) {
    return {
      tool_call_id: tool.id,
      output: `Error creating ad: ${JSON.stringify(error, null, 2)}`,
    };
  }
};

export const fetchPages = async (token: string) => {
  const response = await fetch(
    `https://graph.facebook.com/v22.0/me/accounts?fields=id,name&access_token=${token}`,
  );

  const data = await response.json();

  if (data.error) {
    throw new Error(data.error || "Failed to fetch pages");
  }

  return data.data;
};

export const listPages = async (
  token: string,
  sessionId: string,
  tool: any,
  apiCaller: any,
) => {
  try {
    const pages = await fetchPages(token);

    return {
      tool_call_id: tool.id,
      output: `Available Facebook Pages:\n${pages
        .map((p) => `• ${p.name}`)
        .join("\n")}\n\nPages data: ${JSON.stringify(
        pages,
      )}\n\nPlease select a page to use for the ad creative.`,
    };
  } catch (error: any) {
    return {
      tool_call_id: tool.id,
      output: `Error fetching pages: ${JSON.stringify(error)}`,
    };
  }
};

export const fetchBusinesses = async (token: string) => {
  const response = await fetch(
    `https://graph.facebook.com/v22.0/me/businesses?fields=id,name&access_token=${token}`,
  );
  const data = await response.json();

  if (data.error) {
    throw new Error(JSON.stringify(data.error, null, 2));
  }

  return data.data || [];
};

export const listBusinesses = async (token: string, tool: any) => {
  try {
    const businesses = await fetchBusinesses(token);

    if (businesses.length === 0) {
      return {
        tool_call_id: tool.id,
        output:
          "You need to be an administrator of a business or create your own business at https://business.facebook.com/ before creating an ad account.",
      };
    }

    if (businesses.length === 1) {
      return {
        tool_call_id: tool.id,
        output: `Found business: "${businesses[0].name}" (${businesses[0].id}). We can use this to create your ad account.`,
      };
    }

    return {
      tool_call_id: tool.id,
      output: `Please select which business you'd like to use:\n${businesses
        .map((b) => `• ${b.name} (ID: ${b.id})`)
        .join("\n")}\n\nBusiness data: ${JSON.stringify(businesses)}`,
    };
  } catch (error) {
    return {
      tool_call_id: tool.id,
      output: `Error fetching businesses: ${JSON.stringify(error, null, 2)}`,
    };
  }
};

export const createAdAccount = async (token: string, tool: any) => {
  const args = JSON.parse(tool.function.arguments);

  try {
    const response = await fetch(
      `https://graph.facebook.com/v22.0/${args.business_id}/adaccount`,
      {
        method: "POST",
        body: JSON.stringify({
          name: args.name,
          currency: args.currency,
          timezone_id: args.timezone_id,
          partner: "NONE",
          access_token: token,
        }),
      },
    );

    const data = await response.json();

    if (data.error) {
      return {
        tool_call_id: tool.id,
        output: `Failed to create ad account: ${JSON.stringify(
          data.error,
          null,
          2,
        )}`,
      };
    }

    return {
      tool_call_id: tool.id,
      output: `Successfully created ad account with ID: ${data.id}`,
    };
  } catch (error) {
    return {
      tool_call_id: tool.id,
      output: `Error creating ad account: ${JSON.stringify(error, null, 2)}`,
    };
  }
};
