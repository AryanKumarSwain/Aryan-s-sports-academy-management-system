import { UserRole } from '@/generated/prisma';
import { handleApiError, ok } from '@/lib/api';
import { assertAcademyId, requireAuth } from '@/lib/require-auth';
import { prisma } from '@/lib/prisma';
import { NextRequest } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const session = await requireAuth(UserRole.ACADEMY_ADMIN, UserRole.COACH, UserRole.SUPER_ADMIN);
    const unreadOnly = req.nextUrl.searchParams.get('unread') === 'true';
    const academyId = session.academy_id;

    const notifications = await prisma.notification.findMany({
      where: {
        ...(academyId && { academy_id: academyId }),
        ...(unreadOnly && { is_read: false })
      },
      orderBy: { created_at: 'desc' },
      take: 50
    });

    const unreadCount = await prisma.notification.count({
      where: {
        ...(academyId && { academy_id: academyId }),
        is_read: false
      }
    });

    return ok({ items: notifications, unreadCount });
  } catch (error) {
    return handleApiError(error);
  }
}
