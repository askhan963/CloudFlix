import { NextFunction, Response, Request } from 'express';
import { verifyAccessToken } from '../utils/tokens.js';

export interface AuthedRequest extends Request {
  user?: { id: number; username: string; role: 'creator'|'consumer' };
}

export function requireAuth(req: AuthedRequest, res: Response, next: NextFunction) {
  const h = req.headers.authorization;
  if (!h?.startsWith('Bearer ')) return res.status(401).json({ ok: false, error: { code:'AUTH_REQUIRED', message:'Missing token' } });
  try {
    const payload = verifyAccessToken(h.slice(7));
    req.user = { id: payload.id, username: payload.username, role: payload.role };
    next();
  } catch {
    return res.status(401).json({ ok: false, error: { code:'INVALID_TOKEN', message:'Invalid token' } });
  }
}

export function requireRole(role: 'creator'|'consumer') {
  return (req: AuthedRequest, res: Response, next: NextFunction) => {
    if (!req.user) return res.status(401).json({ ok:false, error:{ code:'AUTH_REQUIRED', message:'Missing token' } });
    if (req.user.role !== role) return res.status(403).json({ ok:false, error:{ code:'FORBIDDEN', message:'Insufficient role' } });
    next();
  };
}
