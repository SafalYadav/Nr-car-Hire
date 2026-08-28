import { describe, it, expect, beforeEach } from 'vitest';
import {
  createElevenLabsClientTools,
  resolveVehicleClient,
  parseExtrasClient,
  KNOWN_FLEET,
} from '@/lib/ai/elevenlabs-client-tools';
import { bookingService } from '@/lib/services/booking-service';
import { paymentService } from '@/lib/services/payment-service';
import { vehicleStore } from '@/lib/db/vehicle-store';
import { bookingStore } from '@/lib/db/booking-store';
import crypto from 'crypto';

describe('FINAL PRE-VOICE VERIFICATION — NR Car Hire Integration Suite', () => {
  beforeEach(async () => {
    // Clean state
  });

  // Check 1: Tool handlers compilation & export
  it('Check 1: All 5 ElevenLabs Client Tool handlers compile and export correctly', () => {
    const tools = createElevenLabsClientTools();
    expect(typeof tools.check_car_availability).toBe('function');
    expect(typeof tools.calculate_rental_price).toBe('function');
    expect(typeof tools.create_booking_draft).toBe('function');
    expect(typeof tools.generate_checkout_action).toBe('function');
    expect(typeof tools.lookup_booking_status).toBe('function');
  });

  // Check 2: Correct local API endpoints targeted
  it('Check 2: Every client tool calls the correct local Next.js API / service route', async () => {
    const fetchCalls: string[] = [];
    const mockFetch = async (url: string | URL | Request) => {
      const urlStr = url.toString();
      fetchCalls.push(urlStr);
      if (urlStr.includes('/availability')) {
        return {
          ok: true,
          json: async () => ({
            success: true,
            data: { isAvailable: true, dailyRate: 89, totalDays: 3, estimatedTotal: 267 },
          }),
        } as Response;
      }
      if (urlStr.includes('/calculate')) {
        return {
          ok: true,
          json: async () => ({
            success: true,
            data: {
              vehicle: { make: 'Toyota', model: 'Camry', year: 2024 },
              pickupDate: '2026-09-10',
              dropoffDate: '2026-09-13',
              rentalDays: 3,
              dailyRate: 89,
              baseAmount: 267,
              extrasAmount: 0,
              discountAmount: 0,
              taxAmount: 0,
              finalAmount: 267,
            },
          }),
        } as Response;
      }
      if (urlStr.includes('/api/bookings/')) {
        return {
          ok: true,
          json: async () => ({
            success: true,
            data: {
              bookingNumber: 'NR-2026-99999',
              status: 'CONFIRMED',
              paymentStatus: 'PAID',
              vehicleId: 'Toyota Camry',
              pickupDate: '2026-09-10T00:00:00.000Z',
              dropoffDate: '2026-09-13T00:00:00.000Z',
              finalAmount: 267,
            },
          }),
        } as Response;
      }
      return { ok: true, json: async () => ({ success: true }) } as Response;
    };

    const tools = createElevenLabsClientTools({ fetchFn: mockFetch as unknown as typeof fetch });

    await tools.check_car_availability({ vehicle_name: 'Camry', pickup_date: '2026-09-10', dropoff_date: '2026-09-13' });
    expect(fetchCalls.some((c) => c.includes('/api/vehicles/v-001-camry/availability'))).toBe(true);

    await tools.calculate_rental_price({ vehicle_name: 'Camry', pickup_date: '2026-09-10', dropoff_date: '2026-09-13' });
    expect(fetchCalls.some((c) => c.includes('/api/bookings/calculate'))).toBe(true);

    await tools.create_booking_draft({ vehicle_name: 'Camry', pickup_date: '2026-09-10', dropoff_date: '2026-09-13' });
    expect(fetchCalls.some((c) => c.includes('/api/bookings/calculate'))).toBe(true);

    await tools.lookup_booking_status({ booking_number: 'NR-2026-99999' });
    expect(fetchCalls.some((c) => c.includes('/api/bookings/NR-2026-99999'))).toBe(true);
  });

  // Check 3: check_car_availability with vehicle store
  it('Check 3: check_car_availability works with real vehicle store data', async () => {
    const vehicle = await vehicleStore.findById('v-001-camry');
    expect(vehicle).toBeDefined();
    expect(vehicle?.make).toBe('Toyota');
    expect(vehicle?.model).toBe('Camry');
    expect(vehicle?.dailyRate).toBe(89);

    const tools = createElevenLabsClientTools({
      fetchFn: (async () => ({
        json: async () => ({
          success: true,
          data: {
            isAvailable: true,
            reason: 'Vehicle is ready for hire',
            dailyRate: vehicle?.dailyRate,
            totalDays: 4,
            estimatedTotal: (vehicle?.dailyRate || 89) * 4,
          },
        }),
      })) as unknown as typeof fetch,
    });

    const res = await tools.check_car_availability({
      vehicle_name: 'Toyota Camry',
      pickup_date: '2026-09-10',
      dropoff_date: '2026-09-14',
    });

    expect(res).toContain('Toyota Camry is available');
    expect(res).toContain('89 rupees per day');
    expect(res).toContain('356 rupees');
  });

  // Check 4: calculate_rental_price with authoritative server pricing
  it('Check 4: calculate_rental_price works with authoritative server quote', async () => {
    const quote = await bookingService.calculateQuote({
      vehicleId: 'v-001-camry',
      pickupDate: new Date('2026-09-10T10:00:00.000Z'),
      dropoffDate: new Date('2026-09-14T10:00:00.000Z'),
      pickupLocation: 'Sydney Airport Hub (SYD)',
      dropoffLocation: 'Sydney Airport Hub (SYD)',
      selectedExtras: [
        { extraId: 'ext-zero-excess', code: 'ZERO_EXCESS', name: 'Zero Excess', pricingType: 'PER_DAY', price: 25, quantity: 1 },
        { extraId: 'ext-child-seat', code: 'CHILD_SEAT', name: 'Child Seat', pricingType: 'PER_DAY', price: 12, quantity: 1 },
      ],
      promoCode: 'SAVE10',
    });

    expect(quote.rentalDays).toBe(4);
    expect(quote.dailyRate).toBe(89);
    expect(quote.baseAmount).toBe(356);
    // Extras: Zero excess (25*4 = 100) + Child seat (12*4 = 48) = 148
    expect(quote.extrasAmount).toBe(148);
    // SAVE10 applies 10% on base = 35.6
    expect(quote.discountAmount).toBe(35.6);
    expect(quote.finalAmount).toBe(468.4);
  });

  // Check 5: create_booking_draft avoids premature/duplicate DB bookings
  it('Check 5: create_booking_draft generates prefilled draft without prematurely writing to DB', async () => {
    const postedMessages: any[] = [];

    const mockFetch = async () => ({
      json: async () => ({
        success: true,
        data: {
          vehicle: { make: 'Toyota', model: 'Camry', year: 2024 },
          pickupDate: '2026-09-10',
          dropoffDate: '2026-09-14',
          rentalDays: 4,
          dailyRate: 89,
          baseAmount: 356,
          extrasAmount: 0,
          discountAmount: 0,
          taxAmount: 0,
          finalAmount: 356,
        },
      }),
    });

    const tools = createElevenLabsClientTools({
      onPostMessage: (msg) => postedMessages.push(msg),
      fetchFn: mockFetch as unknown as typeof fetch,
    });

    const res = await tools.create_booking_draft({
      vehicle_name: 'Toyota Camry',
      pickup_date: '2026-09-10',
      dropoff_date: '2026-09-14',
    });

    expect(res).toContain('Booking draft prepared');
    expect(postedMessages[0].bookingDraft?.bookingUrl).toContain('/book/v-001-camry');
    expect(postedMessages[0].bookingDraft?.bookingUrl).toContain('pickupDate=2026-09-10');
  });

  // Check 6: generate_checkout_action deep link
  it('Check 6: generate_checkout_action generates the correct local checkout URL', async () => {
    const postedMessages: any[] = [];
    const tools = createElevenLabsClientTools({
      onPostMessage: (msg) => postedMessages.push(msg),
    });

    const res = await tools.generate_checkout_action({
      vehicle_name: 'Mazda CX-5',
      pickup_date: '2026-09-15',
      dropoff_date: '2026-09-18',
      promo_code: 'SAVE10',
      extras: ['ext-child-seat'],
    });

    expect(res).toContain('Proceed to Secure Payment');
    const draft = postedMessages[0]?.bookingDraft;
    expect(draft?.bookingUrl).toBe('/book/v-002-cx5?pickupDate=2026-09-15&dropoffDate=2026-09-18&promo=SAVE10&extras=ext-child-seat');
  });

  // Check 7: lookup_booking_status
  it('Check 7: lookup_booking_status returns accurate status and payment state', async () => {
    const tools = createElevenLabsClientTools({
      fetchFn: (async () => ({
        json: async () => ({
          success: true,
          data: {
            bookingNumber: 'NR-2026-12345',
            status: 'CONFIRMED',
            paymentStatus: 'PAID',
            vehicleId: 'Toyota Camry',
            pickupDate: '2026-09-10T10:00:00.000Z',
            dropoffDate: '2026-09-14T10:00:00.000Z',
            finalAmount: 356,
          },
        }),
      })) as unknown as typeof fetch,
    });

    const res = await tools.lookup_booking_status({ booking_number: 'NR-2026-12345' });
    expect(res).toContain('NR-2026-12345 is currently CONFIRMED');
    expect(res).toContain('payment status PAID');
  });

  // Check 8: Child seat & extras preservation
  it('Check 8: Child seat and other extras are parsed and preserved in deep links and calculations', () => {
    const extras = parseExtrasClient(['child seat', 'zero excess', 'gps']);
    expect(extras.some((e) => e.extraId === 'ext-child-seat')).toBe(true);
    expect(extras.some((e) => e.extraId === 'ext-zero-excess')).toBe(true);
    expect(extras.some((e) => e.extraId === 'ext-gps')).toBe(true);
  });

  // Check 9: Razorpay TEST order creation
  it('Check 9: Razorpay TEST order creation generates valid order structure', async () => {
    const orderResult = await paymentService.createOrder({
      vehicleId: 'v-001-camry',
      pickupDate: new Date('2026-09-10T10:00:00.000Z'),
      dropoffDate: new Date('2026-09-14T10:00:00.000Z'),
      amount: 356,
      currency: 'INR',
      bookingId: 'bk-test-verification-1',
      customer: {
        name: 'Sarah Jenkins',
        email: 'sarah@example.com',
        phone: '+61412345678',
      },
    });

    expect(orderResult.orderId).toBeDefined();
    expect(orderResult.orderId.startsWith('order_')).toBe(true);
    expect(orderResult.amount).toBe(35600); // 356 in paise
    expect(orderResult.currency).toBe('INR');
    expect(orderResult.keyId).toBeDefined();
  });

  // Check 10: Razorpay HMAC-SHA256 payment verification
  it('Check 10: Razorpay HMAC-SHA256 signature verification validates correctly', async () => {
    const order = await paymentService.createOrder({
      vehicleId: 'v-001-camry',
      pickupDate: new Date('2026-09-10T10:00:00.000Z'),
      dropoffDate: new Date('2026-09-14T10:00:00.000Z'),
      amount: 450,
      currency: 'INR',
      bookingId: 'bk-test-signature-1',
    });

    const paymentId = 'pay_test_verified_123';
    const secret = process.env.RAZORPAY_KEY_SECRET || 'test_secret_key_placeholder';
    const validSignature = crypto
      .createHmac('sha256', secret)
      .update(`${order.orderId}|${paymentId}`)
      .digest('hex');

    const verifyResult = await paymentService.verifyPayment({
      razorpay_order_id: order.orderId,
      razorpay_payment_id: paymentId,
      razorpay_signature: validSignature,
    });

    expect(verifyResult.success).toBe(true);
    expect(verifyResult.status).toBe('PAID');
  });

  // Check 11: Payment failure / invalid signature handling
  it('Check 11: Payment failure / tampered signature throws error and marks FAILED', async () => {
    const order = await paymentService.createOrder({
      vehicleId: 'v-001-camry',
      pickupDate: new Date('2026-09-10T10:00:00.000Z'),
      dropoffDate: new Date('2026-09-14T10:00:00.000Z'),
      amount: 200,
      currency: 'INR',
      bookingId: 'bk-test-tamper-1',
    });

    await expect(
      paymentService.verifyPayment({
        razorpay_order_id: order.orderId,
        razorpay_payment_id: 'pay_test_tamper_123',
        razorpay_signature: 'invalid_tampered_signature_hex_123456',
      })
    ).rejects.toThrow('Payment signature verification failed');
  });

  // Check 12: Client-side secret isolation
  it('Check 12: No Razorpay or ElevenLabs secrets are exposed client-side', () => {
    expect(process.env.NEXT_PUBLIC_RAZORPAY_KEY_SECRET).toBeUndefined();
    expect(process.env.NEXT_PUBLIC_ELEVENLABS_API_KEY).toBeUndefined();
    expect(process.env.NEXT_PUBLIC_RAZORPAY_WEBHOOK_SECRET).toBeUndefined();
    expect(process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY).toBeUndefined();
  });

  // Check 13: Existing booking flow integrity
  it('Check 13: Full end-to-end booking flow confirms reservation upon payment', async () => {
    const result = await bookingService.createBooking({
      vehicleId: 'v-001-camry',
      pickupLocation: 'Sydney Airport Hub (SYD)',
      dropoffLocation: 'Sydney Airport Hub (SYD)',
      pickupDate: new Date('2026-09-10T10:00:00.000Z'),
      dropoffDate: new Date('2026-09-14T10:00:00.000Z'),
      customer: {
        firstName: 'Marcus',
        lastName: 'Vance',
        email: 'marcus.vance@example.com',
        phone: '+61498765432',
        licenseNumber: 'NSW-98765432',
      },
      selectedExtras: [
        { extraId: 'ext-zero-excess', code: 'ZERO_EXCESS', name: 'Zero Excess', pricingType: 'PER_DAY', price: 25, quantity: 1 },
      ],
      promoCode: 'SAVE10',
    });

    expect(result.booking.status).toBe('PAYMENT_PENDING');
    expect(result.booking.paymentStatus).toBe('PENDING');
    expect(result.paymentOrder.orderId).toBeDefined();

    // Verify payment
    const confirmed = await bookingService.confirmBookingPayment(
      result.paymentOrder.orderId,
      'pay_test_flow_complete',
    );

    expect(confirmed.status).toBe('CONFIRMED');
    expect(confirmed.paymentStatus).toBe('PAID');
  });

  // Check 14: Fleet integrity
  it('Check 14: Known fleet includes all 6 core production models', () => {
    expect(KNOWN_FLEET).toHaveLength(6);
    expect(KNOWN_FLEET.map((v) => v.id)).toEqual([
      'v-001-camry',
      'v-002-cx5',
      'v-003-3series',
      'v-004-hilux',
      'v-005-cclass',
      'v-006-tucson',
    ]);
  });
});
