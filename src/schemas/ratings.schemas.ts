import { z } from 'zod';

export const videoIdParam = z.object({
  params: z.object({ videoId: z.coerce.number().int().positive() })
});

export const rateSchema = z.object({
  params: z.object({ videoId: z.coerce.number().int().positive() }),
  body: z.object({ rating: z.coerce.number().int().min(1).max(5) })
});
