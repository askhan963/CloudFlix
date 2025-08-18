import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { httpLogger } from './middleware/logger.js';
import healthRoutes from './routes/health.routes.js';
import { ensureContainer } from './storage/blob.js';
import { notFound, errorHandler } from './middleware/errors.js';

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

// boot tasks (don’t await here; just start)
ensureContainer().catch(() => { /* logged by pino-http on use */ });

// 404 & errors
app.use(notFound);
app.use(errorHandler);

export default app;
