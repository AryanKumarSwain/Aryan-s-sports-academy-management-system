import { AttributeRequestStatus, UserRole } from '@/generated/prisma';
import { handleApiError, ok } from '@/lib/api';
import { writeAuditLog } from '@/lib/audit';
import { NotFoundError } from '@/lib/errors';
import { prisma } from '@/lib/prisma';
import { assertAcademyId, getActorMeta, requireAuth } from '@/lib/require-auth';
import { performanceRecordSchema } from '@/validations/modules';
import { NextRequest } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const session = await requireAuth(UserRole.ACADEMY_ADMIN, UserRole.COACH);
    const academyId = assertAcademyId(session);
    const studentId = req.nextUrl.searchParams.get('student_id');

    const records = await prisma.performanceScore.findMany({
      where: {
        academy_id: academyId,
        ...(studentId && { student_id: parseInt(studentId, 10) })
      },
      include: { student: true, attribute: true, coach: true },
      orderBy: { scored_at: 'desc' },
      take: 100
    });

    return ok(records);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth(UserRole.COACH);
    const academyId = assertAcademyId(session);
    const coachId = parseInt(session.sub, 10);
    const body = performanceRecordSchema.parse(await req.json());

    const attribute = await prisma.performanceAttribute.findFirst({
      where: {
        attribute_id: body.attribute_id,
        academy_id: academyId,
        status: AttributeRequestStatus.APPROVED
      }
    });
    if (!attribute) throw new NotFoundError('Approved attribute not found');

    const record = await prisma.performanceScore.create({
      data: {
        academy_id: academyId,
        student_id: body.student_id,
        attribute_id: body.attribute_id,
        coach_id: coachId,
        score: body.score,
        notes: body.notes
      }
    });

    const actor = getActorMeta(session);
    await writeAuditLog({
      academyId,
      ...actor,
      action: 'SUBMIT_PERFORMANCE',
      entityType: 'PerformanceScore',
      entityId: record.score_id
    });

    return ok(record, undefined, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
