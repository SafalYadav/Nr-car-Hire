import { NextResponse } from 'next/server';
import { inventoryService } from '@/lib/services/inventory-service';
import { requireAdmin, getAuthSession } from '@/lib/auth/rbac';
import { type VehicleQueryParams } from '@/lib/validation/vehicle';
import { AppError } from '@/lib/utils/errors';
import { logger } from '@/lib/utils/logger';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    // Extract query parameters
    const query: Partial<VehicleQueryParams> = {
      search: searchParams.get('search') || undefined,
      category: (searchParams.get('category') as VehicleQueryParams['category']) || undefined,
      minPrice: searchParams.get('minPrice') ? Number(searchParams.get('minPrice')) : undefined,
      maxPrice: searchParams.get('maxPrice') ? Number(searchParams.get('maxPrice')) : undefined,
      seats: searchParams.get('seats') ? Number(searchParams.get('seats')) : undefined,
      transmission:
        (searchParams.get('transmission') as VehicleQueryParams['transmission']) || undefined,
      fuelType: (searchParams.get('fuelType') as VehicleQueryParams['fuelType']) || undefined,
      location: searchParams.get('location') || undefined,
      sortBy: (searchParams.get('sortBy') as VehicleQueryParams['sortBy']) || undefined,
      page: searchParams.get('page') ? Number(searchParams.get('page')) : undefined,
      limit: searchParams.get('limit') ? Number(searchParams.get('limit')) : undefined,
      includeInactive: searchParams.get('includeInactive') === 'true',
    };

    const session = getAuthSession(request);
    // Only allow includeInactive if user is authenticated admin
    if (query.includeInactive && session?.role !== 'ADMIN') {
      query.includeInactive = false;
    }

    const data = await inventoryService.listVehicles(query);
    return NextResponse.json({ success: true, data });
  } catch (error) {
    logger.error('Error listing vehicles', error);
    if (error instanceof AppError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: error.statusCode },
      );
    }
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve vehicles' },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = requireAdmin(request);
    const body = await request.json();

    const created = await inventoryService.createVehicle(body, session.role);
    logger.info(`Admin ${session.userId} created vehicle ${created.id}`);

    return NextResponse.json({ success: true, data: created }, { status: 201 });
  } catch (error) {
    logger.error('Error creating vehicle', error);
    if (error instanceof AppError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: error.statusCode },
      );
    }
    return NextResponse.json(
      { success: false, error: 'Invalid vehicle creation payload' },
      { status: 400 },
    );
  }
}
