import { NextResponse } from 'next/server';
import { paymentService } from '@/lib/services/payment-service';
import { AppError } from '@/lib/utils/errors';
import { logger } from '@/lib/utils/logger';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = await paymentService.verifyPayment(body);

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    logger.error('Error verifying payment', error);
    if (error instanceof AppError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: error.statusCode },
      );
    }
    return NextResponse.json(
      { success: false, error: 'Payment verification failed' },
      { status: 400 },
    );
  }
}
