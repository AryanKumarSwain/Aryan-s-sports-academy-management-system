import { UserRole } from '@/generated/prisma';
import { handleApiError, ok } from '@/lib/api';
import { assertAcademyId, requireAuth } from '@/lib/require-auth';
import { prisma } from '@/lib/prisma';

export async function PUT() {
  try {
    const session = await requireAuth(UserRole.ACADEMY_ADMIN, UserRole.COACH);
    const academyId = assertAcademyId(session);

    await prisma.notification.updateMany({
      where: { academy_id: academyId, is_read: false },
      data: { is_read: true }
    });

    return ok({ updated: true });
  } catch (error) {
    return handleApiError(error);
  }
}
