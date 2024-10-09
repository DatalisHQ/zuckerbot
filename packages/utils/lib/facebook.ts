export const getFacebookAuthUrl = (user: any) => {
  const clientId = "1119807469249263";
  const redirectUri = "https://zuckerbot.ai/auth/facebook/callback";
  const state = encodeURIComponent(JSON.stringify({ userId: user.id }));

  const authUrl = `https://www.facebook.com/v20.0/dialog/oauth?client_id=${clientId}&redirect_uri=${redirectUri}&state=${state}&scope=ads_management&response_type=token`;
  return authUrl;
};

export const isFacebookAuth = (user: any) => {
  const token = user?.facebookAccessToken;
  const tokenExpiresAt = user?.facebookTokenExpiresAt;

  const isAuth = token && new Date() < new Date(tokenExpiresAt);
  return isAuth;
};

export const authUser = (currentUser: any, tool: any) => {
  const authUrl = getFacebookAuthUrl(currentUser);

  return {
    tool_call_id: tool.id,
    output: `Access token is missing or expired. Please authorize the app by visiting: ${authUrl}`,
  };
};

export const fetchAdAccounts = async (token: string) => {
  const response = await fetch(
    `https://graph.facebook.com/v20.0/me/adaccounts?access_token=${token}`,
  );
  const data = await response.json();
  return data.data.map((account: any) => account.id); // Return an array of ad account IDs
};

export const fetchCampaigns = async (adAccountId: string, token: string) => {
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
  return data.data.map((campaign: any) => campaign.id);
};

export const listAccounts = async (
  token: string,
  sessionId: string,
  tool: any,
  db: any,
) => {
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
};

export const listCampaigns = async (
  token: string,
  sessionId: string,
  tool: any,
  db: any,
) => {
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
};

export const fetchFacebookInsights = async (token: string, tool: any) => {
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
  } catch (error: any) {
    return {
      tool_call_id: tool.id,
      output: `Error fetching insights: ${error.message}`,
    };
  }
};
