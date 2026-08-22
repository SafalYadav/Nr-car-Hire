import { describe, it, expect, beforeEach } from 'vitest';
import { POST as calculateQuoteRoute } from '@/app/api/bookings/calculate/route';
import { GET as getBookingsRoute, POST as createBookingRoute } from '@/app/api/bookings/route';
import { GET as getSingleBookingRoute } from '@/app/api/bookings/[bookingId]/route';
import { POST as cancelBookingRoute } from '@/app/api/bookings/[bookingId]/cancel/route';
import { POST as validatePromoRoute } from '@/app/api/discounts/validate/route';
import { bookingStore } from '@/lib/db/booking-store';
import { discountStore } from '@/lib/db/discount-store';
import { vehicleStore } from '@/lib/db/vehicle-store';

describe('Booking & Discount API Route Handlers', () => {
  beforeEach(() => {
    bookingStore.reset();
    discountStore.reset();
    vehicleStore.reset();
  });

  const vehicleId = 'v-001-camry';

  it('POST /api/bookings/calculate returns authoritative price calculation', async () => {
    const req = new Request('http://localhost:3000/api/bookings/calculate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        vehicleId,
        pickupLocation: 'Sydney Airport Hub (SYD)',
        dropoffLocation: 'Sydney Airport Hub (SYD)',
        pickupDate: '2026-11-10T10:00:00Z',
        dropoffDate: '2026-11-13T10:00:00Z',
        selectedExtras: [],
        promoCode: 'SAVE10',
      }),
    });

    const res = await calculateQuoteRoute(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data.rentalDays).toBe(3);
    expect(json.data.baseAmount).toBe(267);
    expect(json.data.discountAmount).toBe(26.7);
    expect(json.data.finalAmount).toBe(240.3);
    expect(json.data.currency).toBe('INR');
  });

  it('POST /api/discounts/validate returns validation response', async () => {
    const req = new Request('http://localhost:3000/api/discounts/validate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code: 'SAVE10',
        vehicleId,
        category: 'Sedan',
        rentalDays: 3,
        baseAmount: 267,
      }),
    });

    const res = await validatePromoRoute(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data.isValid).toBe(true);
    expect(json.data.code).toBe('SAVE10');
    expect(json.data.discountAmount).toBe(26.7);
  });

  it('POST /api/bookings creates booking and returns Razorpay order', async () => {
    const req = new Request('http://localhost:3000/api/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        vehicleId,
        pickupLocation: 'Sydney Airport Hub (SYD)',
        dropoffLocation: 'Sydney Airport Hub (SYD)',
        pickupDate: '2026-11-20T10:00:00Z',
        dropoffDate: '2026-11-23T10:00:00Z',
        customer: {
          firstName: 'Sarah',
          lastName: 'Connor',
          email: 'sarah.connor@example.com',
          phone: '+61 400 888 999',
          licenseNumber: 'NSW-9988112',
        },
      }),
    });

    const res = await createBookingRoute(req);
    const json = await res.json();

    expect(res.status).toBe(201);
    expect(json.success).toBe(true);
    expect(json.data.booking.bookingNumber).toMatch(/^NR-202\d-\d{5}$/);
    expect(json.data.booking.status).toBe('PAYMENT_PENDING');
    expect(json.data.paymentOrder.orderId).toBeTruthy();

    const bookingId = json.data.booking.id;

    // GET /api/bookings/[bookingId] (lookup single booking)
    const singleReq = new Request(`http://localhost:3000/api/bookings/${bookingId}`);
    const singleRes = await getSingleBookingRoute(singleReq, {
      params: Promise.resolve({ bookingId }),
    });
    const singleJson = await singleRes.json();

    expect(singleRes.status).toBe(200);
    expect(singleJson.data.id).toBe(bookingId);

    // POST /api/bookings/[bookingId]/cancel (cancel)
    const cancelReq = new Request(`http://localhost:3000/api/bookings/${bookingId}/cancel`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason: 'Trip rescheduled' }),
    });
    const cancelRes = await cancelBookingRoute(cancelReq, {
      params: Promise.resolve({ bookingId }),
    });
    const cancelJson = await cancelRes.json();

    expect(cancelRes.status).toBe(200);
    expect(cancelJson.data.status).toBe('CANCELLED');
  });

  it('GET /api/bookings returns filtered list for admin or customer', async () => {
    // 1. As Admin
    const adminReq = new Request('http://localhost:3000/api/bookings', {
      headers: { 'x-admin-key': 'nr-car-hire-admin-secret-2024' },
    });
    const adminRes = await getBookingsRoute(adminReq);
    const adminJson = await adminRes.json();

    expect(adminRes.status).toBe(200);
    expect(adminJson.data.bookings).toBeDefined();

    // 2. As Customer querying by email
    const custReq = new Request(
      'http://localhost:3000/api/bookings?email=james.harrison@example.com.au',
    );
    const custRes = await getBookingsRoute(custReq);
    const custJson = await custRes.json();

    expect(custRes.status).toBe(200);
    expect(custJson.data.bookings).toBeDefined();
  });

  it('Resolves existing booking ID bk-demo-001', async () => {
    const req = new Request('http://localhost:3000/api/bookings/bk-demo-001');
    const res = await getSingleBookingRoute(req, {
      params: Promise.resolve({ bookingId: 'bk-demo-001' }),
    });
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.data.id).toBe('bk-demo-001');
    expect(json.data.status).toBe('CONFIRMED');
    expect(json.data.paymentStatus).toBe('PAID');
    expect(json.data.razorpayPaymentId).toBe('pay_demo_1001_success');
  });

  it('Returns 404 for non-existent booking ID', async () => {
    const req = new Request('http://localhost:3000/api/bookings/bk-non-existent-999');
    const res = await getSingleBookingRoute(req, {
      params: Promise.resolve({ bookingId: 'bk-non-existent-999' }),
    });
    const json = await res.json();

    expect(res.status).toBe(404);
    expect(json.success).toBe(false);
  });

  it('End-to-End: Create booking -> verify payment -> confirms booking and returns booking ID', async () => {
    const createReq = new Request('http://localhost:3000/api/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        vehicleId,
        pickupLocation: 'Sydney Airport Hub (SYD)',
        dropoffLocation: 'Sydney Airport Hub (SYD)',
        pickupDate: '2026-12-01T10:00:00Z',
        dropoffDate: '2026-12-05T10:00:00Z',
        customer: {
          firstName: 'Alice',
          lastName: 'Wonderland',
          email: 'alice@example.com',
          phone: '+61 411 222 333',
          licenseNumber: 'VIC-1234567',
        },
      }),
    });

    const createRes = await createBookingRoute(createReq);
    const createJson = await createRes.json();
    expect(createRes.status).toBe(201);
    const bookingId = createJson.data.booking.id;
    const orderId = createJson.data.paymentOrder.orderId;

    // Verify payment using PaymentService
    const { paymentService } = await import('@/lib/services/payment-service');
    const crypto = await import('crypto');
    const paymentId = 'pay_verified_test_123';
    const secret = paymentService.getKeySecret();
    const signature = crypto
      .createHmac('sha256', secret)
      .update(`${orderId}|${paymentId}`)
      .digest('hex');

    const { POST: verifyRoute } = await import('@/app/api/payments/verify/route');
    const verifyReq = new Request('http://localhost:3000/api/payments/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        razorpay_order_id: orderId,
        razorpay_payment_id: paymentId,
        razorpay_signature: signature,
      }),
    });

    const verifyRes = await verifyRoute(verifyReq);
    const verifyJson = await verifyRes.json();

    expect(verifyRes.status).toBe(200);
    expect(verifyJson.success).toBe(true);
    expect(verifyJson.data.status).toBe('PAID');
    expect(verifyJson.data.bookingId).toBe(bookingId);

    // Verify single booking route now returns CONFIRMED
    const lookupReq = new Request(`http://localhost:3000/api/bookings/${bookingId}`);
    const lookupRes = await getSingleBookingRoute(lookupReq, {
      params: Promise.resolve({ bookingId }),
    });
    const lookupJson = await lookupRes.json();

    expect(lookupRes.status).toBe(200);
    expect(lookupJson.data.status).toBe('CONFIRMED');
    expect(lookupJson.data.paymentStatus).toBe('PAID');
    expect(lookupJson.data.razorpayPaymentId).toBe(paymentId);
  });
});
