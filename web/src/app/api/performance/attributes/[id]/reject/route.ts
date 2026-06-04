import { AttributeRequestStatus, UserRole } from '@/generated/prisma';
import { handleApiError, ok } from '@/lib/api';
import { NotFoundError } from '@/lib/errors';
import { prisma } from '@/lib/prisma';
import { assertAcademyId, requireAuth } from '@/lib/require-auth';
import { NextRequest } from 'next/server';

type Params = { params: Promise<{ id: string }> };

export async function PUT(_req: NextRequest, { params }: Params) {
  try {
    const session = await requireAuth(UserRole.ACADEMY_ADMIN);
    const academyId = assertAcademyId(session);
    const attributeId = parseInt((await params).id, 10);

    const attr = await prisma.performanceAttribute.findFirst({
      where: { attribute_id: attributeId, academy_id: academyId }
    });
    if (!attr) throw new NotFoundError('Attribute not found');

    const updated = await prisma.performanceAttribute.update({
      where: { attribute_id: attributeId },
      data: { status: AttributeRequestStatus.REJECTED, reviewed_at: new Date() }
    });

    return ok(updated);
  } catch (error) {
    return handleApiError(error);
  }
}
