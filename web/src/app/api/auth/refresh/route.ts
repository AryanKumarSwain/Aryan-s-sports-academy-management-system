import { UserRole } from '@/generated/prisma';
import { cookies } from 'next/headers';
import { fail, handleApiError, ok } from '@/lib/api';
import {
  ACCESS_MAX_AGE,
  REFRESH_MAX_AGE,
  cookieOptions,
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  ACCESS_COOKIE,
  REFRESH_COOKIE
} from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { resolveAcademyAccess } from '@/lib/subscription';

async function resolveSession(refresh: { sub: string; role: UserRole }) {
  if (refresh.role === UserRole.SUPER_ADMIN) {
    const admin = await prisma.superAdmin.findFirst({
      where: { super_admin_id: parseInt(refresh.sub, 10), is_active: true }
    });
    if (!admin) return null;
    return {
      id: admin.super_admin_id,
      role: UserRole.SUPER_ADMIN,
      academy_id: null,
      name: admin.name,
      email: admin.email,
      subscriptionStatus: 'active' as const
    };
  }

  if (refresh.role === UserRole.COACH) {
    const coach = await prisma.coach.findFirst({
      where: { coach_id: parseInt(refresh.sub, 10), is_deleted: false },
      include: { academy: true }
    });
    if (!coach) return null;
    const access = resolveAcademyAccess(coach.academy.status, coach.academy.subscription_expires_at);
    return {
      id: coach.coach_id,
      role: UserRole.COACH,
      academy_id: coach.academy_id,
      name: coach.name,
      email: coach.email ?? '',
      subscriptionStatus: access.allowed ? ('active' as const) : ('expired' as const)
    };
  }

  const user = await prisma.user.findFirst({
    where: { user_id: parseInt(refresh.sub, 10), is_deleted: false },
    include: { academy: true }
  });
  if (!user) return null;
  let subscriptionStatus: 'active' | 'expired' | 'suspended' = 'active';
  if (user.academy) {
    const access = resolveAcademyAccess(user.academy.status, user.academy.subscription_expires_at);
    if (!access.allowed) subscriptionStatus = 'expired';
  }
  return {
    id: user.user_id,
    role: user.role,
    academy_id: user.academy_id,
    name: user.name,
    email: user.email,
    subscriptionStatus
  };
}

export async function POST() {
  try {
    const jar = await cookies();
    const refreshToken = jar.get(REFRESH_COOKIE)?.value;
    if (!refreshToken) return fail('No refresh token', 'UNAUTHORIZED', 401);

    const refresh = verifyRefreshToken(refreshToken);
    const session = await resolveSession(refresh);
    if (!session) return fail('Invalid session', 'UNAUTHORIZED', 401);

    const accessToken = signAccessToken(session);
    const newRefresh = signRefreshToken({ id: session.id, role: session.role });

    jar.set(ACCESS_COOKIE, accessToken, cookieOptions(ACCESS_MAX_AGE));
    jar.set(REFRESH_COOKIE, newRefresh, cookieOptions(REFRESH_MAX_AGE));

    return ok({ refreshed: true });
  } catch (error) {
    return handleApiError(error);
  }
}
