import { NextResponse, type NextRequest } from 'next/server';
import { UserRole } from '@/generated/prisma';
import {
  ACCESS_COOKIE,
  authCookieName,
  verifyAccessToken
} from '@/lib/auth';

const PROTECTED_PREFIXES = ['/admin', '/coach', '/super-admin', '/dashboard'];

const PUBLIC_PATHS = ['/login', '/register', '/'];

const ROLE_PREFIX: Record<string, UserRole[]> = {
  '/admin': [UserRole.ACADEMY_ADMIN],
  '/dashboard/admin': [UserRole.ACADEMY_ADMIN],
  '/coach': [UserRole.COACH],
  '/dashboard/coach': [UserRole.COACH],
  '/super-admin': [UserRole.SUPER_ADMIN],
  '/dashboard/super-admin': [UserRole.SUPER_ADMIN]
};

function getToken(req: NextRequest): string | null {
  const access = req.cookies.get(ACCESS_COOKIE)?.value;
  if (access) return access;

  for (const role of [UserRole.ACADEMY_ADMIN, UserRole.COACH, UserRole.SUPER_ADMIN]) {
    const legacy = req.cookies.get(authCookieName(role))?.value;
    if (legacy) return legacy;
  }
  return null;
}

function requiredRoles(pathname: string): UserRole[] | null {
  for (const [prefix, roles] of Object.entries(ROLE_PREFIX)) {
    if (pathname === prefix || pathname.startsWith(`${prefix}/`)) return roles;
  }
  return null;
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname.startsWith('/api') || pathname.startsWith('/_next')) {
    return NextResponse.next();
  }

  const isProtected = PROTECTED_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  );

  if (!isProtected) {
    return NextResponse.next();
  }

  const token = getToken(req);
  if (!token) {
    const login = new URL('/login', req.url);
    login.searchParams.set('redirect', pathname);
    return NextResponse.redirect(login);
  }

  try {
    const session = verifyAccessToken(token);
    const allowed = requiredRoles(pathname);
    if (allowed && !allowed.includes(session.role)) {
      const home =
        session.role === UserRole.SUPER_ADMIN
          ? '/super-admin/dashboard'
          : session.role === UserRole.COACH
            ? '/coach/dashboard'
            : '/admin/dashboard';
      return NextResponse.redirect(new URL(home, req.url));
    }

    if (session.subscriptionStatus === 'expired' || session.subscriptionStatus === 'suspended') {
      return NextResponse.redirect(new URL('/subscription-expired', req.url));
    }

    const headers = new Headers(req.headers);
    headers.set('x-user-id', session.sub);
    headers.set('x-user-role', session.role);
    if (session.academy_id) headers.set('x-academy-id', String(session.academy_id));

    return NextResponse.next({ request: { headers } });
  } catch {
    const login = new URL('/login', req.url);
    login.searchParams.set('redirect', pathname);
    return NextResponse.redirect(login);
  }
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)']
};
