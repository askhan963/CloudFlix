import { Request, Response } from 'express';
import { AuthedRequest } from '../middleware/auth.js';
import { uploadVideoToBlob, createVideo, listVideosForViewer, getVideoByIdForViewer, updateVideoMetadata, softDeleteVideo } from '../services/videos.service.js';
// import { fromBuffer } from 'file-type'; // optional if you want to sniff; else rely on mimetype

export async function uploadHandler(req: AuthedRequest, res: Response) {
  try {
    const user = req.user!;
    const file = (req as any).file as Express.Multer.File;
    if (!file) return res.status(400).json({ ok:false, error:{ code:'FILE_REQUIRED', message:'file field is required' } });

    const { title, description, genre, producer, age_rating, visibility } = req.body;

    // Upload to Blob
    const { blobName, blobUrl, size } = await uploadVideoToBlob(user.id, file.originalname, file.mimetype || 'application/octet-stream', file.buffer);

    // (Optional) duration extraction could be added later via ffprobe job
    const videoId = await createVideo({
      title,
      description,
      genre,
      producer,
      age_rating,
      visibility,
      uploader_id: user.id,
      blob_name: blobName,
      blob_url: blobUrl,
      size_bytes: size,
      duration_s: null
    });

    res.status(201).json({ ok:true, id: videoId, url: blobUrl });
  } catch (e:any) {
    res.status(500).json({ ok:false, error:{ code:'UPLOAD_FAILED', message: e.message } });
  }
}

export async function listHandler(req: AuthedRequest, res: Response) {
  try {
    const viewerId = req.user?.id ?? null;
    const { q, genre, uploaderId, visibility, page, limit } = req.query as any;
    const out = await listVideosForViewer({
      q, genre,
      uploaderId: uploaderId ? Number(uploaderId) : undefined,
      visibility: visibility as any,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      viewerUserId: viewerId
    });
    res.json({ ok: true, ...out });
  } catch (e: any) {
    res.status(500).json({ ok: false, error: { code: e?.code || 'INTERNAL', message: e?.message || 'Query failed' } });
  }
}



export async function getHandler(req: AuthedRequest, res: Response) {
  const id = Number(req.params.id);
  const viewerId = req.user?.id ?? null;
  const v = await getVideoByIdForViewer(id, viewerId);
  if (!v) return res.status(404).json({ ok:false, error:{ code:'NOT_FOUND', message:'Video not found or not accessible' } });
  res.json({ ok:true, video: v });
}

export async function updateHandler(req: AuthedRequest, res: Response) {
  const id = Number(req.params.id);
  const result = await updateVideoMetadata(id, req.user!.id, req.body);
  if (!result.updated) {
    if (result.reason === 'NOT_FOUND') return res.status(404).json({ ok:false, error:{ code:'NOT_FOUND', message:'Video not found' } });
    if (result.reason === 'FORBIDDEN') return res.status(403).json({ ok:false, error:{ code:'FORBIDDEN', message:'Not your video' } });
  }
  res.json({ ok:true });
}

export async function deleteHandler(req: AuthedRequest, res: Response) {
  const id = Number(req.params.id);
  const result = await softDeleteVideo(id, req.user!.id);
  if (!result.deleted) {
    if (result.reason === 'NOT_FOUND') return res.status(404).json({ ok:false, error:{ code:'NOT_FOUND', message:'Video not found' } });
    if (result.reason === 'FORBIDDEN') return res.status(403).json({ ok:false, error:{ code:'FORBIDDEN', message:'Not your video' } });
  }
  res.json({ ok:true });
}
