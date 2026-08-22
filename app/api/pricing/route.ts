import { NextResponse } from 'next/server';
import { pricingStore } from '@/lib/db/pricing-store';
import { requireAdmin } from '@/lib/auth/rbac';
import { auditStore } from '@/lib/db/audit-store';
import { handleError } from '@/lib/utils/errors';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const all = searchParams.get('all') === 'true';
    const rules = await pricingStore.list(!all);

    return NextResponse.json({
      success: true,
      data: rules,
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

    const created = await pricingStore.create(body);

    await auditStore.create({
      adminId: session.userId,
      action: 'PRICING_RULE_CREATED',
      entity: 'PricingRule',
      entityId: created.id,
      details: { name: created.name, adjustment: created.adjustment, ruleType: created.ruleType },
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
