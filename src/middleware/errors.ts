import type { NextFunction, Request, Response } from 'express';

export class ApiError extends Error {
  status: number;
  code: string;
  details?: any;
  constructor(status: number, code: string, message: string, details?: any) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export function notFound(_req: Request, _res: Response) {
  throw new ApiError(404, 'NOT_FOUND', 'Route not found');
}

export function errorHandler(err: any, _req: Request, res: Response, _next: NextFunction) {
  const status = err?.status || 500;
  const payload = {
    ok: false,
    error: {
      code: err?.code || 'INTERNAL',
      message: err?.message || 'Internal Server Error',
      details: err?.details
    }
  };
  res.status(status).json(payload);
}
