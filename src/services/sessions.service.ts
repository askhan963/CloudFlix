import { pool } from '../db/mysql.js';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { hashRefreshToken, compareRefreshToken } from '../utils/tokens.js';
import { addDays } from '../utils/time.js';

const RT_DAYS = Number(process.env.REFRESH_TOKEN_EXPIRES_DAYS || 30);

export async function createSession(userId: number, refreshTokenPlain: string, userAgent?: string, ip?: string) {
  const refresh_token_hash = await hashRefreshToken(refreshTokenPlain);
  const expires_at = addDays(new Date(), RT_DAYS);
  const [res] = await pool.execute<ResultSetHeader>(
    `INSERT INTO user_sessions (user_id, refresh_token_hash, user_agent, ip, expires_at)
     VALUES (?, ?, ?, ?, ?)`,
    [userId, refresh_token_hash, userAgent || null, ip || null, expires_at]
  );
  return res.insertId;
}

export async function findSessionByToken(userId: number, refreshTokenPlain: string) {
  const [rows] = await pool.execute<RowDataPacket[]>(
    `SELECT * FROM user_sessions WHERE user_id=? AND revoked_at IS NULL AND expires_at > NOW() ORDER BY id DESC`,
    [userId]
  );
  for (const row of rows) {
    if (await compareRefreshToken(refreshTokenPlain, row.refresh_token_hash)) {
      return row;
    }
  }
  return null;
}

export async function revokeSession(id: number) {
  await pool.execute(`UPDATE user_sessions SET revoked_at = NOW() WHERE id=? AND revoked_at IS NULL`, [id]);
}

export async function revokeAllForUser(userId: number) {
  await pool.execute(`UPDATE user_sessions SET revoked_at = NOW() WHERE user_id=? AND revoked_at IS NULL`, [userId]);
}
