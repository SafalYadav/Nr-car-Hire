import { NextResponse } from 'next/server';
import { bookingService } from '@/lib/services/booking-service';
import { CreateBookingSchema, BookingQuerySchema } from '@/lib/validation/booking';
import { getAuthSession } from '@/lib/auth/rbac';
import { handleError } from '@/lib/utils/errors';

export async function GET(req: Request) {
  try {
    const session = await getAuthSession(req);
    const { searchParams } = new URL(req.url);

    // If Admin, allow broad search across all bookings
    if (session?.role === 'ADMIN') {
      const queryParams = BookingQuerySchema.parse({
        search: searchParams.get('search') || undefined,
        status: searchParams.get('status') || undefined,
        vehicleId: searchParams.get('vehicleId') || undefined,
        userId: searchParams.get('userId') || undefined,
        page: searchParams.get('page') || undefined,
        limit: searchParams.get('limit') || undefined,
      });

      const result = await bookingService.listAdminBookings(queryParams);
      return NextResponse.json({
        success: true,
        data: result,
      });
    }

    // If authenticated Customer or customer email provided
    const userEmail = searchParams.get('email') || session?.userId;
    if (!userEmail) {
      return NextResponse.json(
        { success: false, error: 'Authentication or email parameter required' },
        { status: 401 },
      );
    }

    const bookings = await bookingService.listUserBookings(userEmail);
    return NextResponse.json({
      success: true,
      data: {
        bookings,
        total: bookings.length,
      },
    });
  } catch (error) {
    const { status, body } = handleError(error);
    return NextResponse.json(body, { status });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const validated = CreateBookingSchema.parse(body);

    const result = await bookingService.createBooking(validated);

    return NextResponse.json(
      {
        success: true,
        data: result,
      },
      { status: 201 },
    );
  } catch (error) {
    const { status, body } = handleError(error);
    return NextResponse.json(body, { status });
  }
}
