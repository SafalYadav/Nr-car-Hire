import { NextResponse } from 'next/server';
import { extraService } from '@/lib/services/extra-service';
import { ExtraUpdateSchema } from '@/lib/validation/extra';
import { requireAdmin } from '@/lib/auth/rbac';
import { auditStore } from '@/lib/db/audit-store';
import { handleError } from '@/lib/utils/errors';

interface RouteContext {
  params: Promise<{
    extraId: string;
  }>;
}

export async function PATCH(req: Request, context: RouteContext) {
  try {
    const session = await requireAdmin(req);
    const { extraId } = await context.params;
    const body = await req.json();
    const validated = ExtraUpdateSchema.parse(body);

    const updated = await extraService.updateExtra(extraId, validated);

    await auditStore.create({
      adminId: session.userId,
      action: 'EXTRA_UPDATED',
      entity: 'Extra',
      entityId: extraId,
      details: validated,
    });

    return NextResponse.json({
      success: true,
      data: updated,
    });
  } catch (error) {
    const { status, body } = handleError(error);
    return NextResponse.json(body, { status });
  }
}

export async function DELETE(req: Request, context: RouteContext) {
  try {
    const session = await requireAdmin(req);
    const { extraId } = await context.params;

    const toggled = await extraService.toggleExtra(extraId, false);

    await auditStore.create({
      adminId: session.userId,
      action: 'EXTRA_DEACTIVATED',
      entity: 'Extra',
      entityId: extraId,
    });

    return NextResponse.json({
      success: true,
      data: toggled,
      message: 'Extra successfully deactivated',
    });
  } catch (error) {
    const { status, body } = handleError(error);
    return NextResponse.json(body, { status });
  }
}
