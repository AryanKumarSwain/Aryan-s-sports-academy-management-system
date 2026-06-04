import { AttributeRequestStatus, UserRole } from '@/generated/prisma';
import { handleApiError, ok } from '@/lib/api';
import { NotFoundError } from '@/lib/errors';
import { prisma } from '@/lib/prisma';
import { assertAcademyId, requireAuth } from '@/lib/require-auth';
import { NextRequest } from 'next/server';

type Params = { params: Promise<{ id: string }> };

async function reviewAttribute(academyId: number, attributeId: number, status: AttributeRequestStatus) {
  const attr = await prisma.performanceAttribute.findFirst({
    where: { attribute_id: attributeId, academy_id: academyId }
  });
  if (!attr) throw new NotFoundError('Attribute not found');

  return prisma.performanceAttribute.update({
    where: { attribute_id: attributeId },
    data: { status, reviewed_at: new Date() }
  });
}

export async function PUT(_req: NextRequest, { params }: Params) {
  try {
    const session = await requireAuth(UserRole.ACADEMY_ADMIN);
    const academyId = assertAcademyId(session);
    const attributeId = parseInt((await params).id, 10);

    const updated = await reviewAttribute(academyId, attributeId, AttributeRequestStatus.APPROVED);
    return ok(updated);
  } catch (error) {
    return handleApiError(error);
  }
}
