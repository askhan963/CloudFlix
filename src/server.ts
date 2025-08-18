import app from './app.js';
import { env } from './config/env.js';
import { logger } from './middleware/logger.js';

app.listen(env.port, () => {
  logger.info({ port: env.port }, 'API up');
});
