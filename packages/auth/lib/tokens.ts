import { type RandomReader, generateRandomString } from "@oslojs/crypto/random";
import type { UserOneTimePasswordTypeType } from "database";
import { db } from "database";

const random: RandomReader = {
  read(bytes) {
    crypto.getRandomValues(bytes);
  },
};
const numberAlphabet = "0123456789";

export const generateVerificationToken = async ({
  userId,
  expireDuration = 1000 * 60 * 60 * 2,
}: {
  userId: string;
  expireDuration?: number;
}) => {
  const storedUserTokens = await db.userVerificationToken.findMany({
    where: {
      userId,
    },
  });

  if (storedUserTokens.length > 0) {
    const reusableStoredToken = storedUserTokens.find((token: any) => {
      return new Date(Number(token.expires) - expireDuration / 2) >= new Date();
    });
    if (reusableStoredToken) {
      return reusableStoredToken.id;
    }
  }

  const { id } = await db.userVerificationToken.create({
    data: {
      expires: new Date(new Date().getTime() + expireDuration),
      userId,
    },
  });

  return id;
};

export const validateVerificationToken = async ({
  token,
}: {
  token: string;
}) => {
  const storedToken = await db.userVerificationToken.findUnique({
    where: {
      id: token,
    },
  });

  if (!storedToken) {
    throw new Error("Invalid token");
  }

  await db.userVerificationToken.delete({
    where: {
      id: storedToken.id,
    },
  });

  if (storedToken.expires < new Date()) {
    throw new Error("Expired token");
  }

  return storedToken.userId;
};

export const generateOneTimePassword = async ({
  userId,
  type,
  identifier,
  expireDuration = 1000 * 60 * 60 * 2,
}: {
  userId: string;
  type: UserOneTimePasswordTypeType;
  identifier: string;
  expireDuration?: number;
}) => {
  const storedUserTokens = await db.userOneTimePassword.findMany({
    where: {
      userId,
    },
  });

  if (storedUserTokens.length > 0) {
    const reusableStoredToken = storedUserTokens.find((token: any) => {
      return new Date(Number(token.expires) - expireDuration) >= new Date();
    });
    if (reusableStoredToken) {
      return reusableStoredToken.code;
    }
  }

  const otp = generateRandomString(random, numberAlphabet, 6);

  await db.userOneTimePassword.create({
    data: {
      code: otp,
      type,
      identifier,
      expires: new Date(new Date().getTime() + expireDuration),
      userId,
    },
  });

  return otp;
};

export const validateOneTimePassword = async ({
  code,
  type,
  identifier,
}: {
  code: string;
  type: UserOneTimePasswordTypeType;
  identifier?: string;
}) => {
  const storedOtp = await db.userOneTimePassword.findFirst({
    where: {
      code,
      type,
      identifier,
    },
  });

  if (!storedOtp) {
    throw new Error("Invalid token");
  }

  await db.userOneTimePassword.delete({
    where: {
      id: storedOtp.id,
    },
  });

  if (storedOtp.expires < new Date()) {
    throw new Error("Expired token");
  }

  return storedOtp.userId;
};
