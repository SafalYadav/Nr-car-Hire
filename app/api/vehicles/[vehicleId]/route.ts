import { NextResponse } from 'next/server';
import { inventoryService } from '@/lib/services/inventory-service';
import { requireAdmin, getAuthSession } from '@/lib/auth/rbac';
import { AppError } from '@/lib/utils/errors';
import { logger } from '@/lib/utils/logger';

interface RouteContext {
  params: Promise<{
    vehicleId: string;
  }>;
}

export async function GET(request: Request, { params }: RouteContext) {
  try {
    const { vehicleId } = await params;
    const session = getAuthSession(request);
    const includeInactive = session?.role === 'ADMIN';

    const vehicle = await inventoryService.getVehicleById(vehicleId, includeInactive);
    return NextResponse.json({ success: true, data: vehicle });
  } catch (error) {
    logger.error('Error fetching vehicle', error);
    if (error instanceof AppError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: error.statusCode },
      );
    }
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve vehicle details' },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request, { params }: RouteContext) {
  try {
    const session = requireAdmin(request);
    const { vehicleId } = await params;
    const body = await request.json();

    const updated = await inventoryService.updateVehicle(vehicleId, body, session.role);
    logger.info(`Admin ${session.userId} updated vehicle ${vehicleId}`);

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    logger.error('Error updating vehicle', error);
    if (error instanceof AppError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: error.statusCode },
      );
    }
    return NextResponse.json(
      { success: false, error: 'Failed to update vehicle' },
      { status: 400 },
    );
  }
}

export async function DELETE(request: Request, { params }: RouteContext) {
  try {
    const session = requireAdmin(request);
    const { vehicleId } = await params;

    const deactivated = await inventoryService.deactivateVehicle(vehicleId, session.role);
    logger.info(`Admin ${session.userId} deactivated vehicle ${vehicleId}`);

    return NextResponse.json({
      success: true,
      message: `Vehicle ${vehicleId} successfully deactivated`,
      data: deactivated,
    });
  } catch (error) {
    logger.error('Error deactivating vehicle', error);
    if (error instanceof AppError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: error.statusCode },
      );
    }
    return NextResponse.json(
      { success: false, error: 'Failed to deactivate vehicle' },
      { status: 400 },
    );
  }
}
