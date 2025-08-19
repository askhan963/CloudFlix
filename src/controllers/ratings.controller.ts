import { Response } from 'express';
import { AuthedRequest } from '../middleware/auth.js';
import { upsertRating, getAverageRating } from '../services/ratings.service.js';

export async function rateHandler(req: AuthedRequest, res: Response) {
  const videoId = Number(req.params.videoId);
  const userId = req.user!.id;
  const rating = Number(req.body.rating);
  await upsertRating(videoId, userId, rating);
  res.json({ ok: true });
}

export async function avgHandler(req: AuthedRequest, res: Response) {
  const videoId = Number(req.params.videoId);
  const out = await getAverageRating(videoId);
  res.json({ ok: true, ...out, videoId });
}
