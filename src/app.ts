import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { httpLogger } from './middleware/logger.js';
import healthRoutes from './routes/health.routes.js';
import authRoutes from './routes/auth.routes.js';
import videosRoutes from './routes/videos.routes.js';
import commentsRoutes from './routes/comments.routes.js';
import ratingsRoutes from './routes/ratings.routes.js';
import { ensureContainer } from './storage/blob.js';
import { notFound, errorHandler } from './middleware/errors.js';
import { pool } from './db/mysql.js';

const app = express();

// security & parsing
app.use(helmet());
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '25mb' }));

// logging
app.use(httpLogger);

// routes
app.get('/api', (_req, res) => res.json({ ok: true, name: 'CloudFlix API' }));
app.use('/api/health', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/videos', videosRoutes);
app.use('/api/videos/:videoId/comments', commentsRoutes);
app.use('/api/videos/:videoId/ratings', ratingsRoutes);
// app.get('/api/debug/db', async (_req, res) => {
//   const [r] = await pool.query('SELECT COUNT(*) AS c FROM videos');
//   res.json(r);
// });

// boot tasks (don’t await here; just start)
ensureContainer().catch(() => { /* logged by pino-http on use */ });

// 404 & errors
app.use(notFound);
app.use(errorHandler);

export default app;
