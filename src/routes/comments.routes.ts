import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { videoIdParam, createCommentSchema, commentIdParam } from '../schemas/comments.schemas.js';
import { listCommentsHandler, createCommentHandler, deleteCommentHandler } from '../controllers/comments.controller.js';

const r = Router({ mergeParams: true });

r.get('/', validate(videoIdParam), listCommentsHandler);
r.post('/', requireAuth, validate(createCommentSchema), createCommentHandler);
r.delete('/:commentId', requireAuth, validate(commentIdParam), deleteCommentHandler);

export default r;
