import bcrypt from 'bcryptjs';
import jwt, { type SignOptions } from 'jsonwebtoken';
import { UserRole } from '@/generated/prisma';
import { randomBytes } from 'crypto';

const JWT_SECRET = process.env.JWT_SECRET || 'change-me-in-production';
const ACCESS_EXPIRE = (process.env.JWT_ACCESS_EXPIRE || '15m') as SignOptions['expiresIn'];
const REFRESH_EXPIRE = (process.env.JWT_REFRESH_EXPIRE || '7d') as SignOptions['expiresIn'];
const BCRYPT_ROUNDS = 12;

export type SessionPayload = {
  sub: string;
  role: UserRole;
  academy_id?: number | null;
  name: string;
  email: string;
  subscriptionStatus?: 'active' | 'expired' | 'suspended';
};

export type RefreshPayload = {
  sub: string;
  role: UserRole;
  jti: string;
  type: 'refresh';
};

export async function hashPassword(password: string) {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export function signAccessToken(payload: Omit<SessionPayload, 'sub'> & { id: number | string }) {
  const session: SessionPayload = {
    sub: String(payload.id),
    role: payload.role,
    academy_id: payload.academy_id,
    name: payload.name,
    email: payload.email,
    subscriptionStatus: payload.subscriptionStatus
  };
  return jwt.sign(session, JWT_SECRET, { expiresIn: ACCESS_EXPIRE });
}

export function signRefreshToken(payload: { id: number | string; role: UserRole }) {
  const refresh: RefreshPayload = {
    sub: String(payload.id),
    role: payload.role,
    jti: randomBytes(16).toString('hex'),
    type: 'refresh'
  };
  return jwt.sign(refresh, JWT_SECRET, { expiresIn: REFRESH_EXPIRE });
}

/** @deprecated Use signAccessToken */
export function signToken(payload: Omit<SessionPayload, 'sub'> & { id: number | string }) {
  return signAccessToken(payload);
}

export function verifyAccessToken(token: string): SessionPayload {
  const payload = jwt.verify(token, JWT_SECRET) as SessionPayload;
  if (!payload.sub || !payload.role) throw new Error('Invalid token payload');
  return payload;
}

export function verifyRefreshToken(token: string): RefreshPayload {
  const payload = jwt.verify(token, JWT_SECRET) as RefreshPayload;
  if (payload.type !== 'refresh') throw new Error('Invalid refresh token');
  return payload;
}

/** @deprecated Use verifyAccessToken */
export function verifyToken(token: string): SessionPayload {
  return verifyAccessToken(token);
}

export const ACCESS_COOKIE = 'sams_access_token';
export const REFRESH_COOKIE = 'sams_refresh_token';

/** Legacy per-role cookie names — kept for backward compatibility during migration */
export function authCookieName(role: UserRole) {
  if (role === UserRole.SUPER_ADMIN) return 'sams_super_token';
  if (role === UserRole.COACH) return 'sams_coach_token';
  return 'sams_admin_token';
}

export function cookieOptions(maxAgeSeconds: number) {
  return {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: maxAgeSeconds
  };
}

export const ACCESS_MAX_AGE = 15 * 60;
export const REFRESH_MAX_AGE = 7 * 24 * 60 * 60;

export function setAuthCookies(
  setCookie: (name: string, value: string, options: ReturnType<typeof cookieOptions>) => void,
  accessToken: string,
  refreshToken: string
) {
  setCookie(ACCESS_COOKIE, accessToken, cookieOptions(ACCESS_MAX_AGE));
  setCookie(REFRESH_COOKIE, refreshToken, cookieOptions(REFRESH_MAX_AGE));
}

export function clearAuthCookies(
  deleteCookie: (name: string) => void
) {
  deleteCookie(ACCESS_COOKIE);
  deleteCookie(REFRESH_COOKIE);
  deleteCookie(authCookieName(UserRole.ACADEMY_ADMIN));
  deleteCookie(authCookieName(UserRole.COACH));
  deleteCookie(authCookieName(UserRole.SUPER_ADMIN));
}
