import { AttributeRequestStatus, UserRole } from '@/generated/prisma';
import { handleApiError, ok } from '@/lib/api';
import { writeAuditLog } from '@/lib/audit';
import { NotFoundError } from '@/lib/errors';
import { prisma } from '@/lib/prisma';
import { assertAcademyId, getActorMeta, requireAuth } from '@/lib/require-auth';
import { attributeRequestSchema, performanceRecordSchema } from '@/validations/modules';
import { NextRequest } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const session = await requireAuth(UserRole.ACADEMY_ADMIN, UserRole.COACH);
    const academyId = assertAcademyId(session);
    const status = req.nextUrl.searchParams.get('status') as AttributeRequestStatus | null;

    const attributes = await prisma.performanceAttribute.findMany({
      where: {
        academy_id: academyId,
        ...(status && { status })
      },
      include: { sport: true, requested_by: true },
      orderBy: { created_at: 'desc' }
    });

    return ok(attributes);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth(UserRole.COACH);
    const academyId = assertAcademyId(session);
    const coachId = parseInt(session.sub, 10);
    const body = attributeRequestSchema.parse(await req.json());

    const attribute = await prisma.performanceAttribute.create({
      data: {
        academy_id: academyId,
        sport_id: body.sport_id,
        name: body.name,
        status: AttributeRequestStatus.PENDING,
        requested_by_coach_id: coachId
      }
    });

    const actor = getActorMeta(session);
    await writeAuditLog({
      academyId,
      ...actor,
      action: 'REQUEST_ATTRIBUTE',
      entityType: 'PerformanceAttribute',
      entityId: attribute.attribute_id
    });

    return ok(attribute, undefined, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
