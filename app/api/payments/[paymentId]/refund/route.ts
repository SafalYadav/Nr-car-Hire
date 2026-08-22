import { NextResponse } from 'next/server';
import { paymentStore } from '@/lib/db/payment-store';
import { bookingStore } from '@/lib/db/booking-store';
import { requireAdmin } from '@/lib/auth/rbac';
import { auditStore } from '@/lib/db/audit-store';
import { handleError, NotFoundError } from '@/lib/utils/errors';

interface RouteContext {
  params: Promise<{
    paymentId: string;
  }>;
}

export async function POST(req: Request, context: RouteContext) {
  try {
    const session = await requireAdmin(req);
    const { paymentId } = await context.params;
    const body = await req.json();
    const reason = body.reason || 'Admin initiated refund';

    let payment = await paymentStore.findByPaymentId(paymentId);
    if (!payment) {
      payment = await paymentStore.findByOrderId(paymentId);
    }

    if (!payment) {
      throw new NotFoundError(`Payment with ID "${paymentId}" not found`);
    }

    // Update payment status to REFUNDED
    const updatedPayment = await paymentStore.updateStatus(payment.razorpayOrderId, 'REFUNDED');

    // Update linked booking if found
    const booking = await bookingStore.findByRazorpayOrderId(payment.razorpayOrderId);
    if (booking) {
      await bookingStore.updateStatus(booking.id, 'REFUNDED', 'REFUNDED');
    }

    // Record in audit log
    await auditStore.create({
      adminId: session.userId,
      action: 'PAYMENT_REFUNDED',
      entity: 'Payment',
      entityId: payment.id,
      details: {
        orderId: payment.razorpayOrderId,
        paymentId: payment.razorpayPaymentId,
        amount: payment.amount,
        reason,
      },
    });

    return NextResponse.json({
      success: true,
      data: updatedPayment,
      message: 'Payment marked as REFUNDED and audit logged successfully',
    });
  } catch (error) {
    const { status, body } = handleError(error);
    return NextResponse.json(body, { status });
  }
}
