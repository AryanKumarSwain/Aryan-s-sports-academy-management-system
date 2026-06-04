import { UserRole } from '@/generated/prisma';
import { handleApiError, ok } from '@/lib/api';
import { writeAuditLog } from '@/lib/audit';
import { assertAcademyId, getActorMeta, requireAuth } from '@/lib/require-auth';
import { prisma } from '@/lib/prisma';
import { settingsUpdateSchema } from '@/validations/modules';
import { NextRequest } from 'next/server';

export async function GET() {
  try {
    const session = await requireAuth(UserRole.ACADEMY_ADMIN);
    const academyId = assertAcademyId(session);

    const academy = await prisma.academy.findUnique({ where: { academy_id: academyId } });
    return ok(academy);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await requireAuth(UserRole.ACADEMY_ADMIN);
    const academyId = assertAcademyId(session);
    const body = settingsUpdateSchema.parse(await req.json());

    const academy = await prisma.academy.update({
      where: { academy_id: academyId },
      data: {
        ...(body.name && { name: body.name }),
        ...(body.owner_name !== undefined && { owner_name: body.owner_name }),
        ...(body.phone_number !== undefined && { phone_number: body.phone_number }),
        ...(body.address !== undefined && { address: body.address }),
        ...(body.city !== undefined && { city: body.city }),
        ...(body.state !== undefined && { state: body.state }),
        ...(body.country !== undefined && { country: body.country }),
        ...(body.pincode !== undefined && { pincode: body.pincode }),
        ...(body.logo_url !== undefined && { logo_url: body.logo_url }),
        ...(body.registration_fee_default !== undefined && {
          registration_fee_default: body.registration_fee_default
        }),
        ...(body.attendance_radius_meters !== undefined && {
          attendance_radius_meters: body.attendance_radius_meters
        }),
        ...(body.receipt_template !== undefined && { receipt_template: body.receipt_template })
      }
    });

    const actor = getActorMeta(session);
    await writeAuditLog({
      academyId,
      ...actor,
      action: 'UPDATE_SETTINGS',
      entityType: 'Academy',
      entityId: academyId
    });

    return ok(academy);
  } catch (error) {
    return handleApiError(error);
  }
}
