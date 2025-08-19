import { Request, Response } from 'express';
import { login, signup, refresh, logout } from '../services/auth.service.js';
import { setRefreshCookie, clearRefreshCookie } from '../utils/cookies.js';
import { AuthedRequest } from '../middleware/auth.js';

const useCookies = (process.env.USE_COOKIE_TOKENS || 'true').toLowerCase() === 'true';

export async function signupHandler(req: Request, res: Response) {
  const { username, password, role, email } = req.body;
  try {
    const out = await signup(username, password, role, email);
    if (useCookies) {
      setRefreshCookie(res, out.refreshToken);
      delete (out as any).refreshToken;
    }
    res.status(201).json(out);
  } catch (e:any) {
    const msg = e?.message?.includes('Duplicate') ? 'Username or email already exists' : e?.message;
    res.status(400).json({ ok:false, error:{ code:'BAD_REQUEST', message: msg } });
  }
}

export async function loginHandler(req: Request, res: Response) {
  const { usernameOrEmail, password } = req.body;
  try {
    const out = await login(usernameOrEmail, password, req.headers['user-agent'], req.ip);
    if (useCookies) {
      setRefreshCookie(res, out.refreshToken);
      delete (out as any).refreshToken;
    }
    res.json(out);
  } catch {
    res.status(401).json({ ok:false, error:{ code:'INVALID_CREDENTIALS', message:'Invalid credentials' } });
  }
}

export async function refreshHandler(req: Request, res: Response) {
  const rt = useCookies ? (req.cookies?.refreshToken as string) : (req.body?.refreshToken as string);
  const userId = Number(req.body?.userId); // client stores userId after login, or you can put it in cookie if desired
  if (!rt || !userId) return res.status(401).json({ ok:false, error:{ code:'INVALID_REFRESH', message:'Missing refresh' } });
  try {
    const out = await refresh(userId, rt, req.headers['user-agent'], req.ip);
    if (useCookies) {
      setRefreshCookie(res, out.refreshToken);
      delete (out as any).refreshToken;
    }
    res.json({ accessToken: out.accessToken, user: out.user });
  } catch {
    res.status(401).json({ ok:false, error:{ code:'INVALID_REFRESH', message:'Invalid refresh' } });
  }
}

export async function logoutHandler(req: Request, res: Response) {
  const rt = useCookies ? (req.cookies?.refreshToken as string) : (req.body?.refreshToken as string);
  const userId = Number(req.body?.userId);
  if (rt && userId) await logout(userId, rt);
  if (useCookies) clearRefreshCookie(res);
  res.json({ ok: true });
}

export async function meHandler(req: AuthedRequest, res: Response) {
  res.json({ user: req.user });
}
