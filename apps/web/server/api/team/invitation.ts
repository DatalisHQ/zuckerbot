import { createApiCaller } from "api";
import { withLeadingSlash } from "ufo";

const createResponse = (redirectPath: string) => {
  return {
    redirectPath: withLeadingSlash(redirectPath),
  };
};

export default defineEventHandler(async (event) => {
  const requestUrl = getRequestURL(event);
  const code = requestUrl.searchParams.get("code") || null;

  try {
    if (!code) {
      throw new Error("No invitation code query param provided");
    }

    const apiCaller = await createApiCaller(event);

    const invitation = await apiCaller.team.invitationById({
      id: code,
    });
    if (!invitation) {
      throw new Error("Invitation not found");
    }

    const user = await apiCaller.auth.user();
    if (!user) {
      return createResponse(
        `/auth/login?invitationCode=${invitation.id}&email=${invitation.email}`,
      );
    }

    const team = await apiCaller.team.acceptInvitation({
      id: code,
    });
    if (!team) {
      throw new Error("Team not found");
    }

    return createResponse("/app/dashboard");
  } catch (e) {
    console.error(e);
    return createResponse("/");
  }
});
