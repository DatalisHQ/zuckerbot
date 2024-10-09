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
