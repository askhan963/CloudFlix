import { pool } from "../db/mysql.js";
import { videosContainer } from "../storage/blob.js";
import { ResultSetHeader, RowDataPacket } from "mysql2";
import { v4 as uuid } from "uuid";

export type Visibility = "public" | "unlisted" | "private";

export async function uploadVideoToBlob(
  uploaderId: number,
  fileName: string,
  contentType: string,
  buffer: Buffer
) {
  const blobName = `${uploaderId}/${uuid()}-${fileName}`;
  const blockBlob = videosContainer.getBlockBlobClient(blobName);
  // await blockBlob.uploadData(buffer, { blobHTTPHeaders: { blobContentType: contentType } });
  await blockBlob.uploadData(buffer, {
    blobHTTPHeaders: {
      blobContentType: contentType,
      blobCacheControl: "public, max-age=86400",
    },
  });
  return { blobName, blobUrl: blockBlob.url, size: buffer.byteLength };
}

export async function createVideo({
  title,
  description,
  genre,
  producer,
  age_rating,
  visibility = "public",
  uploader_id,
  blob_name,
  blob_url,
  size_bytes,
  duration_s,
}: {
  title: string;
  description?: string;
  genre?: string;
  producer?: string;
  age_rating?: string;
  visibility?: Visibility;
  uploader_id: number;
  blob_name: string;
  blob_url: string;
  size_bytes?: number;
  duration_s?: number | null;
}) {
  const [res] = await pool.execute<ResultSetHeader>(
    `INSERT INTO videos (title, description, genre, producer, age_rating, visibility, duration_s, size_bytes, uploader_id, blob_name, blob_url)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      title,
      description || null,
      genre || null,
      producer || null,
      age_rating || null,
      visibility,
      duration_s ?? null,
      size_bytes ?? null,
      uploader_id,
      blob_name,
      blob_url,
    ]
  );
  return Number(res.insertId);
}

export async function getVideoByIdForViewer(
  id: number,
  viewerUserId?: number | null
) {
  const [rows] = await pool.execute<RowDataPacket[]>(
    `SELECT
        v.id,
        v.title,
        v.description,
        v.genre,
        v.producer,
        v.age_rating,
        v.visibility,
        v.uploader_id,
        v.blob_url,
        v.created_at,
        v.updated_at,
        COALESCE(ra.avg_rating, 0)    AS avg_rating,
        COALESCE(ra.rating_count, 0) AS rating_count
     FROM videos v
     LEFT JOIN (
        SELECT video_id,
               ROUND(AVG(rating), 2) AS avg_rating,
               COUNT(*)              AS rating_count
        FROM ratings
        GROUP BY video_id
     ) ra ON ra.video_id = v.id
     WHERE v.id = ? AND v.deleted_at IS NULL`,
    [id]
  );

  const v = rows[0];
  if (!v) return null;

  // visibility check
  if (v.visibility === "private" && v.uploader_id !== viewerUserId) return null;
  return v;
}

export async function listVideosForViewer({
  q,
  genre,
  uploaderId,
  visibility,
  page = 1,
  limit = 20,
  viewerUserId,
}: {
  q?: string;
  genre?: string;
  uploaderId?: number;
  visibility?: Visibility;
  page?: number;
  limit?: number;
  viewerUserId?: number | null;
}) {
  const where: string[] = ["v.deleted_at IS NULL"];
  const args: any[] = [];

  // visibility rules
  if (!visibility) {
    where.push("(v.visibility = ? OR v.uploader_id = ?)");
    args.push("public", viewerUserId ?? -1);
  } else if (visibility === "public") {
    where.push("v.visibility = ?");
    args.push("public");
  } else if (visibility === "unlisted") {
    where.push("v.visibility = ? AND v.uploader_id = ?");
    args.push("unlisted", viewerUserId ?? -1);
  } else if (visibility === "private") {
    where.push("v.visibility = ? AND v.uploader_id = ?");
    args.push("private", viewerUserId ?? -1);
  }

  if (q && q.trim()) {
    const like = `%${q.trim()}%`;
    where.push(
      "(v.title LIKE ? OR v.description LIKE ? OR v.genre LIKE ? OR v.producer LIKE ?)"
    );
    args.push(like, like, like, like);
  }

  if (genre && genre.trim()) {
    where.push("v.genre = ?");
    args.push(genre.trim());
  }

  if (uploaderId) {
    where.push("v.uploader_id = ?");
    args.push(uploaderId);
  }

  const pageNum = Math.max(1, Number(page || 1));
  const limitNum = Math.min(50, Math.max(1, Number(limit || 20)));
  const offsetNum = (pageNum - 1) * limitNum;

  const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

  // Count (from videos only)
  const [countRows] = await pool.query<RowDataPacket[]>(
    `SELECT COUNT(*) AS total
     FROM videos v
     ${whereSql}`,
    args
  );
  const total = Number((countRows as any)[0]?.total || 0);

  // Data with avg rating via LEFT JOIN subquery
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT
        v.id,
        v.title,
        v.description,
        v.genre,
        v.producer,
        v.age_rating,
        v.visibility,
        v.uploader_id,
        v.blob_url,
        v.created_at,
        v.updated_at,
        COALESCE(ra.avg_rating, 0)    AS avg_rating,
        COALESCE(ra.rating_count, 0) AS rating_count
     FROM videos v
     LEFT JOIN (
        SELECT video_id,
               ROUND(AVG(rating), 2) AS avg_rating,
               COUNT(*)              AS rating_count
        FROM ratings
        GROUP BY video_id
     ) ra ON ra.video_id = v.id
     ${whereSql}
     ORDER BY v.created_at DESC
     LIMIT ${limitNum} OFFSET ${offsetNum}`,
    args
  );

  return {
    data: rows,
    page: pageNum,
    limit: limitNum,
    total,
    hasMore: offsetNum + (rows as any[]).length < total,
  };
}

export async function updateVideoMetadata(
  id: number,
  ownerId: number,
  patch: Partial<{
    title: string;
    description: string | null;
    genre: string | null;
    producer: string | null;
    age_rating: string | null;
    visibility: Visibility;
  }>
) {
  // verify ownership
  const [rows] = await pool.execute<RowDataPacket[]>(
    "SELECT uploader_id FROM videos WHERE id=? AND deleted_at IS NULL",
    [id]
  );
  const v = rows[0];
  if (!v) return { updated: false, reason: "NOT_FOUND" };
  if (v.uploader_id !== ownerId) return { updated: false, reason: "FORBIDDEN" };

  const fields: string[] = [];
  const args: any[] = [];
  for (const [k, val] of Object.entries(patch)) {
    if (val === undefined) continue;
    fields.push(`${k} = ?`);
    args.push(val);
  }
  if (!fields.length) return { updated: true };
  args.push(id);

  await pool.execute(`UPDATE videos SET ${fields.join(", ")} WHERE id=?`, args);
  return { updated: true };
}

export async function softDeleteVideo(id: number, ownerId: number) {
  const [rows] = await pool.execute<RowDataPacket[]>(
    "SELECT uploader_id FROM videos WHERE id=? AND deleted_at IS NULL",
    [id]
  );
  const v = rows[0];
  if (!v) return { deleted: false, reason: "NOT_FOUND" };
  if (v.uploader_id !== ownerId) return { deleted: false, reason: "FORBIDDEN" };
  await pool.execute("UPDATE videos SET deleted_at = NOW() WHERE id=?", [id]);
  return { deleted: true };
}
