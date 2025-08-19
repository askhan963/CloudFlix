import { pool } from '../db/mysql.js';
import { RowDataPacket } from 'mysql2';
import { hashPassword, verifyPassword } from '../utils/password.js';
import { signAccessToken, createRefreshToken } from '../utils/tokens.js';
import { createSession, findSessionByToken, revokeSession } from './sessions.service.js';

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
    'SELECT * FROM users WHERE username=? OR email=? LIMIT 1',
    [q, q]
  );
  const user = rows[0];
  if (!user) throw new Error('Invalid credentials');

  const ok = await verifyPassword(password, user.password_hash);
  if (!ok) throw new Error('Invalid credentials');

  const accessToken = signAccessToken({ id: user.id, username: user.username, role: user.role });
  const refreshToken = createRefreshToken();
  const sessionId = await createSession(user.id, refreshToken, ua, ip);

  return {
    user: { id: user.id, username: user.username, role: user.role },
    accessToken,
    refreshToken,
    sessionId
  };
}

export async function refresh(userId: number, refreshToken: string, ua?: string, ip?: string) {
  const session = await findSessionByToken(userId, refreshToken);
  if (!session) throw new Error('Invalid refresh');

  // rotate: revoke old + issue new
  await revokeSession(session.id);
  const accessToken = signAccessToken({ id: userId, username: session.username ?? '', role: session.role ?? 'consumer' } as any);
  const newRefresh = createRefreshToken();
  const newSessionId = await createSession(userId, newRefresh, ua, ip);
  return { accessToken, refreshToken: newRefresh, sessionId: newSessionId };
}
export async function logout(userId: number, refreshToken: string) {
  const session = await findSessionByToken(userId, refreshToken);
  if (session) await revokeSession(session.id);
  return { ok: true };
}
