import { TRPCError } from "@trpc/server";
import {
  createSession,
  createSessionCookie,
  generateSessionToken,
  invalidateSession,
} from "auth";
import { db } from "database";
import { setCookie } from "h3";
import { z } from "zod";
import { adminProcedure } from "../../trpc";

export const impersonate = adminProcedure
  .input(
    z.object({
      userId: z.string(),
    }),
  )
  .output(z.void())
  .mutation(async ({ input: { userId }, ctx: { user, session, event } }) => {
    // check if user with id exists
    const userExists = await db.user.findUnique({
      where: {
        id: userId,
      },
    });

    if (!userExists) {
      throw new TRPCError({ code: "NOT_FOUND" });
    }

    try {
      const newSessionToken = generateSessionToken();

      await createSession(newSessionToken, userId, {
        impersonatorId: user.id,
      });

      await invalidateSession(session.id);

      const sessionCookie = createSessionCookie(newSessionToken);

      if (event) {
        setCookie(
          event,
          sessionCookie.name,
          sessionCookie.value,
          sessionCookie.attributes,
        );
      }
    } catch (e) {
      console.error(e);

      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
      });
    }
  });
