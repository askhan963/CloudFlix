import { z } from 'zod';

export const uploadVideoSchema = z.object({
  body: z.object({
    title: z.string().min(1).max(200),
    description: z.string().max(5000).optional(),
    genre: z.string().max(100).optional(),
    producer: z.string().max(100).optional(),
    age_rating: z.string().max(10).optional(),
    visibility: z.enum(['public','unlisted','private']).optional()
  })
});

export const updateVideoSchema = z.object({
  params: z.object({ id: z.coerce.number().int().positive() }),
  body: z.object({
    title: z.string().min(1).max(200).optional(),
    description: z.string().max(5000).nullable().optional(),
    genre: z.string().max(100).nullable().optional(),
    producer: z.string().max(100).nullable().optional(),
    age_rating: z.string().max(10).nullable().optional(),
    visibility: z.enum(['public','unlisted','private']).optional()
  })
});

export const videoIdParam = z.object({
  params: z.object({ id: z.coerce.number().int().positive() })
});

export const listVideosQuery = z.object({
  query: z.object({
    q: z.string().max(200).optional(),
    genre: z.string().max(100).optional(),
    uploaderId: z.coerce.number().int().positive().optional(),
    visibility: z.enum(['public','unlisted','private']).optional(),
    page: z.coerce.number().int().min(1).default(1).optional(),
    limit: z.coerce.number().int().min(1).max(50).default(20).optional(),
    sort: z.enum(['newest','rating','views']).optional() // ‘rating’/‘views’ placeholders for later
  })
});
