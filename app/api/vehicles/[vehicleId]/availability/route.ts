import { NextResponse } from 'next/server';
import { inventoryService } from '@/lib/services/inventory-service';
import { AvailabilityQuerySchema } from '@/lib/validation/vehicle';
import { requireAdmin } from '@/lib/auth/rbac';
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
    const { searchParams } = new URL(request.url);

    const pickupStr = searchParams.get('pickupDate');
    const dropoffStr = searchParams.get('dropoffDate');

    if (!pickupStr && !dropoffStr) {
      const blockedRanges = await inventoryService.getBlockedDateRanges(vehicleId);
      return NextResponse.json({
        success: true,
        data: {
          vehicleId,
          blockedRanges,
        },
      });
    }

    if (!pickupStr || !dropoffStr) {
      return NextResponse.json(
        {
          success: false,
          error: 'Both pickupDate and dropoffDate query parameters are required',
        },
        { status: 400 },
      );
    }

    const validated = AvailabilityQuerySchema.parse({
      pickupDate: pickupStr,
      dropoffDate: dropoffStr,
      location: searchParams.get('location') || undefined,
    });

    const result = await inventoryService.checkAvailability(
      vehicleId,
      validated.pickupDate,
      validated.dropoffDate,
    );

    const blockedRanges = await inventoryService.getBlockedDateRanges(vehicleId);

    return NextResponse.json({
      success: true,
      data: {
        ...result,
        blockedRanges,
      },
    });
  } catch (error) {
    logger.error('Error checking availability', error);
    if (error instanceof AppError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: error.statusCode },
      );
    }
    return NextResponse.json(
      { success: false, error: 'Failed to evaluate vehicle availability' },
      { status: 400 },
    );
  }
}

export async function POST(request: Request, { params }: RouteContext) {
  try {
    const session = requireAdmin(request);
    const { vehicleId } = await params;
    const body = await request.json();

    const maintenance = await inventoryService.addMaintenanceBlock(
      { ...body, vehicleId },
      session.role,
    );

    logger.info(`Admin ${session.userId} added maintenance block for ${vehicleId}`);

    return NextResponse.json({ success: true, data: maintenance }, { status: 201 });
  } catch (error) {
    logger.error('Error creating maintenance block', error);
    if (error instanceof AppError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: error.statusCode },
      );
    }
    return NextResponse.json(
      { success: false, error: 'Failed to create maintenance block' },
      { status: 400 },
    );
  }
}
