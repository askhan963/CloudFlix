import { Response } from 'express';
import { AuthedRequest } from '../middleware/auth.js';
import { listComments, addComment, deleteComment } from '../services/comments.service.js';

export async function listCommentsHandler(req: AuthedRequest, res: Response) {
  const videoId = Number(req.params.videoId);
  const rows = await listComments(videoId);
  res.json({ ok: true, data: rows });
}

export async function createCommentHandler(req: AuthedRequest, res: Response) {
  const videoId = Number(req.params.videoId);
  const userId = req.user!.id;
  const { comment } = req.body;
  const id = await addComment(videoId, userId, comment);
  res.status(201).json({ ok: true, id });
}

export async function deleteCommentHandler(req: AuthedRequest, res: Response) {
  const videoId = Number(req.params.videoId);
  const commentId = Number(req.params.commentId);
  const userId = req.user!.id;
  const result = await deleteComment(videoId, commentId, userId);
  if (!result.deleted) {
    if (result.reason === 'NOT_FOUND') return res.status(404).json({ ok:false, error:{ code:'NOT_FOUND', message:'Comment not found' } });
    if (result.reason === 'FORBIDDEN') return res.status(403).json({ ok:false, error:{ code:'FORBIDDEN', message:'Not allowed' } });
  }
  res.json({ ok: true });
}
