import { describe, it, expect, vi } from 'vitest';
import {
  createElevenLabsClientTools,
  resolveVehicleClient,
  parseExtrasClient,
  type ClientToolMessagePayload,
} from '@/lib/ai/elevenlabs-client-tools';
import { paymentService } from '@/lib/services/payment-service';
import { bookingStore } from '@/lib/db/booking-store';
import { paymentStore } from '@/lib/db/payment-store';

describe('CRITICAL DEMO VERIFICATION — 9-Point Anti-Regresion Suite', () => {
  // Point 1: Customer details reach checkout and prefill correctly
  it('Point 1: Customer details reach checkout and prefill correctly from tool params to deep link', async () => {
    const posted: ClientToolMessagePayload[] = [];
    const mockFetch = vi.fn().mockResolvedValue({
      json: async () => ({
        success: true,
        data: {
          vehicle: { id: 'v-001-camry', make: 'Toyota', model: 'Camry', year: 2024 },
          rentalDays: 3,
          dailyRate: 89,
          baseAmount: 267,
          extrasAmount: 36,
          discountAmount: 26.7,
          taxAmount: 0,
          finalAmount: 276.3,
          promoApplied: { code: 'SAVE10', discountAmount: 26.7 },
        },
      }),
    });

    const tools = createElevenLabsClientTools({
      onPostMessage: (msg) => posted.push(msg),
      fetchFn: mockFetch as unknown as typeof fetch,
    });

    const result = await tools.create_booking_draft({
      vehicle_name: 'Toyota Camry',
      pickup_date: '2026-10-10',
      dropoff_date: '2026-10-13',
      pickup_location: 'Sydney Airport Hub (SYD)',
      dropoff_location: 'Sydney Airport Hub (SYD)',
      promo_code: 'SAVE10',
      extras: ['ext-child-seat', 'ext-zero-excess'],
      first_name: 'Sophia',
      last_name: 'Taylor',
      email: 'sophia.taylor@example.com.au',
      phone: '+61412987654',
      license_number: 'NSW-9876543',
    });

    expect(result).toContain('Sophia Taylor');
    expect(result).toContain('PAYMENT_PENDING');
    expect(result).toContain('Do NOT say payment is successful');

    const draft = posted[0]?.bookingDraft;
    expect(draft).toBeDefined();

    const parsedUrl = new URL(draft!.bookingUrl, 'https://example.com');
    expect(parsedUrl.pathname).toBe('/book/v-001-camry');
    expect(parsedUrl.searchParams.get('firstName')).toBe('Sophia');
    expect(parsedUrl.searchParams.get('lastName')).toBe('Taylor');
    expect(parsedUrl.searchParams.get('email')).toBe('sophia.taylor@example.com.au');
    expect(parsedUrl.searchParams.get('phone')).toBe('+61412987654');
    expect(parsedUrl.searchParams.get('licenseNumber')).toBe('NSW-9876543');
    expect(parsedUrl.searchParams.get('promo')).toBe('SAVE10');
    expect(parsedUrl.searchParams.get('extras')).toBe('ext-child-seat,ext-zero-excess');
  });

  // Point 2: create_booking_draft does NOT mean payment succeeded
  it('Point 2: create_booking_draft explicitly returns PAYMENT_PENDING and forbids false success claims', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      json: async () => ({
        success: true,
        data: {
          vehicle: { id: 'v-001-camry', make: 'Toyota', model: 'Camry', year: 2024 },
          rentalDays: 2,
          dailyRate: 89,
          baseAmount: 178,
          extrasAmount: 0,
          discountAmount: 0,
          taxAmount: 0,
          finalAmount: 178,
        },
      }),
    });

    const tools = createElevenLabsClientTools({
      fetchFn: mockFetch as unknown as typeof fetch,
    });

    const spokenResult = await tools.create_booking_draft({
      vehicle_name: 'Toyota Camry',
      pickup_date: '2026-10-10',
      dropoff_date: '2026-10-12',
    });

    expect(spokenResult).toContain('Status: PAYMENT_PENDING');
    expect(spokenResult).toContain('Do NOT say payment is successful');
    expect(spokenResult).not.toContain('Payment successful');
    expect(spokenResult).not.toContain('Booking confirmed');
  });

  // Point 3: generate_checkout_action does NOT mean payment succeeded
  it('Point 3: generate_checkout_action explicitly returns PAYMENT_PENDING and forbids false success claims', async () => {
    const tools = createElevenLabsClientTools();

    const spokenResult = await tools.generate_checkout_action({
      vehicle_name: 'Toyota Camry',
      pickup_date: '2026-10-10',
      dropoff_date: '2026-10-12',
    });

    expect(spokenResult).toContain('Status: PAYMENT_PENDING');
    expect(spokenResult).toContain('Do NOT say payment is successful');
  });

  // Point 4 & 5: Payment state machine: Success requires verified HMAC; failure keeps booking unconfirmed
  it('Point 4 & 5: Payment failure keeps booking unconfirmed; verified signature marks PAID/CONFIRMED', async () => {
    const { POST: createBookingRoute } = await import('@/app/api/bookings/route');
    const { POST: verifyPaymentRoute } = await import('@/app/api/payments/verify/route');

    // 1. Create a draft booking via API
    const createReq = new Request('http://localhost:3000/api/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        vehicleId: 'v-001-camry',
        pickupLocation: 'Sydney Airport Hub (SYD)',
        dropoffLocation: 'Sydney Airport Hub (SYD)',
        pickupDate: '2026-10-10T10:00:00Z',
        dropoffDate: '2026-10-12T10:00:00Z',
        customer: {
          firstName: 'Sophia',
          lastName: 'Taylor',
          email: 'sophia@example.com',
          phone: '+61412345678',
          licenseNumber: 'NSW-123456',
        },
      }),
    });

    const createRes = await createBookingRoute(createReq);
    const createJson = await createRes.json();
    expect(createRes.status).toBe(201);
    const testBookingId = createJson.data.booking.id;
    const orderId = createJson.data.paymentOrder.orderId;

    // 2. Attempt verification with an invalid signature (Payment Failure / Tamper scenario)
    const invalidReq = new Request('http://localhost:3000/api/payments/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        razorpay_order_id: orderId,
        razorpay_payment_id: 'pay_invalid_123',
        razorpay_signature: 'invalid_signature_mock',
      }),
    });

    const invalidRes = await verifyPaymentRoute(invalidReq);
    const invalidJson = await invalidRes.json();
    expect(invalidRes.status).toBe(400);
    expect(invalidJson.success).toBe(false);

    const bkg1 = await bookingStore.findById(testBookingId);
    expect(bkg1?.status).not.toBe('CONFIRMED');

    // 3. Verification with genuine signature
    const crypto = await import('crypto');
    const paymentId = 'pay_valid_999';
    const secret = paymentService.getKeySecret();
    const validSignature = crypto
      .createHmac('sha256', secret)
      .update(`${orderId}|${paymentId}`)
      .digest('hex');

    const validReq = new Request('http://localhost:3000/api/payments/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        razorpay_order_id: orderId,
        razorpay_payment_id: paymentId,
        razorpay_signature: validSignature,
      }),
    });

    const validRes = await verifyPaymentRoute(validReq);
    const validJson = await validRes.json();

    expect(validRes.status).toBe(200);
    expect(validJson.success).toBe(true);
    expect(validJson.data.status).toBe('PAID');

    const bkg2 = await bookingStore.findById(testBookingId);
    expect(bkg2?.status).toBe('CONFIRMED');
    expect(bkg2?.paymentStatus).toBe('PAID');
  });

  // Point 6: lookup_booking_status reflects live status accurately
  it('Point 6: lookup_booking_status reflects PAYMENT_PENDING vs CONFIRMED accurately', async () => {
    const mockFetch = vi.fn().mockImplementation((url: string) => {
      if (url.includes('NR-PENDING')) {
        return Promise.resolve({
          json: async () => ({
            success: true,
            data: {
              bookingNumber: 'NR-PENDING',
              vehicleId: 'Toyota Camry',
              status: 'PAYMENT_PENDING',
              paymentStatus: 'PENDING',
              finalAmount: 178,
            },
          }),
        });
      }
      return Promise.resolve({
        json: async () => ({
          success: true,
          data: {
            bookingNumber: 'NR-PAID',
            vehicleId: 'Toyota Camry',
            status: 'CONFIRMED',
            paymentStatus: 'PAID',
            finalAmount: 178,
          },
        }),
      });
    });

    const tools = createElevenLabsClientTools({
      fetchFn: mockFetch as unknown as typeof fetch,
    });

    const pendingRes = await tools.lookup_booking_status({ booking_number: 'NR-PENDING' });
    expect(pendingRes).toContain('is PAYMENT_PENDING');
    expect(pendingRes).toContain('Payment has NOT been received yet');

    const paidRes = await tools.lookup_booking_status({ booking_number: 'NR-PAID' });
    expect(paidRes).toContain('is currently CONFIRMED');
    expect(paidRes).toContain('payment status PAID');
  });

  // Point 8: Extras preservation
  it('Point 8: Extras (zero excess, child seat, GPS, roadside plus, additional driver) are parsed correctly', () => {
    const extras = parseExtrasClient([
      'zero excess',
      'child seat',
      'gps',
      'roadside plus',
      'additional driver',
    ]);
    expect(extras).toHaveLength(5);
    const ids = extras.map((e) => e.extraId);
    expect(ids).toContain('ext-zero-excess');
    expect(ids).toContain('ext-child-seat');
    expect(ids).toContain('ext-gps');
    expect(ids).toContain('ext-roadside-plus');
    expect(ids).toContain('ext-add-driver');
  });

  // Point 9: Backward compatibility
  it('Point 9: Backward compatibility is preserved when customer details are not supplied', async () => {
    const posted: ClientToolMessagePayload[] = [];
    const mockFetch = vi.fn().mockResolvedValue({
      json: async () => ({
        success: true,
        data: {
          vehicle: { id: 'v-002-cx5', make: 'Mazda', model: 'CX-5', year: 2024 },
          rentalDays: 2,
          dailyRate: 109,
          baseAmount: 218,
          extrasAmount: 0,
          discountAmount: 0,
          taxAmount: 0,
          finalAmount: 218,
        },
      }),
    });

    const tools = createElevenLabsClientTools({
      onPostMessage: (msg) => posted.push(msg),
      fetchFn: mockFetch as unknown as typeof fetch,
    });

    const result = await tools.create_booking_draft({
      vehicle_name: 'Mazda CX-5',
      pickup_date: '2026-12-01',
      dropoff_date: '2026-12-03',
    });

    expect(result).toContain('Booking draft prepared');
    const draft = posted[0]?.bookingDraft;
    const parsedUrl = new URL(draft!.bookingUrl, 'https://example.com');
    expect(parsedUrl.pathname).toBe('/book/v-002-cx5');
    expect(parsedUrl.searchParams.get('firstName')).toBeNull();
  });
});
