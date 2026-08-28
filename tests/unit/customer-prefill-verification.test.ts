import { describe, it, expect, vi } from 'vitest';
import {
  createElevenLabsClientTools,
  resolveVehicleClient,
  parseExtrasClient,
  type ClientToolMessagePayload,
} from '@/lib/ai/elevenlabs-client-tools';

describe('Customer Details Deep-Link & Prefill Verification', () => {
  it('pre-fills first name, last name, email, phone, license, extras, locations, and promo in create_booking_draft', async () => {
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
    expect(result).toContain('276.3 rupees');

    const draft = posted[0]?.bookingDraft;
    expect(draft).toBeDefined();
    expect(draft?.vehicleId).toBe('v-001-camry');
    expect(draft?.estimatedTotal).toBe(276.3);

    const parsedUrl = new URL(draft!.bookingUrl, 'https://example.com');
    expect(parsedUrl.pathname).toBe('/book/v-001-camry');
    expect(parsedUrl.searchParams.get('pickupDate')).toBe('2026-10-10');
    expect(parsedUrl.searchParams.get('dropoffDate')).toBe('2026-10-13');
    expect(parsedUrl.searchParams.get('pickupLocation')).toBe('Sydney Airport Hub (SYD)');
    expect(parsedUrl.searchParams.get('dropoffLocation')).toBe('Sydney Airport Hub (SYD)');
    expect(parsedUrl.searchParams.get('promo')).toBe('SAVE10');
    expect(parsedUrl.searchParams.get('extras')).toBe('ext-child-seat,ext-zero-excess');
    expect(parsedUrl.searchParams.get('firstName')).toBe('Sophia');
    expect(parsedUrl.searchParams.get('lastName')).toBe('Taylor');
    expect(parsedUrl.searchParams.get('email')).toBe('sophia.taylor@example.com.au');
    expect(parsedUrl.searchParams.get('phone')).toBe('+61412987654');
    expect(parsedUrl.searchParams.get('licenseNumber')).toBe('NSW-9876543');
  });

  it('pre-fills customer details in generate_checkout_action', async () => {
    const posted: ClientToolMessagePayload[] = [];
    const tools = createElevenLabsClientTools({
      onPostMessage: (msg) => posted.push(msg),
    });

    const result = await tools.generate_checkout_action({
      vehicle_name: 'BMW 3 Series',
      pickup_date: '2026-11-01',
      dropoff_date: '2026-11-05',
      pickup_location: 'Sydney Airport Hub (SYD)',
      dropoff_location: 'Sydney CBD — Central Station',
      promo_code: 'LUXURY20',
      extras: ['ext-gps'],
      first_name: 'Lucas',
      last_name: 'Miller',
      email: 'lucas.miller@example.com',
      phone: '+61433221100',
      license_number: 'VIC-445566',
    });

    expect(result).toContain('Proceed to Secure Payment');
    const draft = posted[0]?.bookingDraft;
    expect(draft).toBeDefined();

    const parsedUrl = new URL(draft!.bookingUrl, 'https://example.com');
    expect(parsedUrl.pathname).toBe('/book/v-003-3series');
    expect(parsedUrl.searchParams.get('pickupDate')).toBe('2026-11-01');
    expect(parsedUrl.searchParams.get('dropoffDate')).toBe('2026-11-05');
    expect(parsedUrl.searchParams.get('pickupLocation')).toBe('Sydney Airport Hub (SYD)');
    expect(parsedUrl.searchParams.get('dropoffLocation')).toBe('Sydney CBD — Central Station');
    expect(parsedUrl.searchParams.get('promo')).toBe('LUXURY20');
    expect(parsedUrl.searchParams.get('extras')).toBe('ext-gps');
    expect(parsedUrl.searchParams.get('firstName')).toBe('Lucas');
    expect(parsedUrl.searchParams.get('lastName')).toBe('Miller');
    expect(parsedUrl.searchParams.get('email')).toBe('lucas.miller@example.com');
    expect(parsedUrl.searchParams.get('phone')).toBe('+61433221100');
    expect(parsedUrl.searchParams.get('licenseNumber')).toBe('VIC-445566');
  });

  it('maintains backward compatibility when customer details are omitted', async () => {
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
    expect(parsedUrl.searchParams.get('email')).toBeNull();
  });
});
