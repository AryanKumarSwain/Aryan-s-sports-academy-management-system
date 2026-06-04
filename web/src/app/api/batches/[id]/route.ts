import { UserRole, RecordStatus } from '@/generated/prisma';
import { handleApiError, ok } from '@/lib/api';
import { writeAuditLog } from '@/lib/audit';
import { NotFoundError } from '@/lib/errors';
import { prisma } from '@/lib/prisma';
import { assertAcademyId, getActorMeta, requireAuth } from '@/lib/require-auth';
import { batchUpdateSchema } from '@/validations/modules';
import { NextRequest } from 'next/server';

type Params = { params: Promise<{ id: string }> };

export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const session = await requireAuth(UserRole.ACADEMY_ADMIN);
    const academyId = assertAcademyId(session);
    const batchId = parseInt((await params).id, 10);
    const body = batchUpdateSchema.parse(await req.json());

    const existing = await prisma.batch.findFirst({
      where: { batch_id: batchId, academy_id: academyId }
    });
    if (!existing) throw new NotFoundError('Batch not found');

    const batch = await prisma.$transaction(async (tx) => {
      const updated = await tx.batch.update({
        where: { batch_id: batchId },
        data: {
          ...(body.name && { name: body.name }),
          ...(body.sport_id && { sport_id: body.sport_id }),
          ...(body.start_time && { start_time: body.start_time }),
          ...(body.end_time && { end_time: body.end_time }),
          ...(body.max_capacity && { max_capacity: body.max_capacity }),
          ...(body.status && { status: body.status as RecordStatus })
        }
      });

      if (body.coach_ids) {
        await tx.batchCoach.deleteMany({ where: { batch_id: batchId } });
        if (body.coach_ids.length) {
          await tx.batchCoach.createMany({
            data: body.coach_ids.map((coachId) => ({ batch_id: batchId, coach_id: coachId }))
          });
        }
      }

      return updated;
    });

    const actor = getActorMeta(session);
    await writeAuditLog({
      academyId,
      ...actor,
      action: 'UPDATE_BATCH',
      entityType: 'Batch',
      entityId: batchId
    });

    return ok(batch);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const session = await requireAuth(UserRole.ACADEMY_ADMIN);
    const academyId = assertAcademyId(session);
    const batchId = parseInt((await params).id, 10);

    const existing = await prisma.batch.findFirst({
      where: { batch_id: batchId, academy_id: academyId }
    });
    if (!existing) throw new NotFoundError('Batch not found');

    await prisma.batch.update({
      where: { batch_id: batchId },
      data: { status: RecordStatus.INACTIVE }
    });

    return ok({ deleted: true });
  } catch (error) {
    return handleApiError(error);
  }
}
