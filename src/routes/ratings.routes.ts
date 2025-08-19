import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { videoIdParam, rateSchema } from '../schemas/ratings.schemas.js';
import { rateHandler, avgHandler } from '../controllers/ratings.controller.js';

const r = Router({ mergeParams: true });

r.get('/avg', validate(videoIdParam), avgHandler);
r.post('/', requireAuth, validate(rateSchema), rateHandler);

export default r;
