import { sign, verify, type SignOptions, type JwtPayload } from 'jsonwebtoken';
import crypto from 'crypto';
import bcrypt from 'bcrypt';

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET as string;
const ACCESS_EXPIRES: SignOptions['expiresIn'] =
  (process.env.JWT_ACCESS_EXPIRES ?? '15m') as SignOptions['expiresIn'];

const REFRESH_BYTES = Number(process.env.REFRESH_TOKEN_BYTES || 48);

export type AccessPayload = { id: number; username: string; role: 'creator' | 'consumer' };

export function signAccessToken(payload: AccessPayload) {
  // Explicit options typing avoids the callback overload
  const opts: SignOptions = { expiresIn: ACCESS_EXPIRES };
  return sign(payload, ACCESS_SECRET, opts);
}

export function verifyAccessToken(token: string) {
  // Merge your fields with JwtPayload to keep iat/exp typed
  return verify(token, ACCESS_SECRET) as JwtPayload & AccessPayload;
}

export function createRefreshToken() {
  return crypto.randomBytes(REFRESH_BYTES).toString('base64url');
}

export async function hashRefreshToken(rt: string) {
  return bcrypt.hash(rt, 10);
}

export async function compareRefreshToken(rt: string, hash: string) {
  return bcrypt.compare(rt, hash);
}
