// src/middleware/httpCache.ts
import crypto from 'crypto';
import type { Request, Response, NextFunction } from 'express';

export function cacheableJson(maxAgeSec = 60) {
  return (req: Request, res: Response, next: NextFunction) => {
    // wrap res.json
    const _json = res.json.bind(res);
    res.json = (body: any) => {
      const payload = typeof body === 'string' ? body : JSON.stringify(body);
      const etag = `"${crypto.createHash('sha1').update(payload).digest('base64')}"`;

      // 304 short-circuit
      if (req.headers['if-none-match'] === etag) {
        res.status(304);
        return res.end();
      }

      res.setHeader('ETag', etag);
      res.setHeader('Cache-Control', `public, max-age=${maxAgeSec}`);
      return _json(body);
    };
    next();
  };
}
