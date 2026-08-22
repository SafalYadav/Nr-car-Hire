import { NextResponse } from 'next/server';
import { extraService } from '@/lib/services/extra-service';
import { ExtraCreateSchema } from '@/lib/validation/extra';
import { requireAdmin } from '@/lib/auth/rbac';
import { auditStore } from '@/lib/db/audit-store';
import { handleError } from '@/lib/utils/errors';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const all = searchParams.get('all') === 'true';
    const extras = all ? await extraService.listAllExtras() : await extraService.listActiveExtras();

    return NextResponse.json({
      success: true,
      data: extras,
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
    const validated = ExtraCreateSchema.parse(body);

    const created = await extraService.createExtra(validated);

    await auditStore.create({
      adminId: session.userId,
      action: 'EXTRA_CREATED',
      entity: 'Extra',
      entityId: created.id,
      details: { name: created.name, price: created.price, pricingType: created.pricingType },
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
