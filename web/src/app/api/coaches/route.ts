import { UserRole, RecordStatus } from '@/generated/prisma';
import { handleApiError, ok } from '@/lib/api';
import { writeAuditLog } from '@/lib/audit';
import { ConflictError } from '@/lib/errors';
import { hashPassword } from '@/lib/auth';
import { sendCoachCredentialsEmail } from '@/lib/mail';
import { generateTempPassword } from '@/lib/password';
import { prisma } from '@/lib/prisma';
import { parsePagination, paginationMeta, skipTake } from '@/lib/query';
import { assertAcademyId, getActorMeta, requireAuth } from '@/lib/require-auth';
import { enforceLimit } from '@/lib/subscription';
import { coachCreateSchema } from '@/validations/modules';
import { NextRequest } from 'next/server';

function fullName(first: string, middle: string | undefined, last: string) {
  return [first, middle, last].filter(Boolean).join(' ');
}

export async function GET(req: NextRequest) {
  try {
    const session = await requireAuth(UserRole.ACADEMY_ADMIN);
    const academyId = assertAcademyId(session);
    const { page, limit, search } = parsePagination(req);

    const where = {
      academy_id: academyId,
      is_deleted: false,
      ...(search && {
        OR: [
          { name: { contains: search } },
          { email: { contains: search } }
        ]
      })
    };

    const [coaches, total] = await Promise.all([
      prisma.coach.findMany({
        where,
        include: { batch_assignments: { include: { batch: true } } },
        orderBy: { name: 'asc' },
        ...skipTake(page, limit)
      }),
      prisma.coach.count({ where })
    ]);

    return ok(coaches, paginationMeta(total, page, limit));
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth(UserRole.ACADEMY_ADMIN);
    const academyId = assertAcademyId(session);
    const body = coachCreateSchema.parse(await req.json());
    const email = body.email.trim().toLowerCase();

    await enforceLimit(academyId, 'coach');

    const existing = await prisma.coach.findFirst({
      where: { academy_id: academyId, email, is_deleted: false }
    });
    if (existing) throw new ConflictError('Coach email already exists');

    const password = generateTempPassword(10);
    const password_hash = await hashPassword(password);
    const name = fullName(body.first_name, body.middle_name, body.last_name);

    const coach = await prisma.coach.create({
      data: {
        academy_id: academyId,
        name,
        first_name: body.first_name,
        middle_name: body.middle_name,
        last_name: body.last_name,
        email,
        phone_number: body.phone_number,
        specialization: body.specialization,
        password_hash,
        status: RecordStatus.ACTIVE
      }
    });

    try {
      await sendCoachCredentialsEmail({
        email,
        name,
        password,
        loginUrl: `${process.env.APP_URL ?? ''}/login`
      });
    } catch (err) {
      console.error('[coaches] credential email failed', err);
    }

    const actor = getActorMeta(session);
    await writeAuditLog({
      academyId,
      ...actor,
      action: 'CREATE_COACH',
      entityType: 'Coach',
      entityId: coach.coach_id
    });

    return ok(coach, undefined, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
