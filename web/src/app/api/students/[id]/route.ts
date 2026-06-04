import { UserRole, RecordStatus } from '@/generated/prisma';
import { handleApiError, ok } from '@/lib/api';
import { writeAuditLog } from '@/lib/audit';
import { NotFoundError } from '@/lib/errors';
import { prisma } from '@/lib/prisma';
import { assertAcademyId, getActorMeta, requireAuth } from '@/lib/require-auth';
import { studentUpdateSchema } from '@/validations/modules';
import { NextRequest } from 'next/server';

type Params = { params: Promise<{ id: string }> };

function fullName(first: string, middle: string | undefined, last: string) {
  return [first, middle, last].filter(Boolean).join(' ');
}

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const session = await requireAuth(UserRole.ACADEMY_ADMIN, UserRole.COACH);
    const academyId = assertAcademyId(session);
    const studentId = parseInt((await params).id, 10);

    const student = await prisma.student.findFirst({
      where: { student_id: studentId, academy_id: academyId, is_deleted: false },
      include: {
        sport: true,
        batch: true,
        enrollments: {
          include: { sport: true, duration_plan: true, batch: true, coach: true }
        },
        receipts: { orderBy: { payment_date: 'desc' }, take: 20 },
        student_attendances: { orderBy: { date: 'desc' }, take: 30 },
        performance_scores: {
          include: { attribute: true },
          orderBy: { scored_at: 'desc' },
          take: 30
        }
      }
    });
    if (!student) throw new NotFoundError('Student not found');

    return ok(student);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const session = await requireAuth(UserRole.ACADEMY_ADMIN);
    const academyId = assertAcademyId(session);
    const studentId = parseInt((await params).id, 10);
    const body = studentUpdateSchema.parse(await req.json());

    const existing = await prisma.student.findFirst({
      where: { student_id: studentId, academy_id: academyId, is_deleted: false }
    });
    if (!existing) throw new NotFoundError('Student not found');

    const name =
      body.first_name && body.last_name
        ? fullName(body.first_name, body.middle_name, body.last_name)
        : undefined;

    const student = await prisma.student.update({
      where: { student_id: studentId },
      data: {
        ...(name && { name }),
        ...(body.first_name && { first_name: body.first_name }),
        ...(body.middle_name !== undefined && { middle_name: body.middle_name }),
        ...(body.last_name && { last_name: body.last_name }),
        ...(body.phone !== undefined && { phone: body.phone }),
        ...(body.parent_name !== undefined && { parent_name: body.parent_name }),
        ...(body.parent_phone !== undefined && { parent_phone: body.parent_phone }),
        ...(body.parent_email !== undefined && { parent_email: body.parent_email }),
        ...(body.batch_id !== undefined && { batch_id: body.batch_id }),
        ...(body.status && { status: body.status as RecordStatus })
      }
    });

    const actor = getActorMeta(session);
    await writeAuditLog({
      academyId,
      ...actor,
      action: 'UPDATE_STUDENT',
      entityType: 'Student',
      entityId: studentId
    });

    return ok(student);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const session = await requireAuth(UserRole.ACADEMY_ADMIN);
    const academyId = assertAcademyId(session);
    const studentId = parseInt((await params).id, 10);

    const existing = await prisma.student.findFirst({
      where: { student_id: studentId, academy_id: academyId, is_deleted: false }
    });
    if (!existing) throw new NotFoundError('Student not found');

    await prisma.student.update({
      where: { student_id: studentId },
      data: { is_deleted: true, deleted_at: new Date(), status: RecordStatus.INACTIVE }
    });

    const actor = getActorMeta(session);
    await writeAuditLog({
      academyId,
      ...actor,
      action: 'SOFT_DELETE_STUDENT',
      entityType: 'Student',
      entityId: studentId
    });

    return ok({ deleted: true });
  } catch (error) {
    return handleApiError(error);
  }
}
