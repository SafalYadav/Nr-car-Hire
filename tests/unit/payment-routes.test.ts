import { describe, it, expect, beforeEach } from 'vitest';
import crypto from 'crypto';
import { POST as createOrder } from '@/app/api/payments/create-order/route';
import { POST as verifyPayment } from '@/app/api/payments/verify/route';
import { POST as handleWebhook } from '@/app/api/payments/webhook/route';
import { paymentStore } from '@/lib/db/payment-store';
import { vehicleStore } from '@/lib/db/vehicle-store';
import { paymentService } from '@/lib/services/payment-service';

describe('Payment API Endpoints (Razorpay Test Mode)', () => {
  beforeEach(() => {
    paymentStore.reset();
    vehicleStore.reset();
  });

  const vehicleId = 'v-001-camry';

  describe('POST /api/payments/create-order', () => {
    it('creates a test order successfully with authoritative pricing', async () => {
      const payload = {
        vehicleId,
        pickupDate: '2026-10-01',
        dropoffDate: '2026-10-04',
        currency: 'INR',
      };

      const req = new Request('http://localhost:3000/api/payments/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const res = await createOrder(req);
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.data.orderId).toBeTruthy();
      expect(json.data.amountMajor).toBe(267); // 3 days * 89
      expect(json.data.amount).toBe(26700);
      expect(json.data.currency).toBe('INR');
      expect(json.data.keyId).toBeTruthy();
    });

    it('rejects order creation with missing or invalid parameters', async () => {
      const payload = {
        vehicleId: 'invalid-vehicle',
        pickupDate: '2026-10-04',
        dropoffDate: '2026-10-01', // Invalid order
      };

      const req = new Request('http://localhost:3000/api/payments/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const res = await createOrder(req);
      expect(res.status).toBe(400);

      const json = await res.json();
      expect(json.success).toBe(false);
    });
  });

  describe('POST /api/payments/verify', () => {
    it('verifies a genuine payment signature successfully', async () => {
      // 1. First create an order
      const order = await paymentService.createOrder({
        vehicleId,
        pickupDate: new Date('2026-10-01'),
        dropoffDate: new Date('2026-10-04'),
      });

      const paymentId = 'pay_test_genuine_123';
      const secret = paymentService.getKeySecret();
      const signature = crypto
        .createHmac('sha256', secret)
        .update(`${order.orderId}|${paymentId}`)
        .digest('hex');

      const req = new Request('http://localhost:3000/api/payments/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          razorpay_order_id: order.orderId,
          razorpay_payment_id: paymentId,
          razorpay_signature: signature,
        }),
      });

      const res = await verifyPayment(req);
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.data.status).toBe('PAID');
    });

    it('rejects a fake or tampered signature', async () => {
      const order = await paymentService.createOrder({
        vehicleId,
        pickupDate: new Date('2026-10-01'),
        dropoffDate: new Date('2026-10-04'),
      });

      const req = new Request('http://localhost:3000/api/payments/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          razorpay_order_id: order.orderId,
          razorpay_payment_id: 'pay_tampered_123',
          razorpay_signature: 'fake_signature_abc_1234567890abcdef',
        }),
      });

      const res = await verifyPayment(req);
      expect(res.status).toBe(400);

      const json = await res.json();
      expect(json.success).toBe(false);
    });
  });

  describe('POST /api/payments/webhook', () => {
    it('processes a verified webhook successfully', async () => {
      const webhookPayload = JSON.stringify({
        event: 'payment.captured',
        payload: {
          payment: {
            entity: {
              id: 'pay_hook_123',
              order_id: 'order_hook_123',
            },
          },
        },
      });

      const secret = process.env.RAZORPAY_WEBHOOK_SECRET || 'test_webhook_secret_placeholder';
      const signature = crypto.createHmac('sha256', secret).update(webhookPayload).digest('hex');

      const req = new Request('http://localhost:3000/api/payments/webhook', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-razorpay-signature': signature,
        },
        body: webhookPayload,
      });

      const res = await handleWebhook(req);
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.handled).toBe(true);
    });

    it('rejects an unverified webhook with missing/invalid signature', async () => {
      const req = new Request('http://localhost:3000/api/payments/webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event: 'payment.captured' }),
      });

      const res = await handleWebhook(req);
      expect(res.status).toBe(400);
    });
  });
});
