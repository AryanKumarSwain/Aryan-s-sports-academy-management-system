import { UserRole, RecordStatus } from '@/generated/prisma';
import { handleApiError, ok } from '@/lib/api';
import { writeAuditLog } from '@/lib/audit';
import { prisma } from '@/lib/prisma';
import { assertAcademyId, getActorMeta, requireAuth } from '@/lib/require-auth';
import { planCreateSchema, planUpdateSchema } from '@/validations/modules';
import { NextRequest } from 'next/server';

export async function GET() {
  try {
    const session = await requireAuth(UserRole.ACADEMY_ADMIN, UserRole.COACH);
    const academyId = assertAcademyId(session);

    const plans = await prisma.durationPlan.findMany({
      where: { academy_id: academyId, status: RecordStatus.ACTIVE },
      orderBy: { duration_months: 'asc' }
    });

    return ok(plans);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth(UserRole.ACADEMY_ADMIN);
    const academyId = assertAcademyId(session);
    const body = planCreateSchema.parse(await req.json());

    const plan = await prisma.durationPlan.create({
      data: {
        academy_id: academyId,
        name: body.name,
        duration_months: body.duration_months,
        multiplier: body.multiplier,
        status: RecordStatus.ACTIVE
      }
    });

    const actor = getActorMeta(session);
    await writeAuditLog({
      academyId,
      ...actor,
      action: 'CREATE_PLAN',
      entityType: 'DurationPlan',
      entityId: plan.plan_id
    });

    return ok(plan, undefined, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
