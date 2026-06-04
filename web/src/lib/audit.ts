import { prisma } from './prisma';

type AuditInput = {
  academyId?: number | null;
  actorType: 'USER' | 'COACH' | 'SUPER_ADMIN';
  actorId?: number | null;
  action: string;
  entityType?: string;
  entityId?: number | null;
  metadata?: Record<string, unknown>;
  ipAddress?: string | null;
};

export async function writeAuditLog(input: AuditInput) {
  try {
    await prisma.auditLog.create({
      data: {
        academy_id: input.academyId ?? null,
        actor_type: input.actorType,
        actor_id: input.actorId ?? null,
        action: input.action,
        entity_type: input.entityType ?? null,
        entity_id: input.entityId ?? null,
        metadata: input.metadata ? JSON.stringify(input.metadata) : null,
        ip_address: input.ipAddress ?? null
      }
    });
  } catch (err) {
    console.error('[audit]', err);
  }
}
