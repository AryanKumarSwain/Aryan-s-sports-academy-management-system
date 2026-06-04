import { UserRole } from '@/generated/prisma';
import { fail, handleApiError, ok } from '@/lib/api';
import {
  ACCESS_MAX_AGE,
  REFRESH_MAX_AGE,
  authCookieName,
  cookieOptions,
  signAccessToken,
  signRefreshToken,
  verifyPassword,
  ACCESS_COOKIE,
  REFRESH_COOKIE
} from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { resolveAcademyAccess } from '@/lib/subscription';
import { loginSchema } from '@/validations/auth';
import { cookies } from 'next/headers';

function subscriptionStatusFromAccess(allowed: boolean): 'active' | 'expired' | 'suspended' {
  return allowed ? 'active' : 'expired';
}

export async function POST(req: Request) {
  try {
    const body = loginSchema.parse(await req.json());
    const email = body.email.trim().toLowerCase();
    const jar = await cookies();

    const setTokens = (
      accessToken: string,
      refreshToken: string,
      legacyCookie: string
    ) => {
      jar.set(ACCESS_COOKIE, accessToken, cookieOptions(ACCESS_MAX_AGE));
      jar.set(REFRESH_COOKIE, refreshToken, cookieOptions(REFRESH_MAX_AGE));
      // Legacy cookie for gradual migration
      jar.set(legacyCookie, accessToken, cookieOptions(ACCESS_MAX_AGE));
    };

    if (body.role === 'SUPER_ADMIN') {
      const admin = await prisma.superAdmin.findFirst({
        where: { email, is_active: true }
      });
      if (!admin || !(await verifyPassword(body.password, admin.password_hash))) {
        return fail('Invalid email or password', 'INVALID_CREDENTIALS', 401);
      }
      const payload = {
        id: admin.super_admin_id,
        role: UserRole.SUPER_ADMIN,
        academy_id: null,
        name: admin.name,
        email: admin.email,
        subscriptionStatus: 'active' as const
      };
      setTokens(
        signAccessToken(payload),
        signRefreshToken({ id: admin.super_admin_id, role: UserRole.SUPER_ADMIN }),
        authCookieName(UserRole.SUPER_ADMIN)
      );
      return ok({ role: UserRole.SUPER_ADMIN, name: admin.name });
    }

    if (body.role === 'COACH') {
      const coach = await prisma.coach.findFirst({
        where: { email, is_deleted: false },
        include: { academy: true }
      });
      if (!coach?.password_hash || !(await verifyPassword(body.password, coach.password_hash))) {
        return fail('Invalid email or password', 'INVALID_CREDENTIALS', 401);
      }
      const access = resolveAcademyAccess(
        coach.academy.status,
        coach.academy.subscription_expires_at
      );
      if (!access.allowed) return fail(access.reason!, 'SUBSCRIPTION_EXPIRED', 403);

      const payload = {
        id: coach.coach_id,
        role: UserRole.COACH,
        academy_id: coach.academy_id,
        name: coach.name,
        email: coach.email!,
        subscriptionStatus: subscriptionStatusFromAccess(access.allowed)
      };
      setTokens(
        signAccessToken(payload),
        signRefreshToken({ id: coach.coach_id, role: UserRole.COACH }),
        authCookieName(UserRole.COACH)
      );
      return ok({
        role: UserRole.COACH,
        name: coach.name,
        academy_name: coach.academy.name
      });
    }

    const user = await prisma.user.findFirst({
      where: { email, is_deleted: false },
      include: { academy: true }
    });
    if (!user || !(await verifyPassword(body.password, user.password_hash))) {
      return fail('Invalid email or password', 'INVALID_CREDENTIALS', 401);
    }
    if (user.academy) {
      const access = resolveAcademyAccess(
        user.academy.status,
        user.academy.subscription_expires_at
      );
      if (!access.allowed) return fail(access.reason!, 'SUBSCRIPTION_EXPIRED', 403);
    }

    const payload = {
      id: user.user_id,
      role: user.role,
      academy_id: user.academy_id,
      name: user.name,
      email: user.email,
      subscriptionStatus: 'active' as const
    };
    setTokens(
      signAccessToken(payload),
      signRefreshToken({ id: user.user_id, role: user.role }),
      authCookieName(user.role)
    );

    return ok({ role: user.role, name: user.name, academy_id: user.academy_id });
  } catch (error) {
    return handleApiError(error);
  }
}
