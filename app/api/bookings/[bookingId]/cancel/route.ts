import { NextResponse } from 'next/server';
import { bookingService } from '@/lib/services/booking-service';
import { getAuthSession } from '@/lib/auth/rbac';
import { handleError } from '@/lib/utils/errors';

interface RouteContext {
  params: Promise<{
    bookingId: string;
  }>;
}

export async function POST(req: Request, context: RouteContext) {
  try {
    const { bookingId } = await context.params;
    const body = await req.json();
    const session = await getAuthSession(req);

    const cancelled = await bookingService.cancelBooking(
      bookingId,
      body,
      session ? { userId: session.userId, role: session.role } : undefined,
    );

    return NextResponse.json({
      success: true,
      data: cancelled,
      message: 'Booking successfully cancelled',
    });
  } catch (error) {
    const { status, body } = handleError(error);
    return NextResponse.json(body, { status });
  }
}
