// src/utils/tokens.ts
import jwt, { type SignOptions, type JwtPayload } from "jsonwebtoken";
import crypto from "crypto";
import bcrypt from "bcrypt";

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET as string;
if (!ACCESS_SECRET) throw new Error("Missing env JWT_ACCESS_SECRET");

const ACCESS_EXPIRES: SignOptions["expiresIn"] =
  (process.env.JWT_ACCESS_EXPIRES ?? "15m") as SignOptions["expiresIn"];

const REFRESH_BYTES = Number(process.env.REFRESH_TOKEN_BYTES ?? 48);
const BCRYPT_ROUNDS = Number(process.env.BCRYPT_ROUNDS ?? 10);

export type AccessPayload = {
  id: number;
  username: string;
  role: "creator" | "consumer";
};

export type VerifiedAccess = JwtPayload & AccessPayload;

export function signAccessToken(payload: AccessPayload): string {
  const opts: SignOptions = { expiresIn: ACCESS_EXPIRES, algorithm: "HS256" };
  return jwt.sign(payload, ACCESS_SECRET, opts);
}

export function verifyAccessToken(token: string): VerifiedAccess | null {
  try {
    return jwt.verify(token, ACCESS_SECRET) as VerifiedAccess;
  } catch (err) {
    // Gracefully handle JWT errors; rethrow unexpected ones
    if (
      err instanceof (jwt as any).JsonWebTokenError || // ESM-safe instanceof
      (err as { name?: string }).name === "JsonWebTokenError" ||
      (err as { name?: string }).name === "TokenExpiredError" ||
      (err as { name?: string }).name === "NotBeforeError"
    ) {
      return null;
    }
    throw err;
  }
}

export function createRefreshToken(): string {
  return crypto.randomBytes(REFRESH_BYTES).toString("base64url");
}

export async function hashRefreshToken(rt: string): Promise<string> {
  return bcrypt.hash(rt, BCRYPT_ROUNDS);
}

export async function compareRefreshToken(rt: string, hash: string): Promise<boolean> {
  return bcrypt.compare(rt, hash);
}
