import { pool } from '../db/mysql.js';
import { videosContainer } from '../storage/blob.js';
import { ResultSetHeader, RowDataPacket } from 'mysql2';
import { v4 as uuid } from 'uuid';

export type Visibility = 'public'|'unlisted'|'private';

export async function uploadVideoToBlob(uploaderId: number, fileName: string, contentType: string, buffer: Buffer) {
  const blobName = `${uploaderId}/${uuid()}-${fileName}`;
  const blockBlob = videosContainer.getBlockBlobClient(blobName);
  await blockBlob.uploadData(buffer, { blobHTTPHeaders: { blobContentType: contentType } });
  return { blobName, blobUrl: blockBlob.url, size: buffer.byteLength };
}

export async function createVideo({
  title, description, genre, producer, age_rating, visibility = 'public',
  uploader_id, blob_name, blob_url, size_bytes, duration_s
}: {
  title:string; description?:string; genre?:string; producer?:string; age_rating?:string; visibility?:Visibility;
  uploader_id:number; blob_name:string; blob_url:string; size_bytes?:number; duration_s?:number|null;
}) {
  const [res] = await pool.execute<ResultSetHeader>(
    `INSERT INTO videos (title, description, genre, producer, age_rating, visibility, duration_s, size_bytes, uploader_id, blob_name, blob_url)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [title, description || null, genre || null, producer || null, age_rating || null,
     visibility, duration_s ?? null, size_bytes ?? null, uploader_id, blob_name, blob_url]
  );
  return Number(res.insertId);
}

export async function getVideoByIdForViewer(id: number, viewerUserId?: number|null) {
  const [rows] = await pool.execute<RowDataPacket[]>(
    `SELECT * FROM videos WHERE id=? AND deleted_at IS NULL`,
    [id]
  );
  const v = rows[0];
  if (!v) return null;

  // visibility check
  if (v.visibility === 'private' && v.uploader_id !== viewerUserId) return null;
  return v;
}



export async function listVideosForViewer({
  q, genre, uploaderId, visibility, page = 1, limit = 20, viewerUserId
}: {
  q?: string; genre?: string; uploaderId?: number; visibility?: Visibility;
  page?: number; limit?: number; viewerUserId?: number | null;
}) {
  const where: string[] = ['deleted_at IS NULL'];
  const args: any[] = [];

  // Visibility defaults: public OR own
  if (!visibility) {
    where.push('(visibility = ? OR uploader_id = ?)');
    args.push('public', viewerUserId ?? -1);
  } else if (visibility === 'public') {
    where.push('visibility = ?'); args.push('public');
  } else if (visibility === 'unlisted') {
    where.push('visibility = ? AND uploader_id = ?'); args.push('unlisted', viewerUserId ?? -1);
  } else if (visibility === 'private') {
    where.push('visibility = ? AND uploader_id = ?'); args.push('private', viewerUserId ?? -1);
  }

  if (q && q.trim()) {
    const like = `%${q.trim()}%`;
    where.push('(title LIKE ? OR description LIKE ? OR genre LIKE ? OR producer LIKE ?)');
    args.push(like, like, like, like);
  }

  if (genre && genre.trim()) {
    where.push('genre = ?');
    args.push(genre.trim());
  }

  if (uploaderId) {
    where.push('uploader_id = ?');
    args.push(uploaderId);
  }

  const pageNum = Math.max(1, Number(page || 1));
  const limitNum = Math.min(50, Math.max(1, Number(limit || 20)));
  const offsetNum = (pageNum - 1) * limitNum;

  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

  // (Temporary) debug to console to see args alignment
  if (process.env.NODE_ENV !== 'production') {
    console.log('[videos.list] whereSql =', whereSql);
    console.log('[videos.list] args =', args);
    console.log('[videos.list] page/limit/offset =', pageNum, limitNum, offsetNum);
  }

  // 1) Count
  const [countRows] = await pool.query<RowDataPacket[]>(
    `SELECT COUNT(*) AS total FROM videos ${whereSql}`,
    args
  );
  const total = Number((countRows as any)[0]?.total || 0);

  // 2) Data (interpolate LIMIT/OFFSET as numbers to avoid ER_WRONG_ARGUMENTS)
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT id, title, description, genre, producer, age_rating, visibility,
            uploader_id, blob_url, created_at, updated_at
     FROM videos
     ${whereSql}
     ORDER BY created_at DESC
     LIMIT ${limitNum} OFFSET ${offsetNum}`,
    args
  );

  return {
    data: rows,
    page: pageNum,
    limit: limitNum,
    total,
    hasMore: offsetNum + (rows as any[]).length < total
  };
}




export async function updateVideoMetadata(id: number, ownerId: number, patch: Partial<{
  title: string; description: string|null; genre: string|null; producer: string|null; age_rating: string|null; visibility: Visibility
}>) {
  // verify ownership
  const [rows] = await pool.execute<RowDataPacket[]>('SELECT uploader_id FROM videos WHERE id=? AND deleted_at IS NULL', [id]);
  const v = rows[0];
  if (!v) return { updated: false, reason: 'NOT_FOUND' };
  if (v.uploader_id !== ownerId) return { updated: false, reason: 'FORBIDDEN' };

  const fields: string[] = [];
  const args: any[] = [];
  for (const [k, val] of Object.entries(patch)) {
    if (val === undefined) continue;
    fields.push(`${k} = ?`);
    args.push(val);
  }
  if (!fields.length) return { updated: true };
  args.push(id);

  await pool.execute(`UPDATE videos SET ${fields.join(', ')} WHERE id=?`, args);
  return { updated: true };
}

export async function softDeleteVideo(id: number, ownerId: number) {
  const [rows] = await pool.execute<RowDataPacket[]>('SELECT uploader_id FROM videos WHERE id=? AND deleted_at IS NULL', [id]);
  const v = rows[0];
  if (!v) return { deleted: false, reason: 'NOT_FOUND' };
  if (v.uploader_id !== ownerId) return { deleted: false, reason: 'FORBIDDEN' };
  await pool.execute('UPDATE videos SET deleted_at = NOW() WHERE id=?', [id]);
  return { deleted: true };
}
