import { config } from "@config";
import { sha256 } from "@oslojs/crypto/sha2";
import {
  encodeBase32LowerCaseNoPadding,
  encodeHexLowerCase,
} from "@oslojs/encoding";
import { type UserSession, db } from "database";

export function generateSessionToken(): string {
  const bytes = new Uint8Array(20);
  crypto.getRandomValues(bytes);
  const token = encodeBase32LowerCaseNoPadding(bytes);
  return token;
}

export async function createSession(
  token: string,
  userId: string,
  options?: {
    maxAge?: number;
    impersonatorId?: string | null;
  },
): Promise<UserSession> {
  const sessionId = encodeHexLowerCase(sha256(new TextEncoder().encode(token)));
  const maxAge = options?.maxAge ?? config.auth.sessionCookieMaxAge;
  const impersonatorId = options?.impersonatorId ?? null;

  const session: UserSession = {
    id: sessionId,
    userId,
    expiresAt: new Date(Date.now() + maxAge * 1000),
    impersonatorId,
  };

  await db.userSession.create({
    data: session,
  });

  return session;
}

export async function validateSessionToken(token: string): Promise<any> {
  const sessionId = encodeHexLowerCase(sha256(new TextEncoder().encode(token)));
  const result = await db.userSession.findUnique({
    where: {
      id: sessionId,
    },
    include: {
      user: {
        select: {
          id: true,
          avatarUrl: true,
          email: true,
          emailVerified: true,
          name: true,
          onboardingComplete: true,
          role: true,
          facebookAccessToken: true,
          facebookTokenExpiresAt: true,
        },
      },
    },
  });
  if (result === null) {
    return { session: null, user: null };
  }
  const { user, ...session } = result;
  if (Date.now() >= session.expiresAt.getTime()) {
    await db.userSession.delete({ where: { id: sessionId } });
    return { session: null, user: null };
  }
  if (Date.now() >= session.expiresAt.getTime() - 1000 * 60 * 60 * 24 * 15) {
    session.expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30);
    await db.userSession.update({
      where: {
        id: session.id,
      },
      data: {
        expiresAt: session.expiresAt,
      },
    });
  }
  return { session, user };
}

export async function invalidateSession(sessionId: string): Promise<void> {
  await db.userSession.delete({ where: { id: sessionId } });
}

export async function invalidateUserSessions(userId: string): Promise<void> {
  await db.userSession.deleteMany({ where: { userId } });
}

export type SessionUser = NonNullable<
  Awaited<ReturnType<typeof validateSessionToken>>["user"]
>;
