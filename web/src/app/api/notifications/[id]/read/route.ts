import { UserRole } from '@/generated/prisma';
import { handleApiError, ok } from '@/lib/api';
import { NotFoundError } from '@/lib/errors';
import { prisma } from '@/lib/prisma';
import { assertAcademyId, requireAuth } from '@/lib/require-auth';
import { NextRequest } from 'next/server';

type Params = { params: Promise<{ id: string }> };

export async function PUT(_req: NextRequest, { params }: Params) {
  try {
    const session = await requireAuth(UserRole.ACADEMY_ADMIN, UserRole.COACH);
    const academyId = assertAcademyId(session);
    const id = parseInt((await params).id, 10);

    const notification = await prisma.notification.findFirst({
      where: { notification_id: id, academy_id: academyId }
    });
    if (!notification) throw new NotFoundError('Notification not found');

    const updated = await prisma.notification.update({
      where: { notification_id: id },
      data: { is_read: true }
    });

    return ok(updated);
  } catch (error) {
    return handleApiError(error);
  }
}
