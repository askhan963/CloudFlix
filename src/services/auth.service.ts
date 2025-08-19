import { pool } from '../db/mysql.js';
import { RowDataPacket } from 'mysql2';
import { hashPassword, verifyPassword } from '../utils/password.js';
import { signAccessToken, createRefreshToken } from '../utils/tokens.js';
import { createSession, findSessionByToken, revokeSession } from './sessions.service.js';

type PublicUser = { id: number; username: string; role: 'creator'|'consumer' };

export async function signup(username: string, password: string, role: 'creator'|'consumer', email?: string) {
  username = username.toLowerCase();
  const pwHash = await hashPassword(password);
  await pool.execute(
    'INSERT INTO users (username, email, password_hash, role) VALUES (?, ?, ?, ?)',
    [username, email || null, pwHash, role]
  );
  return login(username, password);
}

export async function login(usernameOrEmail: string, password: string, ua?: string, ip?: string) {
  const q = usernameOrEmail.toLowerCase();
  const [rows] = await pool.execute<RowDataPacket[]>(
    'SELECT id, username, role, password_hash FROM users WHERE username=? OR email=? LIMIT 1',
    [q, q]
  );
  const user = rows[0];
  if (!user) throw new Error('Invalid credentials');

  const ok = await verifyPassword(password, user.password_hash);
  if (!ok) throw new Error('Invalid credentials');

  const publicUser: PublicUser = { id: user.id, username: user.username, role: user.role };
  const accessToken = signAccessToken(publicUser);
  const refreshToken = createRefreshToken();
  const sessionId = await createSession(user.id, refreshToken, ua, ip);

  return { user: publicUser, accessToken, refreshToken, sessionId };
}

export async function refresh(userId: number, refreshToken: string, ua?: string, ip?: string) {
  const session = await findSessionByToken(userId, refreshToken);
  if (!session) throw new Error('Invalid refresh');

  // rotate old session
  await revokeSession(session.id);

  // fetch user again to sign
  const [rows] = await pool.execute<RowDataPacket[]>(
    'SELECT id, username, role FROM users WHERE id=? LIMIT 1',
    [userId]
  );
  const u = rows[0];
  if (!u) throw new Error('User not found');

  const publicUser: PublicUser = { id: u.id, username: u.username, role: u.role };
  const accessToken = signAccessToken(publicUser);

  const newRefresh = createRefreshToken();
  const newSessionId = await createSession(u.id, newRefresh, ua, ip);

  return { user: publicUser, accessToken, refreshToken: newRefresh, sessionId: newSessionId };
}

export async function logout(userId: number, refreshToken: string) {
  const session = await findSessionByToken(userId, refreshToken);
  if (session) await revokeSession(session.id);
  return { ok: true };
}
