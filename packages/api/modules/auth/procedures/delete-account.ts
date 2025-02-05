import { TRPCError } from "@trpc/server";
import { createSessionCookie } from "auth";
import { db } from "database";
import { setCookie } from "h3";
import { z } from "zod";
import { protectedProcedure } from "../../trpc";

export const deleteAccount = protectedProcedure
  .input(z.void())
  .mutation(async ({ ctx: { event, user } }) => {
    try {
      await db.user.delete({
        where: {
          id: user.id,
        },
      });

      await db.team.deleteMany({
        where: {
          memberships: {
            every: {
              userId: user.id,
            },
          },
        },
      });

      const sessionCookie = createSessionCookie(null);

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
