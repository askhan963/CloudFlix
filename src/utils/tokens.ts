import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import bcrypt from 'bcrypt';

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET!;
const ACCESS_EXPIRES = process.env.JWT_ACCESS_EXPIRES || '15m';
const REFRESH_BYTES = Number(process.env.REFRESH_TOKEN_BYTES || 48);

export function signAccessToken(payload: { id: number; username: string; role: 'creator'|'consumer' }) {
  return jwt.sign(payload, ACCESS_SECRET, { expiresIn: ACCESS_EXPIRES });
}

export function verifyAccessToken(token: string) {
  return jwt.verify(token, ACCESS_SECRET) as { id: number; username: string; role: 'creator'|'consumer'; iat: number; exp: number };
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
