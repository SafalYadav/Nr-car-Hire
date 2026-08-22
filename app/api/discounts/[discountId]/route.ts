import { NextResponse } from 'next/server';
import { discountService } from '@/lib/services/discount-service';
import { DiscountUpdateSchema } from '@/lib/validation/discount';
import { requireAdmin } from '@/lib/auth/rbac';
import { auditStore } from '@/lib/db/audit-store';
import { handleError } from '@/lib/utils/errors';

interface RouteContext {
  params: Promise<{
    discountId: string;
  }>;
}

export async function PATCH(req: Request, context: RouteContext) {
  try {
    const session = await requireAdmin(req);
    const { discountId } = await context.params;
    const body = await req.json();
    const validated = DiscountUpdateSchema.parse(body);

    const updated = await discountService.updateDiscount(discountId, validated);

    await auditStore.create({
      adminId: session.userId,
      action: 'DISCOUNT_UPDATED',
      entity: 'Discount',
      entityId: discountId,
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
    const { discountId } = await context.params;

    const toggled = await discountService.toggleDiscount(discountId, false);

    await auditStore.create({
      adminId: session.userId,
      action: 'DISCOUNT_DEACTIVATED',
      entity: 'Discount',
      entityId: discountId,
    });

    return NextResponse.json({
      success: true,
      data: toggled,
      message: 'Discount promo successfully deactivated',
    });
  } catch (error) {
    const { status, body } = handleError(error);
    return NextResponse.json(body, { status });
  }
}
