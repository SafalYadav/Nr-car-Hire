import { NextResponse } from 'next/server';
import { paymentService } from '@/lib/services/payment-service';
import { AppError } from '@/lib/utils/errors';
import { logger } from '@/lib/utils/logger';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const orderData = await paymentService.createOrder(body);

    return NextResponse.json({
      success: true,
      data: orderData,
    });
  } catch (error) {
    logger.error('Error creating Razorpay order', error);
    if (error instanceof AppError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: error.statusCode },
      );
    }
    return NextResponse.json(
      { success: false, error: 'Failed to create payment order' },
      { status: 400 },
    );
  }
}
