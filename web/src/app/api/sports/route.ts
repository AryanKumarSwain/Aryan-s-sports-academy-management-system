import { UserRole, RecordStatus } from '@/generated/prisma';
import { handleApiError, ok } from '@/lib/api';
import { writeAuditLog } from '@/lib/audit';
import { ConflictError, NotFoundError } from '@/lib/errors';
import { prisma } from '@/lib/prisma';
import { assertAcademyId, getActorMeta, requireAuth } from '@/lib/require-auth';
import { sportCreateSchema, sportUpdateSchema } from '@/validations/modules';
import { NextRequest } from 'next/server';

export async function GET() {
  try {
    const session = await requireAuth(UserRole.ACADEMY_ADMIN, UserRole.COACH);
    const academyId = assertAcademyId(session);

    const [globalSports, academySports] = await Promise.all([
      prisma.sport.findMany({
        where: { academy_id: null, status: RecordStatus.ACTIVE },
        orderBy: { name: 'asc' }
      }),
      prisma.sport.findMany({
        where: { academy_id: academyId },
        orderBy: { name: 'asc' }
      })
    ]);

    return ok({
      global: globalSports,
      academy: academySports,
      all: [...globalSports, ...academySports]
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth(UserRole.ACADEMY_ADMIN);
    const academyId = assertAcademyId(session);
    const body = sportCreateSchema.parse(await req.json());

    const existing = await prisma.sport.findFirst({
      where: {
        name: body.name,
        OR: [{ academy_id: null }, { academy_id: academyId }]
      }
    });
    if (existing) throw new ConflictError('Sport already exists');

    const sport = await prisma.sport.create({
      data: {
        name: body.name,
        description: body.description,
        base_fee: body.base_fee,
        academy_id: academyId,
        is_custom: true,
        status: RecordStatus.ACTIVE
      }
    });

    const actor = getActorMeta(session);
    await writeAuditLog({
      academyId,
      ...actor,
      action: 'CREATE_SPORT',
      entityType: 'Sport',
      entityId: sport.sport_id
    });

    return ok(sport, undefined, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
