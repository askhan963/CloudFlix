import pino from 'pino';
import pinoHttp from 'pino-http';
import type { RequestHandler, Response } from 'express';
import { nanoid } from 'nanoid';

export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: process.env.NODE_ENV === 'development'
    ? { target: 'pino-pretty', options: { colorize: true } }
    : undefined
});

// pino-http returns HttpLogger<...>; cast to Express middleware
export const httpLogger = pinoHttp({
  logger,
  genReqId: () => nanoid(),
  customLogLevel: (res: Response, err) => (err || res.statusCode >= 500) ? 'error' : 'info'
}) as unknown as RequestHandler;
