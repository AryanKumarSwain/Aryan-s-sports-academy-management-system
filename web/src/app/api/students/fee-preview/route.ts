import { UserRole } from '@/generated/prisma';
import { handleApiError, ok } from '@/lib/api';
import { calculateFee } from '@/lib/fee-calculator';
import { NotFoundError } from '@/lib/errors';
import { prisma } from '@/lib/prisma';
import { assertAcademyId, requireAuth } from '@/lib/require-auth';
import { feePreviewSchema } from '@/validations/modules';
import { NextRequest } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const session = await requireAuth(UserRole.ACADEMY_ADMIN, UserRole.COACH);
    const academyId = assertAcademyId(session);
    const params = feePreviewSchema.parse(
      Object.fromEntries(req.nextUrl.searchParams.entries())
    );

    // sport_ids may come as repeated query params
    const sportIdsParam = req.nextUrl.searchParams.getAll('sport_ids');
    const sportIds =
      sportIdsParam.length > 0
        ? sportIdsParam.map((id) => parseInt(id, 10))
        : params.sport_ids;

    const [sports, plan, academy] = await Promise.all([
      prisma.sport.findMany({
        where: {
          sport_id: { in: sportIds },
          OR: [{ academy_id: academyId }, { academy_id: null }]
        }
      }),
      prisma.durationPlan.findFirst({
        where: { plan_id: params.duration_plan_id, academy_id: academyId }
      }),
      prisma.academy.findUnique({ where: { academy_id: academyId } })
    ]);

    if (sports.length !== sportIds.length) throw new NotFoundError('One or more sports not found');
    if (!plan) throw new NotFoundError('Duration plan not found');

    const registrationFee = params.registration_fee ?? Number(academy?.registration_fee_default ?? 0);
    const breakdown = calculateFee({
      sports: sports.map((s) => ({ sportId: s.sport_id, baseFee: Number(s.base_fee) })),
      planMultiplier: Number(plan.multiplier),
      registrationFee,
      additionalCharges: params.additional_charges ?? 0,
      discount: params.discount ?? 0
    });

    return ok(breakdown);
  } catch (error) {
    return handleApiError(error);
  }
}
