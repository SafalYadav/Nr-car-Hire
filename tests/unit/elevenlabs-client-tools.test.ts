import { describe, it, expect, vi } from 'vitest';
import {
  resolveVehicleClient,
  parseExtrasClient,
  createElevenLabsClientTools,
  KNOWN_FLEET,
  type ClientToolMessagePayload,
} from '@/lib/ai/elevenlabs-client-tools';

describe('ElevenLabs Client Tools', () => {
  describe('resolveVehicleClient', () => {
    it('resolves vehicles by exact ID', () => {
      const v = resolveVehicleClient('v-001-camry');
      expect(v?.id).toBe('v-001-camry');
      expect(v?.model).toBe('Camry');
    });

    it('resolves vehicles by partial name or slang', () => {
      expect(resolveVehicleClient('Toyota Camry')?.id).toBe('v-001-camry');
      expect(resolveVehicleClient('camry')?.id).toBe('v-001-camry');
      expect(resolveVehicleClient('hilux 4x4')?.id).toBe('v-004-hilux');
      expect(resolveVehicleClient('BMW 3 series')?.id).toBe('v-003-3series');
      expect(resolveVehicleClient('Mazda CX-5')?.id).toBe('v-002-cx5');
      expect(resolveVehicleClient('Mercedes C-Class')?.id).toBe('v-005-cclass');
      expect(resolveVehicleClient('Tucson Hybrid')?.id).toBe('v-006-tucson');
    });

    it('returns null for vehicles not in fleet', () => {
      expect(resolveVehicleClient('Audi R8')).toBeNull();
      expect(resolveVehicleClient('Tesla Model 3')).toBeNull();
      expect(resolveVehicleClient('')).toBeNull();
    });
  });

  describe('parseExtrasClient', () => {
    it('parses array of extra codes or names', () => {
      const extras = parseExtrasClient(['ext-zero-excess', 'child seat', 'gps']);
      expect(extras).toHaveLength(3);
      expect(extras.map((e) => e.extraId)).toEqual([
        'ext-zero-excess',
        'ext-child-seat',
        'ext-gps',
      ]);
    });

    it('parses comma-separated string of extras', () => {
      const extras = parseExtrasClient('zero excess, roadside plus');
      expect(extras).toHaveLength(2);
      expect(extras.map((e) => e.extraId)).toEqual([
        'ext-zero-excess',
        'ext-roadside-plus',
      ]);
    });

    it('returns empty array when no extras provided', () => {
      expect(parseExtrasClient(null)).toEqual([]);
      expect(parseExtrasClient(undefined)).toEqual([]);
    });
  });

  describe('Tool 1: check_car_availability', () => {
    it('handles available vehicle and posts availabilityCard', async () => {
      const posted: ClientToolMessagePayload[] = [];
      const mockFetch = vi.fn().mockResolvedValue({
        json: async () => ({
          success: true,
          data: {
            isAvailable: true,
            reason: 'Vehicle is ready for hire',
            dailyRate: 89,
            totalDays: 4,
            estimatedTotal: 356,
          },
        }),
      });

      const tools = createElevenLabsClientTools({
        onPostMessage: (msg) => posted.push(msg),
        fetchFn: mockFetch as unknown as typeof fetch,
      });

      const response = await tools.check_car_availability({
        vehicle_name: 'Toyota Camry',
        pickup_date: '2026-09-10',
        dropoff_date: '2026-09-14',
      });

      expect(response).toContain('Toyota Camry is available');
      expect(response).toContain('89 rupees per day');
      expect(response).toContain('356 rupees');
      expect(posted).toHaveLength(1);
      expect(posted[0].availabilityCard?.isAvailable).toBe(true);
      expect(posted[0].availabilityCard?.bookingUrl).toContain('/book/v-001-camry');
    });

    it('handles unavailable vehicle and posts unavailable reason', async () => {
      const posted: ClientToolMessagePayload[] = [];
      const mockFetch = vi.fn().mockResolvedValue({
        json: async () => ({
          success: true,
          data: {
            isAvailable: false,
            reason: 'Scheduled maintenance hold',
            dailyRate: 129,
            totalDays: 3,
            estimatedTotal: 387,
          },
        }),
      });

      const tools = createElevenLabsClientTools({
        onPostMessage: (msg) => posted.push(msg),
        fetchFn: mockFetch as unknown as typeof fetch,
      });

      const response = await tools.check_car_availability({
        vehicle_name: 'Toyota HiLux',
        pickup_date: '2026-09-01',
        dropoff_date: '2026-09-04',
      });

      expect(response).toContain('unavailable');
      expect(response).toContain('Scheduled maintenance hold');
      expect(posted[0].availabilityCard?.isAvailable).toBe(false);
    });

    it('rejects unknown vehicles not in fleet', async () => {
      const tools = createElevenLabsClientTools();
      const response = await tools.check_car_availability({
        vehicle_name: 'Ferrari 488',
      });
      expect(response).toContain('was not found in our fleet');
    });
  });

  describe('Tool 2: calculate_rental_price', () => {
    it('calculates quote with extras and promo code', async () => {
      const posted: ClientToolMessagePayload[] = [];
      const mockFetch = vi.fn().mockResolvedValue({
        json: async () => ({
          success: true,
          data: {
            vehicle: { make: 'Toyota', model: 'Camry', year: 2024 },
            pickupDate: '2026-09-10T00:00:00.000Z',
            dropoffDate: '2026-09-14T00:00:00.000Z',
            rentalDays: 4,
            dailyRate: 89,
            baseAmount: 356,
            extrasAmount: 100,
            discountAmount: 35.6,
            taxAmount: 0,
            finalAmount: 420.4,
            promoApplied: { code: 'SAVE10' },
          },
        }),
      });

      const tools = createElevenLabsClientTools({
        onPostMessage: (msg) => posted.push(msg),
        fetchFn: mockFetch as unknown as typeof fetch,
      });

      const response = await tools.calculate_rental_price({
        vehicle_name: 'Camry',
        pickup_date: '2026-09-10',
        dropoff_date: '2026-09-14',
        extras: ['ext-zero-excess'],
        promo_code: 'SAVE10',
      });

      expect(response).toContain('Authoritative Price Quote');
      expect(response).toContain('420.4 rupees');
      expect(posted[0].priceCard?.finalAmount).toBe(420.4);
      expect(posted[0].priceCard?.promoCode).toBe('SAVE10');
    });
  });

  describe('Tool 3: create_booking_draft', () => {
    it('creates booking draft card with Proceed to Secure Payment link', async () => {
      const posted: ClientToolMessagePayload[] = [];
      const mockFetch = vi.fn().mockResolvedValue({
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
        onPostMessage: (msg) => posted.push(msg),
        fetchFn: mockFetch as unknown as typeof fetch,
      });

      const response = await tools.create_booking_draft({
        vehicle_name: 'Toyota Camry',
        pickup_date: '2026-09-10',
        dropoff_date: '2026-09-14',
        pickup_location: 'Sydney Airport Hub (SYD)',
      });

      expect(response).toContain('Booking draft prepared');
      expect(response).toContain('356 rupees');
        expect(posted[0].bookingDraft?.bookingUrl).toContain('/book/v-001-camry');
        expect(posted[0].bookingDraft?.estimatedTotal).toBe(356);
      });

      it('includes collected customer details in the bookingUrl', async () => {
        const posted: ClientToolMessagePayload[] = [];
        const mockFetch = vi.fn().mockResolvedValue({
          json: async () => ({
            success: true,
            data: {
              vehicle: { id: 'v-001-camry', make: 'Toyota', model: 'Camry', year: 2024 },
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
          onPostMessage: (msg) => posted.push(msg),
          fetchFn: mockFetch as unknown as typeof fetch,
        });

        const response = await tools.create_booking_draft({
          vehicle_name: 'Toyota Camry',
          pickup_date: '2026-09-10',
          dropoff_date: '2026-09-14',
          first_name: 'Emma',
          last_name: 'Watson',
          email: 'emma.watson@example.com',
          phone: '+61412345678',
          license_number: 'NSW-998877',
        });

        expect(response).toContain('Emma Watson');
        const url = posted[0].bookingDraft?.bookingUrl || '';
        expect(url).toContain('firstName=Emma');
        expect(url).toContain('lastName=Watson');
        expect(url).toContain('email=emma.watson%40example.com');
        expect(url).toContain('phone=%2B61412345678');
        expect(url).toContain('licenseNumber=NSW-998877');
      });
    });

    describe('Tool 4: generate_checkout_action', () => {
      it('generates direct checkout deep link without speaking raw URL', async () => {
        const posted: ClientToolMessagePayload[] = [];
        const tools = createElevenLabsClientTools({
          onPostMessage: (msg) => posted.push(msg),
        });

        const response = await tools.generate_checkout_action({
          vehicle_name: 'Mazda CX-5',
          pickup_date: '2026-09-15',
          dropoff_date: '2026-09-18',
          promo_code: 'WEEKEND50',
          first_name: 'David',
          last_name: 'Warner',
          email: 'david.warner@example.com',
          phone: '+61499887766',
          license_number: 'VIC-123456',
        });

        expect(response).toContain('Proceed to Secure Payment');
        expect(response).not.toContain('http://');
        const url = posted[0].bookingDraft?.bookingUrl || '';
        expect(url).toContain('/book/v-002-cx5');
        expect(url).toContain('promo=WEEKEND50');
        expect(url).toContain('firstName=David');
        expect(url).toContain('lastName=Warner');
        expect(url).toContain('email=david.warner%40example.com');
        expect(url).toContain('phone=%2B61499887766');
        expect(url).toContain('licenseNumber=VIC-123456');
      });
  });

  describe('Tool 5: lookup_booking_status', () => {
    it('retrieves live booking status and summarizes details', async () => {
      const posted: ClientToolMessagePayload[] = [];
      const mockFetch = vi.fn().mockResolvedValue({
        json: async () => ({
          success: true,
          data: {
            id: 'bk-123',
            bookingNumber: 'NR-2026-10022',
            vehicleId: 'Toyota Camry',
            pickupDate: '2026-09-10T10:00:00.000Z',
            dropoffDate: '2026-09-14T10:00:00.000Z',
            status: 'CONFIRMED',
            paymentStatus: 'PAID',
            finalAmount: 356,
          },
        }),
      });

      const tools = createElevenLabsClientTools({
        onPostMessage: (msg) => posted.push(msg),
        fetchFn: mockFetch as unknown as typeof fetch,
      });

      const response = await tools.lookup_booking_status({
        booking_number: 'NR-2026-10022',
      });

      expect(response).toContain('NR-2026-10022');
      expect(response).toContain('CONFIRMED');
      expect(response).toContain('PAID');
      expect(response).toContain('356 rupees');
      expect(posted[0].content).toContain('NR-2026-10022');
    });

    it('handles not found booking reference gracefully', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        json: async () => ({
          success: false,
          error: 'Booking not found',
        }),
      });

      const tools = createElevenLabsClientTools({
        fetchFn: mockFetch as unknown as typeof fetch,
      });

      const response = await tools.lookup_booking_status({
        booking_number: 'NR-INVALID',
      });

      expect(response).toContain('No booking found for reference');
    });
  });
});
