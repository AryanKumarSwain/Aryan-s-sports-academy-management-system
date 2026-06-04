import { UserRole } from '@/generated/prisma';
import { handleApiError, ok } from '@/lib/api';
import { assertAcademyId, requireAuth } from '@/lib/require-auth';
import { prisma } from '@/lib/prisma';
import { startOfDay } from 'date-fns';

export async function GET() {
  try {
    const session = await requireAuth(UserRole.ACADEMY_ADMIN);
    const academyId = assertAcademyId(session);
    const today = startOfDay(new Date());

    const enrollments = await prisma.studentEnrollment.findMany({
      where: {
        academy_id: academyId,
        is_active: true,
        next_due_date: { lte: today }
      },
      include: {
        student: true,
        sport: true,
        duration_plan: true
      }
    });

    const pending = enrollments.map((e) => ({
      student_id: e.student_id,
      student_name: e.student.name,
      sport: e.sport.name,
      due_date: e.next_due_date,
      amount: Number(e.final_fee) - Number(e.paid_amount)
    }));

    const totalAmount = pending.reduce((s, p) => s + p.amount, 0);

    return ok({ items: pending, count: pending.length, totalAmount });
  } catch (error) {
    return handleApiError(error);
  }
}
