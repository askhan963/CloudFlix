import { Router } from 'express';
import multer from 'multer';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { uploadVideoSchema, updateVideoSchema, videoIdParam, listVideosQuery } from '../schemas/videos.schemas.js';
import { uploadHandler, listHandler, getHandler, updateHandler, deleteHandler } from '../controllers/videos.controller.js';
import { cacheableJson } from '../middleware/httpCache.js';
import { memoryCache } from '../middleware/memoryCache.js';
const r = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 1024 * 1024 * 500 } }); // 500MB demo

// List & Get (public + owner-private logic inside controller)
// r.get('/', validate(listVideosQuery), listHandler);
// r.get('/:id', validate(videoIdParam), getHandler)
// r.get('/', validate(listVideosQuery), cacheableJson(), listHandler);
// r.get('/:id', validate(videoIdParam), cacheableJson(), getHandler);
r.get('/', memoryCache(8000), cacheableJson(30), validate(listVideosQuery), listHandler);
r.get('/:id', memoryCache(8000), cacheableJson(60), validate(videoIdParam), getHandler);

// Create / Update / Delete (auth required)
r.post('/upload', requireAuth, upload.single('file'), validate(uploadVideoSchema), uploadHandler);
r.patch('/:id', requireAuth, validate(updateVideoSchema), updateHandler);
r.delete('/:id', requireAuth, validate(videoIdParam), deleteHandler);

export default r;
