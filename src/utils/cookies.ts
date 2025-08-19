import { Response } from 'express';

export function setRefreshCookie(res: Response, token: string) {
  const secure = process.env.NODE_ENV === 'production';
  res.cookie('refreshToken', token, {
    httpOnly: true,
    secure,
    sameSite: 'lax',
    path: '/api/auth',
    maxAge: Number(process.env.REFRESH_TOKEN_EXPIRES_DAYS || 30) * 24 * 60 * 60 * 1000
  });
}

export function clearRefreshCookie(res: Response) {
  res.clearCookie('refreshToken', { path: '/api/auth' });
}
