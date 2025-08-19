import { NextFunction, Response, Request } from 'express';

const hits = new Map<string, { count: number; ts: number }>();
const WINDOW_MS = 60_000; // 1 min
const MAX = 10;           // 10 req / min

export function rateLimitLogin(req: Request, res: Response, next: NextFunction) {
  const key = `${req.ip || '0'}:${(req.body?.usernameOrEmail || '').toLowerCase()}`;
  const now = Date.now();
  const item = hits.get(key);
  if (!item || now - item.ts > WINDOW_MS) {
    hits.set(key, { count: 1, ts: now });
    return next();
  }
  item.count++;
  if (item.count > MAX) {
    return res.status(429).json({ ok:false, error:{ code:'RATE_LIMITED', message:'Too many attempts, try later' } });
  }
  next();
}
