// src/middleware/memoryCache.ts
import type { Request, Response, NextFunction } from 'express';

const store = new Map<string, { t: number; v: any }>();
export function memoryCache(ttlMs = 10000) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (req.method !== 'GET') return next();
    const key = req.originalUrl;
    const hit = store.get(key);
    const now = Date.now();
    if (hit && now - hit.t < ttlMs) return res.json(hit.v);

    const _json = res.json.bind(res);
    res.json = (body: any) => { store.set(key, { t: Date.now(), v: body }); return _json(body); };
    next();
  };
}
