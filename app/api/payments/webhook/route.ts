import { NextResponse } from 'next/server';
import { paymentService } from '@/lib/services/payment-service';
import { logger } from '@/lib/utils/logger';

export async function POST(request: Request) {
  try {
    const signature = request.headers.get('x-razorpay-signature');
    const rawBody = await request.text();

    // Verify webhook signature
    const isValid = paymentService.verifyWebhookSignature(rawBody, signature);
    if (!isValid) {
      logger.warn('Invalid Razorpay webhook signature received');
      return NextResponse.json(
        { success: false, error: 'Invalid webhook signature' },
        { status: 400 },
      );
    }

    const json = JSON.parse(rawBody);
    const result = await paymentService.handleWebhookEvent(json.event, json.payload);

    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    logger.error('Error handling Razorpay webhook', error);
    return NextResponse.json(
      { success: false, error: 'Webhook processing error' },
      { status: 500 },
    );
  }
}
