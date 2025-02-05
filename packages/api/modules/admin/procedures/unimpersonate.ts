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
import { protectedProcedure } from "../../trpc";

// this procedure has to be "non-admin" because we are requesting it with a regular user session
export const unimpersonate = protectedProcedure
  .input(z.void())
  .output(z.void())
  .mutation(async ({ ctx: { session, event } }) => {
    try {
      const currentSession = await db.userSession.findUnique({
        where: {
          id: session.id,
        },
      });

      if (!currentSession || !currentSession.impersonatorId) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      await invalidateSession(session.id);

      const newSessionToken = await generateSessionToken();
      await createSession(newSessionToken, currentSession.impersonatorId);
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
