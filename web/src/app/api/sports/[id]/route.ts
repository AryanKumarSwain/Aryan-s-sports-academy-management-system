import { UserRole, RecordStatus } from '@/generated/prisma';
import { handleApiError, ok } from '@/lib/api';
import { writeAuditLog } from '@/lib/audit';
import { NotFoundError } from '@/lib/errors';
import { prisma } from '@/lib/prisma';
import { assertAcademyId, getActorMeta, requireAuth } from '@/lib/require-auth';
import { sportUpdateSchema } from '@/validations/modules';
import { NextRequest } from 'next/server';

type Params = { params: Promise<{ id: string }> };

async function getSport(academyId: number, sportId: number) {
  const sport = await prisma.sport.findFirst({
    where: {
      sport_id: sportId,
      OR: [{ academy_id: academyId }, { academy_id: null, is_custom: false }]
    }
  });
  if (!sport) throw new NotFoundError('Sport not found');
  return sport;
}

export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const session = await requireAuth(UserRole.ACADEMY_ADMIN);
    const academyId = assertAcademyId(session);
    const sportId = parseInt((await params).id, 10);
    const body = sportUpdateSchema.parse(await req.json());

    await getSport(academyId, sportId);

    const sport = await prisma.sport.update({
      where: { sport_id: sportId },
      data: {
        ...(body.name && { name: body.name }),
        ...(body.description !== undefined && { description: body.description }),
        ...(body.base_fee !== undefined && { base_fee: body.base_fee }),
        ...(body.status && { status: body.status as RecordStatus })
      }
    });

    const actor = getActorMeta(session);
    await writeAuditLog({
      academyId,
      ...actor,
      action: 'UPDATE_SPORT',
      entityType: 'Sport',
      entityId: sportId
    });

    return ok(sport);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const session = await requireAuth(UserRole.ACADEMY_ADMIN);
    const academyId = assertAcademyId(session);
    const sportId = parseInt((await params).id, 10);

    const sport = await prisma.sport.findFirst({
      where: { sport_id: sportId, academy_id: academyId, is_custom: true }
    });
    if (!sport) throw new NotFoundError('Sport not found');

    await prisma.sport.update({
      where: { sport_id: sportId },
      data: { status: RecordStatus.INACTIVE }
    });

    const actor = getActorMeta(session);
    await writeAuditLog({
      academyId,
      ...actor,
      action: 'DELETE_SPORT',
      entityType: 'Sport',
      entityId: sportId
    });

    return ok({ deleted: true });
  } catch (error) {
    return handleApiError(error);
  }
}
