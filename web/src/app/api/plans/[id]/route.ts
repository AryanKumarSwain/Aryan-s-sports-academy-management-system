import { UserRole, RecordStatus } from '@/generated/prisma';
import { handleApiError, ok } from '@/lib/api';
import { writeAuditLog } from '@/lib/audit';
import { NotFoundError } from '@/lib/errors';
import { prisma } from '@/lib/prisma';
import { assertAcademyId, getActorMeta, requireAuth } from '@/lib/require-auth';
import { planUpdateSchema } from '@/validations/modules';
import { NextRequest } from 'next/server';

type Params = { params: Promise<{ id: string }> };

export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const session = await requireAuth(UserRole.ACADEMY_ADMIN);
    const academyId = assertAcademyId(session);
    const planId = parseInt((await params).id, 10);
    const body = planUpdateSchema.parse(await req.json());

    const existing = await prisma.durationPlan.findFirst({
      where: { plan_id: planId, academy_id: academyId }
    });
    if (!existing) throw new NotFoundError('Plan not found');

    const plan = await prisma.durationPlan.update({
      where: { plan_id: planId },
      data: {
        ...(body.name && { name: body.name }),
        ...(body.duration_months && { duration_months: body.duration_months }),
        ...(body.multiplier !== undefined && { multiplier: body.multiplier }),
        ...(body.status && { status: body.status as RecordStatus })
      }
    });

    const actor = getActorMeta(session);
    await writeAuditLog({
      academyId,
      ...actor,
      action: 'UPDATE_PLAN',
      entityType: 'DurationPlan',
      entityId: planId
    });

    return ok(plan);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const session = await requireAuth(UserRole.ACADEMY_ADMIN);
    const academyId = assertAcademyId(session);
    const planId = parseInt((await params).id, 10);

    const existing = await prisma.durationPlan.findFirst({
      where: { plan_id: planId, academy_id: academyId }
    });
    if (!existing) throw new NotFoundError('Plan not found');

    await prisma.durationPlan.update({
      where: { plan_id: planId },
      data: { status: RecordStatus.INACTIVE }
    });

    return ok({ deleted: true });
  } catch (error) {
    return handleApiError(error);
  }
}
