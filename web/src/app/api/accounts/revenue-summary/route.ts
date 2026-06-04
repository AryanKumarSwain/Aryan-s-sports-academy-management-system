import { ReceiptStatus, UserRole } from '@/generated/prisma';
import { handleApiError, ok } from '@/lib/api';
import { assertAcademyId, requireAuth } from '@/lib/require-auth';
import { prisma } from '@/lib/prisma';
import { startOfMonth, subMonths, format } from 'date-fns';

export async function GET() {
  try {
    const session = await requireAuth(UserRole.ACADEMY_ADMIN);
    const academyId = assertAcademyId(session);

    const receipts = await prisma.receipt.findMany({
      where: { academy_id: academyId, status: ReceiptStatus.COMPLETED },
      select: { amount: true, payment_date: true }
    });

    const monthStart = startOfMonth(new Date());
    const allTime = receipts.reduce((s, r) => s + Number(r.amount), 0);
    const thisMonth = receipts
      .filter((r) => r.payment_date >= monthStart)
      .reduce((s, r) => s + Number(r.amount), 0);

    const chart: { month: string; amount: number }[] = [];
    for (let i = 11; i >= 0; i--) {
      const mStart = startOfMonth(subMonths(new Date(), i));
      const mEnd = startOfMonth(subMonths(new Date(), i - 1));
      const amount = receipts
        .filter((r) => r.payment_date >= mStart && r.payment_date < mEnd)
        .reduce((s, r) => s + Number(r.amount), 0);
      chart.push({ month: format(mStart, 'MMM yyyy'), amount });
    }

    return ok({ allTime, thisMonth, chart });
  } catch (error) {
    return handleApiError(error);
  }
}
