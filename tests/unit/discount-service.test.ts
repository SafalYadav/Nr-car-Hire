import { describe, it, expect, beforeEach } from 'vitest';
import { discountService } from '@/lib/services/discount-service';
import { discountStore } from '@/lib/db/discount-store';

describe('DiscountService & Promotional Engine', () => {
  beforeEach(() => {
    discountStore.reset();
  });

  it('validates SAVE10 successfully (10% off ₹300 = ₹30)', async () => {
    const res = await discountService.validatePromo({
      code: 'SAVE10',
      vehicleId: 'v-001-camry',
      category: 'Sedan',
      rentalDays: 3,
      baseAmount: 300,
    });

    expect(res.isValid).toBe(true);
    expect(res.code).toBe('SAVE10');
    expect(res.discountType).toBe('PERCENTAGE');
    expect(res.discountAmount).toBe(30);
  });

  it('rejects promo code when minimum rental days is not met', async () => {
    // SAVE10 requires min 2 days
    const res = await discountService.validatePromo({
      code: 'SAVE10',
      vehicleId: 'v-001-camry',
      category: 'Sedan',
      rentalDays: 1,
      baseAmount: 89,
    });

    expect(res.isValid).toBe(false);
    expect(res.discountAmount).toBe(0);
    expect(res.message).toContain('minimum rental period of 2 days');
  });

  it('rejects promo code when minimum booking value is not met', async () => {
    // WEEKEND50 requires min booking value ₹200
    const res = await discountService.validatePromo({
      code: 'WEEKEND50',
      vehicleId: 'v-001-camry',
      category: 'Sedan',
      rentalDays: 3,
      baseAmount: 150,
    });

    expect(res.isValid).toBe(false);
    expect(res.discountAmount).toBe(0);
    expect(res.message).toContain('minimum booking spend of ₹200');
  });

  it('rejects promo code when vehicle category does not match restriction', async () => {
    // SUMMER15 is only applicable to Premium, Luxury, SUV
    const res = await discountService.validatePromo({
      code: 'SUMMER15',
      vehicleId: 'v-001-camry',
      category: 'Sedan', // Not in ['Premium', 'Luxury', 'SUV']
      rentalDays: 5,
      baseAmount: 500,
    });

    expect(res.isValid).toBe(false);
    expect(res.message).toContain('only valid for Premium, Luxury, SUV categories');
  });

  it('accepts promo code when vehicle category matches restriction', async () => {
    const res = await discountService.validatePromo({
      code: 'SUMMER15',
      vehicleId: 'v-002-cx5',
      category: 'SUV',
      rentalDays: 5,
      baseAmount: 545,
    });

    expect(res.isValid).toBe(true);
    expect(res.discountAmount).toBe(81.75); // 15% of 545
  });

  it('rejects disabled promo codes', async () => {
    await discountStore.toggleStatus('disc-save10', false);

    const res = await discountService.validatePromo({
      code: 'SAVE10',
      vehicleId: 'v-001-camry',
      category: 'Sedan',
      rentalDays: 3,
      baseAmount: 300,
    });

    expect(res.isValid).toBe(false);
    expect(res.message).toContain('Invalid or inactive');
  });

  it('caps discount amount by maxDiscountAmount', async () => {
    // SAVE10 max discount is 100
    const res = await discountService.validatePromo({
      code: 'SAVE10',
      vehicleId: 'v-003-3series',
      category: 'Luxury',
      rentalDays: 10,
      baseAmount: 2000,
    });

    expect(res.isValid).toBe(true);
    expect(res.discountAmount).toBe(100); // capped at 100 rather than 200
  });
});
