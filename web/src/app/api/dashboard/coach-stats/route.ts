import { UserRole, RecordStatus } from '@/generated/prisma';
import { startOfDay } from 'date-fns';
import { handleApiError, ok } from '@/lib/api';
import { prisma } from '@/lib/prisma';
import { assertAcademyId, requireAuth } from '@/lib/require-auth';

export async function GET() {
  try {
    const session = await requireAuth(UserRole.COACH);
    const academyId = assertAcademyId(session);
    const coachId = parseInt(session.sub, 10);
    const today = startOfDay(new Date());

    const batchAssignments = await prisma.batchCoach.findMany({
      where: { coach_id: coachId },
      include: {
        batch: {
          include: {
            sport: true,
            students: { where: { is_deleted: false, status: RecordStatus.ACTIVE } }
          }
        }
      }
    });

    const todayBatches = batchAssignments.map((ba) => ba.batch);
    const todayStudents = todayBatches.reduce((s, b) => s + b.students.length, 0);

    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const attendances = await prisma.coachAttendance.findMany({
      where: { coach_id: coachId, date: { gte: monthStart } }
    });

    const myAttendanceThisMonth = {
      present: attendances.filter((a) => a.status === 'PRESENT').length,
      absent: attendances.filter((a) => a.status === 'ABSENT').length,
      late: attendances.filter((a) => a.status === 'LATE').length
    };

    const performanceToday = await prisma.performanceScore.count({
      where: { coach_id: coachId, scored_at: { gte: today } }
    });

    const notifications = await prisma.notification.findMany({
      where: { academy_id: academyId, is_read: false },
      orderBy: { created_at: 'desc' },
      take: 10
    });

    const pendingEnrollments = await prisma.studentEnrollment.findMany({
      where: {
        academy_id: academyId,
        coach_id: coachId,
        is_active: true,
        next_due_date: { lte: today }
      },
      include: { student: true },
      take: 20
    });

    const pendingFees = pendingEnrollments.map((e) => ({
      studentId: e.student_id,
      name: e.student.name,
      amount: Number(e.final_fee) - Number(e.paid_amount)
    }));

    return ok({
      todayBatches,
      todayStudents,
      pendingFees,
      myAttendanceThisMonth,
      performanceSubmittedToday: performanceToday > 0,
      upcomingSessions: todayBatches,
      notifications
    });
  } catch (error) {
    return handleApiError(error);
  }
}
