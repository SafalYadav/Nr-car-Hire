import { NextResponse } from 'next/server';
import { locationStore } from '@/lib/db/location-store';
import { requireAdmin } from '@/lib/auth/rbac';
import { auditStore } from '@/lib/db/audit-store';
import { handleError } from '@/lib/utils/errors';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const all = searchParams.get('all') === 'true';
    const locations = await locationStore.list(!all);

    return NextResponse.json({
      success: true,
      data: locations,
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

    const created = await locationStore.create(body);

    await auditStore.create({
      adminId: session.userId,
      action: 'LOCATION_CREATED',
      entity: 'Location',
      entityId: created.id,
      details: { name: created.name, code: created.code, city: created.airportOrCity },
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
