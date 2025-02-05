import { GitHub, generateState } from "arctic";
import {
  createOauthCallbackHandler,
  createOauthRedirectHandler,
} from "../lib/oauth";

export const githubAuth = new GitHub(
  process.env.GITHUB_CLIENT_ID as string,
  process.env.GITHUB_CLIENT_SECRET as string,
  null,
);

const GITHUB_PROIVDER_ID = "github";

type GitHubUser = {
  id: number;
  email: string;
  name: string;
  login: string;
  avatar_url: string;
};

type GithubUserEmails = {
  email: string;
  primary?: boolean;
  verified?: boolean;
}[];

export const githubRouteHandler = createOauthRedirectHandler(
  GITHUB_PROIVDER_ID,
  () => {
    const state = generateState();
    const url = githubAuth.createAuthorizationURL(state, ["user:email"]);

    return {
      state,
      url,
    };
  },
);

export const githubCallbackRouteHandler = createOauthCallbackHandler(
  GITHUB_PROIVDER_ID,
  async (code) => {
    const tokens = await githubAuth.validateAuthorizationCode(code);
    const githubUserResponse = await fetch("https://api.github.com/user", {
      headers: {
        Authorization: `Bearer ${tokens.accessToken()}`,
      },
    });
    const emailsResponse = await fetch("https://api.github.com/user/emails", {
      headers: {
        Authorization: `Bearer ${tokens.accessToken()}`,
      },
    });

    const githubUser = (await githubUserResponse.json()) as GitHubUser;
    const emails = (await emailsResponse.json()) as GithubUserEmails;

    githubUser.email = (
      githubUser.email ??
      emails.find((email) => email.primary)?.email ??
      ""
    ).toLowerCase();

    return {
      id: String(githubUser.id),
      email: githubUser.email,
      name: githubUser.name,
      avatar: githubUser.avatar_url,
    };
  },
);
