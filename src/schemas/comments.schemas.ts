import { z } from 'zod';

export const videoIdParam = z.object({
  params: z.object({ videoId: z.coerce.number().int().positive() })
});

export const createCommentSchema = z.object({
  params: z.object({ videoId: z.coerce.number().int().positive() }),
  body: z.object({ comment: z.string().min(1).max(2000) })
});

export const commentIdParam = z.object({
  params: z.object({
    videoId: z.coerce.number().int().positive(),
    commentId: z.coerce.number().int().positive()
  })
});
