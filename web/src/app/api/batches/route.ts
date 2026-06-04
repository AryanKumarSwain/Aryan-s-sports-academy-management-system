import { UserRole, RecordStatus } from '@/generated/prisma';
import { handleApiError, ok } from '@/lib/api';
import { writeAuditLog } from '@/lib/audit';
import { NotFoundError } from '@/lib/errors';
import { prisma } from '@/lib/prisma';
import { parsePagination, paginationMeta, skipTake } from '@/lib/query';
import { assertAcademyId, getActorMeta, requireAuth } from '@/lib/require-auth';
import { batchCreateSchema, batchUpdateSchema } from '@/validations/modules';
import { NextRequest } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const session = await requireAuth(UserRole.ACADEMY_ADMIN, UserRole.COACH);
    const academyId = assertAcademyId(session);
    const { page, limit, search } = parsePagination(req);

    const where = {
      academy_id: academyId,
      status: RecordStatus.ACTIVE,
      ...(search && { name: { contains: search } })
    };

    const [batches, total] = await Promise.all([
      prisma.batch.findMany({
        where,
        include: {
          sport: true,
          coaches: { include: { coach: true } },
          _count: { select: { students: true } }
        },
        orderBy: { name: 'asc' },
        ...skipTake(page, limit)
      }),
      prisma.batch.count({ where })
    ]);

    return ok(batches, paginationMeta(total, page, limit));
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth(UserRole.ACADEMY_ADMIN);
    const academyId = assertAcademyId(session);
    const body = batchCreateSchema.parse(await req.json());

    const sport = await prisma.sport.findFirst({
      where: {
        sport_id: body.sport_id,
        OR: [{ academy_id: academyId }, { academy_id: null }]
      }
    });
    if (!sport) throw new NotFoundError('Sport not found');

    const batch = await prisma.$transaction(async (tx) => {
      const created = await tx.batch.create({
        data: {
          academy_id: academyId,
          name: body.name,
          sport_id: body.sport_id,
          start_time: body.start_time,
          end_time: body.end_time,
          timing: `${body.start_time}-${body.end_time}`,
          max_capacity: body.max_capacity,
          status: RecordStatus.ACTIVE
        }
      });

      if (body.coach_ids?.length) {
        await tx.batchCoach.createMany({
          data: body.coach_ids.map((coachId) => ({
            batch_id: created.batch_id,
            coach_id: coachId
          }))
        });
      }

      return created;
    });

    const actor = getActorMeta(session);
    await writeAuditLog({
      academyId,
      ...actor,
      action: 'CREATE_BATCH',
      entityType: 'Batch',
      entityId: batch.batch_id
    });

    return ok(batch, undefined, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
