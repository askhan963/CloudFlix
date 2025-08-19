import { pool } from '../db/mysql.js';
import type { RowDataPacket, ResultSetHeader } from 'mysql2';

export async function listComments(videoId: number) {
  const [rows] = await pool.execute<RowDataPacket[]>(
    `SELECT c.id, c.video_id, c.user_id, u.username, c.comment, c.created_at
     FROM comments c
     JOIN users u ON u.id = c.user_id
     WHERE c.video_id = ?
     ORDER BY c.id DESC
     LIMIT 200`,
    [videoId]
  );
  return rows;
}

export async function addComment(videoId: number, userId: number, comment: string) {
  const [res] = await pool.execute<ResultSetHeader>(
    `INSERT INTO comments (video_id, user_id, comment) VALUES (?, ?, ?)`,
    [videoId, userId, comment]
  );
  return Number(res.insertId);
}

export async function deleteComment(videoId: number, commentId: number, requesterId: number) {
  // Only author or video owner may delete
  const [ownerRows] = await pool.execute<RowDataPacket[]>(
    `SELECT v.uploader_id, c.user_id AS comment_user
     FROM comments c
     JOIN videos v ON v.id = c.video_id
     WHERE c.id=? AND c.video_id=?`,
    [commentId, videoId]
  );
  const row = ownerRows[0];
  if (!row) return { deleted: false, reason: 'NOT_FOUND' };

  if (row.uploader_id !== requesterId && row.comment_user !== requesterId) {
    return { deleted: false, reason: 'FORBIDDEN' };
  }

  await pool.execute(`DELETE FROM comments WHERE id=? AND video_id=?`, [commentId, videoId]);
  return { deleted: true };
}
