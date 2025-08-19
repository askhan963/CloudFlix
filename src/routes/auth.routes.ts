import { Router } from 'express';
import cookieParser from 'cookie-parser';
import { validate } from '../middleware/validate.js';
import { signupSchema, loginSchema } from '../schemas/auth.schemas.js';
import { rateLimitLogin } from '../middleware/rateLimit.js';
import { requireAuth } from '../middleware/auth.js';
import { signupHandler, loginHandler, refreshHandler, logoutHandler, meHandler } from '../controllers/auth.controller.js';

const r = Router();
r.use(cookieParser());

r.post('/signup', validate(signupSchema), signupHandler);
r.post('/login', rateLimitLogin, validate(loginSchema), loginHandler);
r.post('/refresh', refreshHandler);
r.post('/logout', logoutHandler);
r.get('/me', requireAuth, meHandler);

export default r;
