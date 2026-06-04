import { UserRole, RecordStatus } from '@/generated/prisma';
import { handleApiError, ok } from '@/lib/api';
import { writeAuditLog } from '@/lib/audit';
import { NotFoundError } from '@/lib/errors';
import { prisma } from '@/lib/prisma';
import { assertAcademyId, getActorMeta, requireAuth } from '@/lib/require-auth';
import { coachUpdateSchema } from '@/validations/modules';
import { NextRequest } from 'next/server';

type Params = { params: Promise<{ id: string }> };

function fullName(first: string, middle: string | undefined, last: string) {
  return [first, middle, last].filter(Boolean).join(' ');
}

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const session = await requireAuth(UserRole.ACADEMY_ADMIN);
    const academyId = assertAcademyId(session);
    const coachId = parseInt((await params).id, 10);

    const coach = await prisma.coach.findFirst({
      where: { coach_id: coachId, academy_id: academyId, is_deleted: false },
      include: {
        batch_assignments: { include: { batch: { include: { sport: true } } } },
        coach_attendances: { orderBy: { date: 'desc' }, take: 30 },
        performance_scores: { orderBy: { scored_at: 'desc' }, take: 20 }
      }
    });
    if (!coach) throw new NotFoundError('Coach not found');

    return ok(coach);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const session = await requireAuth(UserRole.ACADEMY_ADMIN);
    const academyId = assertAcademyId(session);
    const coachId = parseInt((await params).id, 10);
    const body = coachUpdateSchema.parse(await req.json());

    const existing = await prisma.coach.findFirst({
      where: { coach_id: coachId, academy_id: academyId, is_deleted: false }
    });
    if (!existing) throw new NotFoundError('Coach not found');

    const name =
      body.first_name && body.last_name
        ? fullName(body.first_name, body.middle_name, body.last_name)
        : undefined;

    const coach = await prisma.coach.update({
      where: { coach_id: coachId },
      data: {
        ...(name && { name }),
        ...(body.first_name && { first_name: body.first_name }),
        ...(body.middle_name !== undefined && { middle_name: body.middle_name }),
        ...(body.last_name && { last_name: body.last_name }),
        ...(body.email && { email: body.email.trim().toLowerCase() }),
        ...(body.phone_number !== undefined && { phone_number: body.phone_number }),
        ...(body.specialization !== undefined && { specialization: body.specialization }),
        ...(body.status && { status: body.status as RecordStatus })
      }
    });

    const actor = getActorMeta(session);
    await writeAuditLog({
      academyId,
      ...actor,
      action: 'UPDATE_COACH',
      entityType: 'Coach',
      entityId: coachId
    });

    return ok(coach);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const session = await requireAuth(UserRole.ACADEMY_ADMIN);
    const academyId = assertAcademyId(session);
    const coachId = parseInt((await params).id, 10);

    const existing = await prisma.coach.findFirst({
      where: { coach_id: coachId, academy_id: academyId, is_deleted: false }
    });
    if (!existing) throw new NotFoundError('Coach not found');

    await prisma.coach.update({
      where: { coach_id: coachId },
      data: { is_deleted: true, deleted_at: new Date(), status: RecordStatus.INACTIVE }
    });

    return ok({ deleted: true });
  } catch (error) {
    return handleApiError(error);
  }
}
