import { AcademyStatus, UserRole } from '@/generated/prisma';
import { handleApiError, ok } from '@/lib/api';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/require-auth';
import { NextRequest } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    await requireAuth(UserRole.SUPER_ADMIN);
    const status = req.nextUrl.searchParams.get('status');

    const academies = await prisma.academy.findMany({
      where: status ? { status: status as AcademyStatus } : undefined,
      orderBy: { created_at: 'desc' },
      include: {
        _count: { select: { students: true, coaches: true } }
      }
    });

    return ok(academies);
  } catch (error) {
    return handleApiError(error);
  }
}
