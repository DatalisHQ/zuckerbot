import { TeamMembershipSchema, TeamSchema, UserSchema, db } from "database";
import { z } from "zod";
import { publicProcedure } from "../../trpc";
import { getUserAvatarUrl } from "../lib/avatar-url";

export const user = publicProcedure
  .output(
    UserSchema.pick({
      id: true,
      email: true,
      role: true,
      avatarUrl: true,
      name: true,
      onboardingComplete: true,
    })
      .extend({
        teamMemberships: z
          .array(
            TeamMembershipSchema.extend({
              team: TeamSchema,
            }),
          )
          .nullable(),
        impersonatedBy: UserSchema.pick({
          id: true,
          name: true,
        }).nullish(),
        isPaidUser: z.boolean(), // Include the isPaidUser field
      })
      .nullable(),
  )
  .query(async ({ ctx: { user, teamMemberships, session } }) => {
    if (!user || !session) {
      return null;
    }

    const impersonatedBy = session?.impersonatorId
      ? await db.user.findUnique({
          where: {
            id: session.impersonatorId,
          },
          select: {
            id: true,
            name: true,
          },
        })
      : undefined;

    // Check if the user has a subscription
    const userSubscriptions = await db.subscription.findMany({
      where: {
        customerId: user.id,
        status: "ACTIVE",
      },
    });

    // Check if the user's team has a subscription
    let teamSubscriptions = [];
    if (teamMemberships) {
      teamSubscriptions = await db.subscription.findMany({
        where: {
          teamId: {
            in: teamMemberships.map((membership) => membership.team.id),
          },
          status: "ACTIVE",
        },
      });
    }

    const isPaidUser =
      userSubscriptions.length > 0 || teamSubscriptions.length > 0;

    return {
      ...user,
      avatarUrl: await getUserAvatarUrl(user.avatarUrl),
      impersonatedBy,
      teamMemberships,
      isPaidUser, // Return the isPaidUser status
    };
  });
