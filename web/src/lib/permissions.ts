import { UserRole } from '@/generated/prisma';

export const PERMISSIONS = {
  SUPER_ADMIN: {
    academies: ['view', 'activate', 'deactivate'] as const,
    subscriptions: ['view', 'manage'] as const,
    analytics: ['view'] as const
  },
  ACADEMY_ADMIN: {
    sports: ['create', 'edit', 'delete', 'view'] as const,
    plans: ['create', 'edit', 'delete', 'view'] as const,
    batches: ['create', 'edit', 'delete', 'view'] as const,
    coaches: ['create', 'edit', 'delete', 'view'] as const,
    students: ['create', 'edit', 'softDelete', 'view'] as const,
    accounts: ['create', 'view'] as const,
    attendance: ['view'] as const,
    performance: ['view'] as const,
    reports: ['generate', 'export'] as const,
    settings: ['edit'] as const
  },
  COACH: {
    attendance: ['markOwn', 'markStudents'] as const,
    performance: ['submit', 'requestAttribute'] as const,
    students: ['view'] as const,
    accounts: ['uploadProof'] as const
  }
} as const;

type AdminResource = keyof typeof PERMISSIONS.ACADEMY_ADMIN;
type AdminAction = (typeof PERMISSIONS.ACADEMY_ADMIN)[AdminResource][number];
type CoachResource = keyof typeof PERMISSIONS.COACH;
type CoachAction = (typeof PERMISSIONS.COACH)[CoachResource][number];

export function canAdmin(role: UserRole, resource: AdminResource, action: AdminAction): boolean {
  if (role === UserRole.SUPER_ADMIN) return true;
  if (role !== UserRole.ACADEMY_ADMIN) return false;
  return (PERMISSIONS.ACADEMY_ADMIN[resource] as readonly string[]).includes(action);
}

export function canCoach(role: UserRole, resource: CoachResource, action: CoachAction): boolean {
  if (role === UserRole.ACADEMY_ADMIN || role === UserRole.SUPER_ADMIN) return true;
  if (role !== UserRole.COACH) return false;
  return (PERMISSIONS.COACH[resource] as readonly string[]).includes(action);
}

export function roleHomePath(role: UserRole) {
  switch (role) {
    case UserRole.SUPER_ADMIN:
      return '/super-admin/dashboard';
    case UserRole.COACH:
      return '/coach/dashboard';
    default:
      return '/admin/dashboard';
  }
}

/** Dashboard route group paths (spec) — redirect targets */
export function roleDashboardPath(role: UserRole) {
  switch (role) {
    case UserRole.SUPER_ADMIN:
      return '/dashboard/super-admin/overview';
    case UserRole.COACH:
      return '/dashboard/coach/overview';
    default:
      return '/dashboard/admin/overview';
  }
}
