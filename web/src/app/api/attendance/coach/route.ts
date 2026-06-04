import { UserRole } from '@/generated/prisma';
import { startOfDay } from 'date-fns';
import { handleApiError, ok } from '@/lib/api';
import { writeAuditLog } from '@/lib/audit';
import { ConflictError, GeofenceError, NotFoundError } from '@/lib/errors';
import { isWithinRadius } from '@/lib/geo';
import { prisma } from '@/lib/prisma';
import { assertAcademyId, assertCoachAccess, getActorMeta, requireAuth } from '@/lib/require-auth';
import { coachAttendanceSchema, studentAttendanceBulkSchema } from '@/validations/modules';
import { NextRequest } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth(UserRole.COACH);
    const academyId = assertAcademyId(session);
    const coachId = parseInt(session.sub, 10);
    const body = coachAttendanceSchema.parse(await req.json());
    const date = startOfDay(body.date);

    if (body.status === 'PRESENT') {
      const academy = await prisma.academy.findUnique({ where: { academy_id: academyId } });
      if (academy?.latitude != null && academy?.longitude != null) {
        if (body.latitude == null || body.longitude == null) {
          throw new GeofenceError();
        }
        const within = isWithinRadius(
          body.latitude,
          body.longitude,
          Number(academy.latitude),
          Number(academy.longitude),
          academy.attendance_radius_meters
        );
        if (!within) throw new GeofenceError();
      }
    }

    const existing = await prisma.coachAttendance.findUnique({
      where: { coach_id_date: { coach_id: coachId, date } }
    });
    if (existing) throw new ConflictError('Attendance already marked for today', 'ATTENDANCE_ALREADY_SUBMITTED');

    const record = await prisma.coachAttendance.create({
      data: {
        academy_id: academyId,
        coach_id: coachId,
        date,
        status: body.status,
        latitude: body.latitude,
        longitude: body.longitude,
        remarks: body.remarks
      }
    });

    const actor = getActorMeta(session);
    await writeAuditLog({
      academyId,
      ...actor,
      action: 'MARK_COACH_ATTENDANCE',
      entityType: 'CoachAttendance',
      entityId: record.attendance_id
    });

    return ok(record, undefined, 201);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await requireAuth(UserRole.ACADEMY_ADMIN, UserRole.COACH);
    const academyId = assertAcademyId(session);
    const coachIdParam = req.nextUrl.searchParams.get('coach_id');
    const from = req.nextUrl.searchParams.get('from');
    const to = req.nextUrl.searchParams.get('to');

    if (session.role === UserRole.COACH) {
      assertCoachAccess(session, parseInt(session.sub, 10));
    }

    const coachId = coachIdParam ? parseInt(coachIdParam, 10) : session.role === UserRole.COACH ? parseInt(session.sub, 10) : undefined;

    const records = await prisma.coachAttendance.findMany({
      where: {
        academy_id: academyId,
        ...(coachId && { coach_id: coachId }),
        ...(from && to && { date: { gte: new Date(from), lte: new Date(to) } })
      },
      include: { coach: true },
      orderBy: { date: 'desc' },
      take: 100
    });

    return ok(records);
  } catch (error) {
    return handleApiError(error);
  }
}
