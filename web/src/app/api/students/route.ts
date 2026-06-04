import { UserRole, RecordStatus } from '@/generated/prisma';
import { handleApiError, ok } from '@/lib/api';
import { writeAuditLog } from '@/lib/audit';
import { calculateFee } from '@/lib/fee-calculator';
import { calculateNextDueDate } from '@/lib/due-date';
import { NotFoundError } from '@/lib/errors';
import { prisma } from '@/lib/prisma';
import { parsePagination, paginationMeta, skipTake } from '@/lib/query';
import { assertAcademyId, getActorMeta, requireAuth } from '@/lib/require-auth';
import { enforceLimit } from '@/lib/subscription';
import { feePreviewSchema, studentCreateSchema, studentUpdateSchema } from '@/validations/modules';
import { NextRequest } from 'next/server';

function fullName(first: string, middle: string | undefined, last: string) {
  return [first, middle, last].filter(Boolean).join(' ');
}

export async function GET(req: NextRequest) {
  try {
    const session = await requireAuth(UserRole.ACADEMY_ADMIN, UserRole.COACH);
    const academyId = assertAcademyId(session);
    const { page, limit, search } = parsePagination(req);
    const status = req.nextUrl.searchParams.get('status');

    const where = {
      academy_id: academyId,
      is_deleted: false,
      ...(status === 'inactive' ? { status: RecordStatus.INACTIVE } : { status: RecordStatus.ACTIVE }),
      ...(search && { name: { contains: search } })
    };

    const [students, total] = await Promise.all([
      prisma.student.findMany({
        where,
        include: {
          sport: true,
          batch: true,
          enrollments: { where: { is_active: true }, include: { duration_plan: true, sport: true } }
        },
        orderBy: { name: 'asc' },
        ...skipTake(page, limit)
      }),
      prisma.student.count({ where })
    ]);

    return ok(students, paginationMeta(total, page, limit));
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth(UserRole.ACADEMY_ADMIN);
    const academyId = assertAcademyId(session);
    const body = studentCreateSchema.parse(await req.json());

    await enforceLimit(academyId, 'student');

    const [sport, plan, academy] = await Promise.all([
      prisma.sport.findFirst({
        where: {
          sport_id: body.sport_id,
          OR: [{ academy_id: academyId }, { academy_id: null }]
        }
      }),
      prisma.durationPlan.findFirst({
        where: { plan_id: body.duration_plan_id, academy_id: academyId }
      }),
      prisma.academy.findUnique({ where: { academy_id: academyId } })
    ]);

    if (!sport) throw new NotFoundError('Sport not found');
    if (!plan) throw new NotFoundError('Duration plan not found');

    const registrationFee = body.registration_fee ?? Number(academy?.registration_fee_default ?? 0);
    const feeBreakdown = calculateFee({
      sports: [{ sportId: body.sport_id, baseFee: Number(sport.base_fee) }],
      planMultiplier: Number(plan.multiplier),
      registrationFee,
      additionalCharges: body.additional_charges ?? 0,
      discount: body.discount ?? 0
    });

    const joiningDate = new Date();
    const nextDueDate = calculateNextDueDate(joiningDate, plan.duration_months);
    const name = fullName(body.first_name, body.middle_name, body.last_name);

    const result = await prisma.$transaction(async (tx) => {
      const student = await tx.student.create({
        data: {
          academy_id: academyId,
          name,
          first_name: body.first_name,
          middle_name: body.middle_name,
          last_name: body.last_name,
          phone: body.phone,
          parent_name: body.parent_name,
          parent_phone: body.parent_phone,
          parent_email: body.parent_email,
          sport_id: body.sport_id,
          batch_id: body.batch_id,
          joining_date: joiningDate,
          fees_status: 'unpaid',
          status: RecordStatus.ACTIVE
        }
      });

      await tx.studentEnrollment.create({
        data: {
          academy_id: academyId,
          student_id: student.student_id,
          sport_id: body.sport_id,
          duration_plan_id: body.duration_plan_id,
          batch_id: body.batch_id,
          registration_fee: registrationFee,
          sports_fee: feeBreakdown.sportsFeeTotal,
          additional_charges: feeBreakdown.additionalCharges,
          discount: feeBreakdown.discount,
          final_fee: feeBreakdown.finalFee,
          next_due_date: nextDueDate,
          is_active: true
        }
      });

      return student;
    });

    const actor = getActorMeta(session);
    await writeAuditLog({
      academyId,
      ...actor,
      action: 'CREATE_STUDENT',
      entityType: 'Student',
      entityId: result.student_id
    });

    return ok(result, undefined, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
