import { describe, it, expect } from 'vitest';
import { testSupabaseConnection } from '@/lib/db/supabase';
import { uploadVehicleImage, deleteVehicleImage } from '@/lib/db/storage';
import {
  checkCarAvailability,
  getCarDetails,
  createCarBookingDraft,
  getCarBookingStatus,
  calculateCarRentalPricing,
  generateBookingCheckoutLink,
} from '@/lib/services/ai-agent-tools';

describe('Supabase Migration & AI Tools Test Suite', () => {
  describe('1. Supabase Connection & Health', () => {
    it('verifies connection to the Supabase endpoint', async () => {
      const res = await testSupabaseConnection();
      expect(res.connected).toBe(true);
      expect(res.url).toContain('supabase.co');
    });
  });

  describe('2. Supabase Storage Utilities', () => {
    it('generates a clean public URL format for vehicle images', async () => {
      const dummyBuffer = Buffer.from('fake-image-bytes');
      const result = await uploadVehicleImage('v-001-camry', dummyBuffer, 'test_car.jpg');
      expect(result.url).toContain('vehicle-images');
      expect(result.path).toContain('v-001-camry');
    });

    it('handles image path deletion gracefully', async () => {
      const deleted = await deleteVehicleImage('v-001-camry/test_car.jpg');
      expect(typeof deleted).toBe('boolean');
    });
  });

  describe('3. ElevenLabs AI Agent Backend Tools', () => {
    it('checkCarAvailability authoritatively validates vehicle dates', async () => {
      const available = await checkCarAvailability({
        vehicleIdOrName: 'Toyota Camry',
        pickupDate: '2026-09-10',
        dropoffDate: '2026-09-14',
      });
      expect(available.isAvailable).toBe(true);
      expect(available.vehicleName).toContain('Camry');
      expect(available.dailyRate).toBe(89);
    });

    it('getCarDetails returns accurate vehicle specifications', async () => {
      const details = await getCarDetails('Mazda CX-5');
      expect(details).not.toBeNull();
      expect(details?.category).toBe('SUV');
      expect(details?.transmission).toBe('Automatic');
      expect(details?.dailyRate).toBe(109);
    });

    it('calculateCarRentalPricing calculates base, extras, and discounts', async () => {
      const price = await calculateCarRentalPricing({
        vehicleIdOrName: 'Toyota Camry',
        pickupDate: '2026-09-10',
        dropoffDate: '2026-09-14',
        promoCode: 'SAVE10',
      });
      expect('finalAmount' in price).toBe(true);
      if ('finalAmount' in price) {
        expect(price.rentalDays).toBe(4);
        expect(price.discountAmount).toBeGreaterThan(0);
      }
    });

    it('createCarBookingDraft generates valid draft with checkout URL', async () => {
      const res = await createCarBookingDraft({
        vehicleIdOrName: 'Toyota Camry',
        pickupDate: '2026-09-10',
        dropoffDate: '2026-09-14',
        promoCode: 'SAVE10',
      });
      expect('draft' in res).toBe(true);
      if ('draft' in res) {
        expect(res.draft.bookingUrl).toContain('/book/v-001-camry');
        expect(res.draft.bookingUrl).toContain('promo=SAVE10');
      }
    });

    it('getCarBookingStatus retrieves or handles missing booking ID gracefully', async () => {
      const res = await getCarBookingStatus('non-existent-booking-123');
      expect(res.success).toBe(false);
      expect(res.error).toBeDefined();
    });

    it('generateBookingCheckoutLink creates full URL', async () => {
      const link = await generateBookingCheckoutLink({
        vehicleId: 'v-001-camry',
        pickupDate: '2026-09-10',
        dropoffDate: '2026-09-14',
        promoCode: 'SAVE10',
      });
      expect(link.bookingUrl).toContain('/book/v-001-camry');
      expect(link.fullUrl).toContain('/book/v-001-camry');
    });
  });
});
