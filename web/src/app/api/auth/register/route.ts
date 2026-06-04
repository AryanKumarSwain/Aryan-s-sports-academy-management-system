import { AcademyStatus, SubscriptionTier, UserRole } from '@/generated/prisma';
import { fail, handleApiError, ok } from '@/lib/api';
import {
  ACCESS_MAX_AGE,
  REFRESH_MAX_AGE,
  authCookieName,
  cookieOptions,
  hashPassword,
  signAccessToken,
  signRefreshToken,
  ACCESS_COOKIE,
  REFRESH_COOKIE
} from '@/lib/auth';
import { sendAdminWelcomeEmail } from '@/lib/mail';
import { prisma } from '@/lib/prisma';
import { defaultSubscriptionExpiry } from '@/lib/subscription';
import { academyRegisterSchema } from '@/validations/auth';
import { generateTempPassword } from '@/lib/password';
import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = academyRegisterSchema.parse(await req.json());
    const email = body.email.trim().toLowerCase();

    const existing = await prisma.user.findFirst({
      where: { email, is_deleted: false }
    });
    if (existing) {
      return fail('Email already registered', 'EMAIL_EXISTS', 409);
    }

    const password = body.password || generateTempPassword(10);
    const password_hash = await hashPassword(password);
    const tier = body.subscription_tier;
    const expiresAt = defaultSubscriptionExpiry(tier);

    const result = await prisma.$transaction(async (tx) => {
      const academy = await tx.academy.create({
        data: {
          name: body.academy_name,
          owner_name: body.owner_name,
          email,
          phone_number: body.phone_number,
          address: body.address,
          city: body.city,
          state: body.state,
          country: body.country,
          pincode: body.pincode,
          latitude: body.latitude,
          longitude: body.longitude,
          subscription_tier: tier,
          subscription_plan: tier.toLowerCase(),
          subscription_starts_at: new Date(),
          subscription_expires_at: expiresAt,
          status: AcademyStatus.ACTIVE
        }
      });

      const user = await tx.user.create({
        data: {
          academy_id: academy.academy_id,
          name: body.owner_name,
          first_name: body.owner_name.split(' ')[0],
          email,
          password_hash,
          role: UserRole.ACADEMY_ADMIN
        }
      });

      return { academy, user };
    });

    const appUrl = process.env.APP_URL || req.nextUrl.origin;
    try {
      await sendAdminWelcomeEmail({
        email,
        name: body.owner_name,
        academyName: body.academy_name,
        password,
        loginUrl: `${appUrl}/login`
      });
    } catch (mailErr) {
      console.error('[register] welcome email failed', mailErr);
    }

    const accessToken = signAccessToken({
      id: result.user.user_id,
      role: UserRole.ACADEMY_ADMIN,
      academy_id: result.academy.academy_id,
      name: result.user.name,
      email: result.user.email,
      subscriptionStatus: 'active'
    });
    const refreshToken = signRefreshToken({
      id: result.user.user_id,
      role: UserRole.ACADEMY_ADMIN
    });

    const jar = await cookies();
    jar.set(ACCESS_COOKIE, accessToken, cookieOptions(ACCESS_MAX_AGE));
    jar.set(REFRESH_COOKIE, refreshToken, cookieOptions(REFRESH_MAX_AGE));
    jar.set(authCookieName(UserRole.ACADEMY_ADMIN), accessToken, cookieOptions(ACCESS_MAX_AGE));

    return ok(
      {
        academy_id: result.academy.academy_id,
        user_id: result.user.user_id,
        credentials_emailed: true
      },
      undefined,
      201
    );
  } catch (error) {
    return handleApiError(error);
  }
}
