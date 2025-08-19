import { pool } from '../db/mysql.js';
import type { RowDataPacket } from 'mysql2';

export async function upsertRating(videoId: number, userId: number, rating: number) {
  await pool.execute(
    `INSERT INTO ratings (video_id, user_id, rating)
     VALUES (?, ?, ?)
     ON DUPLICATE KEY UPDATE rating = VALUES(rating)`,
    [videoId, userId, rating]
  );
  return { ok: true };
}

export async function getAverageRating(videoId: number) {
  const [rows] = await pool.execute<RowDataPacket[]>(
    `SELECT AVG(rating) AS avgRating, COUNT(*) AS count FROM ratings WHERE video_id=?`,
    [videoId]
  );
  const r = rows[0];
  return { average: r?.avgRating ? Number(r.avgRating).toFixed(2) : null, count: Number(r?.count || 0) };
}
