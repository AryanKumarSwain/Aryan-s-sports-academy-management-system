import { UserRole } from '@/generated/prisma';
import { startOfDay } from 'date-fns';
import { handleApiError, ok } from '@/lib/api';
import { writeAuditLog } from '@/lib/audit';
import { ConflictError, ForbiddenError, NotFoundError } from '@/lib/errors';
import { prisma } from '@/lib/prisma';
import { assertAcademyId, getActorMeta, requireAuth } from '@/lib/require-auth';
import { studentAttendanceBulkSchema } from '@/validations/modules';
import { NextRequest } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth(UserRole.COACH);
    const academyId = assertAcademyId(session);
    const coachId = parseInt(session.sub, 10);
    const body = studentAttendanceBulkSchema.parse(await req.json());
    const date = startOfDay(body.date);

    const batchCoach = await prisma.batchCoach.findFirst({
      where: { batch_id: body.batch_id, coach_id: coachId }
    });
    if (!batchCoach) throw new ForbiddenError('Not assigned to this batch');

    const batch = await prisma.batch.findFirst({
      where: { batch_id: body.batch_id, academy_id: academyId }
    });
    if (!batch) throw new NotFoundError('Batch not found');

    const existing = await prisma.studentAttendance.findFirst({
      where: { batch_id: body.batch_id, date }
    });
    if (existing) {
      throw new ConflictError('Attendance already submitted for this batch today', 'ATTENDANCE_ALREADY_SUBMITTED');
    }

    const records = await prisma.studentAttendance.createMany({
      data: body.records.map((r) => ({
        academy_id: academyId,
        batch_id: body.batch_id,
        student_id: r.student_id,
        date,
        status: r.status,
        marked_by_coach_id: coachId
      }))
    });

    const actor = getActorMeta(session);
    await writeAuditLog({
      academyId,
      ...actor,
      action: 'MARK_STUDENT_ATTENDANCE',
      entityType: 'Batch',
      entityId: body.batch_id,
      metadata: { date: date.toISOString(), count: records.count }
    });

    return ok({ created: records.count }, undefined, 201);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await requireAuth(UserRole.ACADEMY_ADMIN, UserRole.COACH);
    const academyId = assertAcademyId(session);
    const batchId = req.nextUrl.searchParams.get('batch_id');
    const dateParam = req.nextUrl.searchParams.get('date');
    const studentId = req.nextUrl.searchParams.get('student_id');

    const records = await prisma.studentAttendance.findMany({
      where: {
        academy_id: academyId,
        ...(batchId && { batch_id: parseInt(batchId, 10) }),
        ...(dateParam && { date: startOfDay(new Date(dateParam)) }),
        ...(studentId && { student_id: parseInt(studentId, 10) })
      },
      include: { student: true, batch: true, coach: true },
      orderBy: { date: 'desc' },
      take: 200
    });

    return ok(records);
  } catch (error) {
    return handleApiError(error);
  }
}
