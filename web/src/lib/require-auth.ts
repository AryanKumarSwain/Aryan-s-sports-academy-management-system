import { UserRole } from '@/generated/prisma';
import { ForbiddenError, NotFoundError, UnauthorizedError } from './errors';
import { getSession, requireRole } from './session';

export async function requireAuth(...roles: UserRole[]) {
  const session = await getSession();
  if (!session) throw new UnauthorizedError();
  if (roles.length > 0) requireRole(session, ...roles);
  return session;
}

export function assertAcademyId(session: { academy_id?: number | null }): number {
  if (!session.academy_id) throw new NotFoundError('Academy not found');
  return session.academy_id;
}

export function getActorMeta(session: { sub: string; role: UserRole }) {
  const id = parseInt(session.sub, 10);
  if (session.role === UserRole.SUPER_ADMIN) {
    return { actorType: 'SUPER_ADMIN' as const, actorId: id };
  }
  if (session.role === UserRole.COACH) {
    return { actorType: 'COACH' as const, actorId: id };
  }
  return { actorType: 'USER' as const, actorId: id };
}

export function assertCoachAccess(session: { role: UserRole; sub: string }, coachId: number) {
  if (session.role === UserRole.COACH && parseInt(session.sub, 10) !== coachId) {
    throw new ForbiddenError('Cannot access another coach resource');
  }
}
