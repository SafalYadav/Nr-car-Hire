import { NextResponse } from 'next/server';
import { bookingService } from '@/lib/services/booking-service';
import { getAuthSession } from '@/lib/auth/rbac';
import { handleError } from '@/lib/utils/errors';

interface RouteContext {
  params: Promise<{
    bookingId: string;
  }>;
}

export async function GET(req: Request, context: RouteContext) {
  try {
    const { bookingId } = await context.params;
    const session = await getAuthSession(req);

    const booking = await bookingService.getBookingById(
      bookingId,
      session ? { userId: session.userId, role: session.role } : undefined,
    );

    return NextResponse.json({
      success: true,
      data: booking,
    });
  } catch (error) {
    const { status, body } = handleError(error);
    return NextResponse.json(body, { status });
  }
}
