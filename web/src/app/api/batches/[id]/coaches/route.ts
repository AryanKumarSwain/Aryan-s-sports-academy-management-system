import { UserRole, RecordStatus } from '@/generated/prisma';
import { handleApiError, ok } from '@/lib/api';
import { NotFoundError } from '@/lib/errors';
import { prisma } from '@/lib/prisma';
import { assertAcademyId, requireAuth } from '@/lib/require-auth';
import { NextRequest } from 'next/server';

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const session = await requireAuth(UserRole.ACADEMY_ADMIN, UserRole.COACH);
    const academyId = assertAcademyId(session);
    const batchId = parseInt((await params).id, 10);

    const batch = await prisma.batch.findFirst({
      where: { batch_id: batchId, academy_id: academyId }
    });
    if (!batch) throw new NotFoundError('Batch not found');

    const coaches = await prisma.batchCoach.findMany({
      where: { batch_id: batchId },
      include: { coach: true }
    });

    return ok(coaches.map((bc) => bc.coach));
  } catch (error) {
    return handleApiError(error);
  }
}
