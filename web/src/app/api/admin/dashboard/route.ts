import { ReceiptStatus, RecordStatus, UserRole } from '@/generated/prisma';
import { fail, handleApiError, ok } from '@/lib/api';
import { prisma } from '@/lib/prisma';
import { getSession, requireRole } from '@/lib/session';
import { getSubscriptionExpiryWarnings } from '@/lib/subscription';
import { startOfDay, startOfMonth, addDays } from 'date-fns';

export async function GET() {
  try {
    const session = requireRole(await getSession(), UserRole.ACADEMY_ADMIN);
    const academyId = session.academy_id;
    if (!academyId) return fail('Academy not found', 'NOT_FOUND', 404);

    const today = startOfDay(new Date());
    const monthStart = startOfMonth(new Date());
    const in3Days = addDays(today, 3);

    const academy = await prisma.academy.findUnique({ where: { academy_id: academyId } });

    const [
      activeStudents,
      activeCoaches,
      activeBatches,
      receipts,
      unpaidStudents,
      coachAbsentToday
    ] = await Promise.all([
      prisma.student.count({
        where: { academy_id: academyId, is_deleted: false, status: RecordStatus.ACTIVE }
      }),
      prisma.coach.count({
        where: { academy_id: academyId, is_deleted: false, status: RecordStatus.ACTIVE }
      }),
      prisma.batch.count({ where: { academy_id: academyId, status: RecordStatus.ACTIVE } }),
      prisma.receipt.findMany({
        where: { academy_id: academyId, status: ReceiptStatus.COMPLETED },
        select: { amount: true, payment_date: true, student_id: true }
      }),
      prisma.student.count({
        where: { academy_id: academyId, is_deleted: false, fees_status: { in: ['unpaid', 'pending', 'partial'] } }
      }),
      prisma.coachAttendance.count({
        where: {
          academy_id: academyId,
          date: today,
          status: 'ABSENT'
        }
      })
    ]);

    const totalRevenue = receipts.reduce((s, r) => s + Number(r.amount), 0);
    const monthlyRevenue = receipts
      .filter((r) => r.payment_date >= monthStart)
      .reduce((s, r) => s + Number(r.amount), 0);

    const paidStudentIds = new Set(receipts.map((r) => r.student_id));

    const upcomingDues = await prisma.studentEnrollment.count({
      where: {
        academy_id: academyId,
        is_active: true,
        next_due_date: { gte: today, lte: in3Days }
      }
    });

    const overdueDues = await prisma.studentEnrollment.count({
      where: {
        academy_id: academyId,
        is_active: true,
        next_due_date: { lt: today }
      }
    });

    const subscriptionAlerts = getSubscriptionExpiryWarnings(academy?.subscription_expires_at);

    return ok({
      cards: {
        activeStudents,
        activeCoaches,
        activeBatches,
        totalRevenue,
        monthlyRevenue,
        paidStudents: paidStudentIds.size,
        unpaidStudents,
        todaysDueFees: upcomingDues,
        upcomingDueFees: upcomingDues,
        overdueFees: overdueDues
      },
      alerts: {
        coachAbsentToday,
        subscriptionExpiry: subscriptionAlerts,
        feeDueReminder: overdueDues > 0
      },
      charts: {
        revenueTrend: [],
        studentGrowth: [],
        attendanceTrend: [],
        sportsDistribution: []
      }
    });
  } catch (error) {
    return handleApiError(error);
  }
}
