import { ReceiptStatus, UserRole } from '@/generated/prisma';
import { handleApiError, ok } from '@/lib/api';
import { writeAuditLog } from '@/lib/audit';
import { NotFoundError } from '@/lib/errors';
import { prisma } from '@/lib/prisma';
import { parsePagination, paginationMeta, skipTake } from '@/lib/query';
import { assertAcademyId, getActorMeta, requireAuth } from '@/lib/require-auth';
import { receiptCreateSchema } from '@/validations/modules';
import { startOfMonth } from 'date-fns';
import { NextRequest } from 'next/server';

function generateReceiptNumber(academyId: number) {
  const ts = Date.now().toString(36).toUpperCase();
  return `RCP-${academyId}-${ts}`;
}

export async function GET(req: NextRequest) {
  try {
    const session = await requireAuth(UserRole.ACADEMY_ADMIN, UserRole.COACH);
    const academyId = assertAcademyId(session);
    const { page, limit } = parsePagination(req);

    const where = { academy_id: academyId };
    const [receipts, total] = await Promise.all([
      prisma.receipt.findMany({
        where,
        include: { student: true },
        orderBy: { payment_date: 'desc' },
        ...skipTake(page, limit)
      }),
      prisma.receipt.count({ where })
    ]);

    return ok(receipts, paginationMeta(total, page, limit));
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth(UserRole.ACADEMY_ADMIN);
    const academyId = assertAcademyId(session);
    const body = receiptCreateSchema.parse(await req.json());

    const student = await prisma.student.findFirst({
      where: { student_id: body.student_id, academy_id: academyId, is_deleted: false }
    });
    if (!student) throw new NotFoundError('Student not found');

    const finalAmount = Math.max(0, body.amount + body.additional_charges - body.discount);

    const receipt = await prisma.receipt.create({
      data: {
        receipt_number: generateReceiptNumber(academyId),
        academy_id: academyId,
        student_id: body.student_id,
        amount: finalAmount,
        discount: body.discount,
        additional_charges: body.additional_charges,
        payment_date: body.payment_date ?? new Date(),
        method: body.method,
        remarks: body.remarks,
        status: ReceiptStatus.COMPLETED,
        approved_by_user_id: parseInt(session.sub, 10)
      }
    });

    await prisma.student.update({
      where: { student_id: body.student_id },
      data: { fees_status: 'paid' }
    });

    const actor = getActorMeta(session);
    await writeAuditLog({
      academyId,
      ...actor,
      action: 'CREATE_RECEIPT',
      entityType: 'Receipt',
      entityId: receipt.receipt_id
    });

    return ok(receipt, undefined, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
