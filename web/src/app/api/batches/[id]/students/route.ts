import { UserRole, RecordStatus } from '@/generated/prisma';
import { handleApiError, ok } from '@/lib/api';
import { NotFoundError } from '@/lib/errors';
import { prisma } from '@/lib/prisma';
import { assertAcademyId, requireAuth } from '@/lib/require-auth';
import { NextRequest } from 'next/server';

type Params = { params: Promise<{ id: string }> };

async function getBatch(academyId: number, batchId: number) {
  const batch = await prisma.batch.findFirst({
    where: { batch_id: batchId, academy_id: academyId }
  });
  if (!batch) throw new NotFoundError('Batch not found');
  return batch;
}

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const session = await requireAuth(UserRole.ACADEMY_ADMIN, UserRole.COACH);
    const academyId = assertAcademyId(session);
    const batchId = parseInt((await params).id, 10);

    await getBatch(academyId, batchId);

    const students = await prisma.student.findMany({
      where: { batch_id: batchId, academy_id: academyId, is_deleted: false },
      orderBy: { name: 'asc' }
    });

    return ok(students);
  } catch (error) {
    return handleApiError(error);
  }
}
