import { NextResponse } from 'next/server';
import { discountService } from '@/lib/services/discount-service';
import { DiscountCreateSchema } from '@/lib/validation/discount';
import { requireAdmin } from '@/lib/auth/rbac';
import { auditStore } from '@/lib/db/audit-store';
import { handleError } from '@/lib/utils/errors';

export async function GET() {
  try {
    const discounts = await discountService.listDiscounts();
    return NextResponse.json({
      success: true,
      data: discounts,
    });
  } catch (error) {
    const { status, body } = handleError(error);
    return NextResponse.json(body, { status });
  }
}

export async function POST(req: Request) {
  try {
    const session = await requireAdmin(req);
    const body = await req.json();
    const validated = DiscountCreateSchema.parse(body);

    const created = await discountService.createDiscount(validated);

    await auditStore.create({
      adminId: session.userId,
      action: 'DISCOUNT_CREATED',
      entity: 'Discount',
      entityId: created.id,
      details: { code: created.code, value: created.value, discountType: created.discountType },
    });

    return NextResponse.json(
      {
        success: true,
        data: created,
      },
      { status: 201 },
    );
  } catch (error) {
    const { status, body } = handleError(error);
    return NextResponse.json(body, { status });
  }
}
