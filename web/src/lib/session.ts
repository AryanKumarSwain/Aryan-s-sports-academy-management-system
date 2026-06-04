import { cookies } from 'next/headers';
import { UserRole } from '@/generated/prisma';
import {
  ACCESS_COOKIE,
  authCookieName,
  REFRESH_COOKIE,
  SessionPayload,
  verifyAccessToken
} from './auth';

const LEGACY_COOKIE_NAMES = [
  authCookieName(UserRole.ACADEMY_ADMIN),
  authCookieName(UserRole.COACH),
  authCookieName(UserRole.SUPER_ADMIN)
];

export async function getSession(): Promise<SessionPayload | null> {
  const jar = await cookies();

  const access = jar.get(ACCESS_COOKIE)?.value;
  if (access) {
    try {
      return verifyAccessToken(access);
    } catch {
      /* fall through to legacy cookies */
    }
  }

  for (const name of LEGACY_COOKIE_NAMES) {
    const token = jar.get(name)?.value;
    if (!token) continue;
    try {
      return verifyAccessToken(token);
    } catch {
      /* try next cookie */
    }
  }
  return null;
}

export function getRefreshToken(): string | null {
  /* sync helper not usable with async cookies — use getRefreshTokenAsync */
  return null;
}

export async function getRefreshTokenAsync(): Promise<string | null> {
  const jar = await cookies();
  return jar.get(REFRESH_COOKIE)?.value ?? null;
}

export function requireRole(session: SessionPayload | null, ...roles: UserRole[]) {
  if (!session || !roles.includes(session.role)) {
    const error = new Error('Unauthorized') as Error & { statusCode: number };
    error.statusCode = 401;
    throw error;
  }
  return session;
}
