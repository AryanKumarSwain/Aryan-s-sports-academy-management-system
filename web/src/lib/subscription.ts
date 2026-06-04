import { AcademyStatus, SubscriptionTier } from '@/generated/prisma';
import { addDays, differenceInCalendarDays, isBefore } from 'date-fns';
import { prisma } from './prisma';
import { SubscriptionLimitError } from './errors';

export const PLAN_LIMITS: Record<
  SubscriptionTier,
  { maxCoaches: number | null; maxStudents: number | null; label: string }
> = {
  FREE: { maxCoaches: 3, maxStudents: 30, label: 'Free' },
  PRO: { maxCoaches: 6, maxStudents: 80, label: 'Pro' },
  PLUS: { maxCoaches: null, maxStudents: null, label: 'Plus' }
};

export async function getActiveSubscription(academyId: number) {
  const academy = await prisma.academy.findUnique({ where: { academy_id: academyId } });
  if (!academy) return null;
  return {
    tier: academy.subscription_tier,
    expiresAt: academy.subscription_expires_at,
    status: academy.status,
    plan: PLAN_LIMITS[academy.subscription_tier]
  };
}

export async function countActive(academyId: number, entity: 'coach' | 'student') {
  if (entity === 'coach') {
    return prisma.coach.count({
      where: { academy_id: academyId, is_deleted: false, status: 'ACTIVE' }
    });
  }
  return prisma.student.count({
    where: { academy_id: academyId, is_deleted: false, status: 'ACTIVE' }
  });
}

export async function enforceLimit(academyId: number, entity: 'coach' | 'student') {
  const sub = await getActiveSubscription(academyId);
  if (!sub) throw new SubscriptionLimitError(entity);
  const limits = PLAN_LIMITS[sub.tier];
  const max = entity === 'coach' ? limits.maxCoaches : limits.maxStudents;
  if (max === null) return;
  const current = await countActive(academyId, entity);
  if (current >= max) throw new SubscriptionLimitError(entity);
}

export function getSubscriptionExpiryWarnings(expiresAt: Date | null | undefined) {
  if (!expiresAt) return [];
  const daysLeft = differenceInCalendarDays(expiresAt, new Date());
  const warnings: { daysLeft: number; message: string }[] = [];
  for (const d of [4, 3, 2, 1]) {
    if (daysLeft === d) {
      warnings.push({
        daysLeft: d,
        message: `Your subscription expires in ${d} day${d > 1 ? 's' : ''}. Renew to avoid losing access.`
      });
    }
  }
  if (daysLeft < 0) {
    warnings.push({ daysLeft: daysLeft, message: 'Subscription expired. Access is blocked.' });
  }
  return warnings;
}

export function resolveAcademyAccess(status: AcademyStatus, expiresAt: Date | null | undefined) {
  if (status === AcademyStatus.SUSPENDED || status === AcademyStatus.EXPIRED) {
    return { allowed: false, reason: 'Academy access is suspended or expired.' };
  }
  if (expiresAt && isBefore(expiresAt, new Date())) {
    return { allowed: false, reason: 'Subscription has expired.' };
  }
  return { allowed: true };
}

export function defaultSubscriptionExpiry(tier: SubscriptionTier) {
  const days = tier === SubscriptionTier.FREE ? 30 : 365;
  return addDays(new Date(), days);
}

export function withinPlanLimits(
  tier: SubscriptionTier,
  counts: { coaches: number; students: number }
) {
  const limits = PLAN_LIMITS[tier];
  if (limits.maxCoaches !== null && counts.coaches >= limits.maxCoaches) {
    return { ok: false, field: 'coaches' as const };
  }
  if (limits.maxStudents !== null && counts.students >= limits.maxStudents) {
    return { ok: false, field: 'students' as const };
  }
  return { ok: true };
}
