import { db } from "database";
import { z } from "zod";
import { protectedProcedure } from "../../trpc";

export const create = protectedProcedure
  .input(
    z.object({
      name: z.string(),
    }),
  )
  .mutation(async ({ input: { name }, ctx: { user } }) => {
    const session = await db.chatSession.create({
      data: {
        name,
        user: { connect: { id: user.id } },
      },
      select: {
        id: true,
        name: true,
        createdAt: true,
      }
    });

    return session;
  });
