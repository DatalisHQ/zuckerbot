import { hash, verify } from "@node-rs/argon2";

// if you want your app to be compatible with edge runtime, use bcrypt-edge
// import { hashSync, verifySync } from "bcrypt-edge";

export async function hashPassword(password: string) {
  return await hash(password, {
    algorithm: 2,
  });
}

export async function verifyPassword(hashedPassword: string, password: string) {
  return verify(hashedPassword, password, {
    algorithm: 2,
  });
}
