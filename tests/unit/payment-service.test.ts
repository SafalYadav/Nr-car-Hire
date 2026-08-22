import { describe, it, expect, beforeEach } from 'vitest';
import crypto from 'crypto';
import { paymentService } from '@/lib/services/payment-service';
import { paymentStore } from '@/lib/db/payment-store';
import { vehicleStore } from '@/lib/db/vehicle-store';
import { NotFoundError, AppError } from '@/lib/utils/errors';

describe('PaymentService & Razorpay Test Mode Integration', () => {
  beforeEach(() => {
    paymentStore.reset();
    vehicleStore.reset();
  });

  const vehicleId = 'v-001-camry'; // ₹89/day

  // ----------------------------------------------------
  // 1. Order Creation & Authoritative Pricing
  // ----------------------------------------------------
  describe('Order Creation & Authoritative Pricing', () => {
    it('creates an order with authoritative calculation (3 days * ₹89 = ₹267 INR)', async () => {
      const pickup = new Date('2026-10-01T10:00:00Z');
      const dropoff = new Date('2026-10-04T10:00:00Z');

      const order = await paymentService.createOrder({
        vehicleId,
        pickupDate: pickup,
        dropoffDate: dropoff,
        currency: 'INR',
      });

      expect(order).toBeDefined();
      expect(order.orderId).toBeTruthy();
      expect(order.totalDays).toBe(3);
      expect(order.amountMajor).toBe(267); // 3 * 89
      expect(order.amount).toBe(26700); // in paise
      expect(order.currency).toBe('INR');

      // Verify stored record status is CREATED
      const stored = await paymentStore.findByOrderId(order.orderId);
      expect(stored).toBeDefined();
      expect(stored?.status).toBe('CREATED');
      expect(stored?.amount).toBe(267);
    });

    it('rejects order creation for non-existent or inactive vehicles', async () => {
      await expect(
        paymentService.createOrder({
          vehicleId: 'non-existent-vehicle',
          pickupDate: new Date('2026-10-01T10:00:00Z'),
          dropoffDate: new Date('2026-10-04T10:00:00Z'),
        }),
      ).rejects.toThrow(NotFoundError);
    });

    it('rejects order creation for invalid date ordering', async () => {
      await expect(
        paymentService.createOrder({
          vehicleId,
          pickupDate: new Date('2026-10-05T10:00:00Z'),
          dropoffDate: new Date('2026-10-01T10:00:00Z'), // Dropoff before pickup
        }),
      ).rejects.toThrow();
    });

    it('rejects order creation when vehicle has a confirmed overlapping reservation', async () => {
      // Create confirmed reservation 10 Oct -> 15 Oct
      await vehicleStore.addBooking({
        id: 'existing-booking-1',
        vehicleId,
        pickupDate: new Date('2026-10-10T10:00:00Z'),
        dropoffDate: new Date('2026-10-15T10:00:00Z'),
        status: 'CONFIRMED',
      });

      // Attempt to create order for overlapping dates: 12 Oct -> 18 Oct
      await expect(
        paymentService.createOrder({
          vehicleId,
          pickupDate: new Date('2026-10-12T10:00:00Z'),
          dropoffDate: new Date('2026-10-18T10:00:00Z'),
        }),
      ).rejects.toThrow(AppError);
    });
  });

  // ----------------------------------------------------
  // 2. Server-side HMAC Signature Verification
  // ----------------------------------------------------
  describe('HMAC-SHA256 Signature Verification', () => {
    it('verifies a valid Razorpay signature and marks payment as PAID', async () => {
      const order = await paymentService.createOrder({
        vehicleId,
        pickupDate: new Date('2026-11-01T10:00:00Z'),
        dropoffDate: new Date('2026-11-04T10:00:00Z'),
      });

      const paymentId = 'pay_test_001_success';
      const secret = paymentService.getKeySecret();

      // Compute valid HMAC-SHA256 signature
      const validSignature = crypto
        .createHmac('sha256', secret)
        .update(`${order.orderId}|${paymentId}`)
        .digest('hex');

      const verification = await paymentService.verifyPayment({
        razorpay_order_id: order.orderId,
        razorpay_payment_id: paymentId,
        razorpay_signature: validSignature,
      });

      expect(verification.success).toBe(true);
      expect(verification.status).toBe('PAID');

      // Verify record in store is marked PAID
      const updatedRecord = await paymentStore.findByOrderId(order.orderId);
      expect(updatedRecord?.status).toBe('PAID');
      expect(updatedRecord?.razorpayPaymentId).toBe(paymentId);
    });

    it('rejects an invalid or tampered signature and marks payment as FAILED', async () => {
      const order = await paymentService.createOrder({
        vehicleId,
        pickupDate: new Date('2026-11-01T10:00:00Z'),
        dropoffDate: new Date('2026-11-04T10:00:00Z'),
      });

      const paymentId = 'pay_test_002_tampered';
      const forgedSignature = 'forged_invalid_signature_hex_digest_1234567890abcdef';

      await expect(
        paymentService.verifyPayment({
          razorpay_order_id: order.orderId,
          razorpay_payment_id: paymentId,
          razorpay_signature: forgedSignature,
        }),
      ).rejects.toThrow(AppError);

      // Verify payment was updated to FAILED
      const record = await paymentStore.findByOrderId(order.orderId);
      expect(record?.status).toBe('FAILED');
    });

    it('rejects verification for an unknown order ID', async () => {
      await expect(
        paymentService.verifyPayment({
          razorpay_order_id: 'order_non_existent',
          razorpay_payment_id: 'pay_test_123',
          razorpay_signature: 'signature_abc',
        }),
      ).rejects.toThrow(NotFoundError);
    });
  });

  // ----------------------------------------------------
  // 3. Webhook Signature Verification
  // ----------------------------------------------------
  describe('Webhook Signature Verification', () => {
    it('verifies signed webhook payloads correctly', () => {
      const payload = JSON.stringify({
        event: 'payment.captured',
        payload: { payment: { entity: { id: 'pay_123', order_id: 'order_123' } } },
      });
      const webhookSecret =
        process.env.RAZORPAY_WEBHOOK_SECRET || 'test_webhook_secret_placeholder';

      const validSignature = crypto
        .createHmac('sha256', webhookSecret)
        .update(payload)
        .digest('hex');

      const isValid = paymentService.verifyWebhookSignature(payload, validSignature);
      expect(isValid).toBe(true);

      const isInvalid = paymentService.verifyWebhookSignature(payload, 'wrong_signature');
      expect(isInvalid).toBe(false);
    });
  });
});
