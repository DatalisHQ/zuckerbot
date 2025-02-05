import { Google, generateCodeVerifier, generateState } from "arctic";
import { getBaseUrl } from "utils";
import {
  createOauthCallbackHandler,
  createOauthRedirectHandler,
} from "../lib/oauth";

export const googleAuth = new Google(
  process.env.GOOGLE_CLIENT_ID as string,
  process.env.GOOGLE_CLIENT_SECRET as string,
  new URL("/api/oauth/google/callback", getBaseUrl()).toString(),
);

const GOOGLE_PROIVDER_ID = "google";

type GoogleUser = {
  sub: string;
  email: string;
  email_verified?: boolean;
  picture?: string;
  name: string;
};

export const googleRouteHandler = createOauthRedirectHandler(
  GOOGLE_PROIVDER_ID,
  () => {
    const state = generateState();
    const codeVerifier = generateCodeVerifier();
    const url = googleAuth.createAuthorizationURL(state, codeVerifier, [
      "profile",
      "email",
    ]);

    return {
      state,
      url,
      codeVerifier,
    };
  },
);

export const googleCallbackRouteHandler = createOauthCallbackHandler(
  GOOGLE_PROIVDER_ID,
  async (code, verifier) => {
    const tokens = await googleAuth.validateAuthorizationCode(
      code,
      verifier as string,
    );
    const googleUserResponse = await fetch(
      "https://openidconnect.googleapis.com/v1/userinfo",
      {
        headers: {
          Authorization: `Bearer ${tokens.accessToken()}`,
        },
      },
    );
    const googleUser = (await googleUserResponse.json()) as GoogleUser;

    return {
      id: googleUser.sub,
      email: googleUser.email,
      name: googleUser.name,
      avatar: googleUser.picture,
    };
  },
);
