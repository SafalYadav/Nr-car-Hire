import { describe, it, expect, beforeEach } from 'vitest';
import { inventoryService } from '@/lib/services/inventory-service';
import { bookingService } from '@/lib/services/booking-service';
import { paymentService } from '@/lib/services/payment-service';
import { vehicleStore } from '@/lib/db/vehicle-store';
import { formatErrorMessage } from '@/lib/utils/errors';
import { ZodError } from 'zod';
import { CalculateQuoteSchema } from '@/lib/validation/booking';

describe('Real-Time Availability Lock & Conflict Prevention', () => {
  const testVehicleId = 'v-004-hilux';

  beforeEach(async () => {
    // Reset any existing test holds or bookings
    const maintenances = await vehicleStore.getVehicleMaintenances(testVehicleId);
    for (const m of maintenances) {
      await vehicleStore.removeMaintenanceBlock(m.id);
    }
  });

  it('1. Select maintenance date range -> immediately detects blocked state', async () => {
    // Admin places maintenance hold on Toyota Hilux from 2026-09-01 to 2026-09-05
    await inventoryService.addMaintenanceBlock(
      {
        vehicleId: testVehicleId,
        startDate: new Date('2026-09-01T00:00:00Z'),
        endDate: new Date('2026-09-05T23:59:59Z'),
        reason: 'MAINTENANCE',
        notes: 'Scheduled brake service',
      },
      'ADMIN',
    );

    // User checks availability during maintenance
    const availability = await inventoryService.checkAvailability(
      testVehicleId,
      new Date('2026-09-02T10:00:00Z'),
      new Date('2026-09-04T10:00:00Z'),
    );

    expect(availability.isAvailable).toBe(false);
    expect(availability.reason?.toLowerCase()).toContain('maintenance');

    // Blocked ranges endpoint includes this maintenance
    const blockedRanges = await inventoryService.getBlockedDateRanges(testVehicleId);
    expect(
      blockedRanges.some((r) => r.type === 'MAINTENANCE' && r.startDate === '2026-09-01'),
    ).toBe(true);
  });

  it('2. Select existing booking date range -> immediately detects conflict', async () => {
    // Lock a confirmed booking on Hilux from 2026-10-10 to 2026-10-15
    await inventoryService.reserveWithConcurrencyCheck({
      id: 'booking-test-existing',
      vehicleId: testVehicleId,
      pickupDate: new Date('2026-10-10T10:00:00Z'),
      dropoffDate: new Date('2026-10-15T10:00:00Z'),
    });

    // User tries to check overlapping dates
    const availability = await inventoryService.checkAvailability(
      testVehicleId,
      new Date('2026-10-12T10:00:00Z'),
      new Date('2026-10-14T10:00:00Z'),
    );

    expect(availability.isAvailable).toBe(false);
    expect(availability.reason?.toLowerCase()).toContain('confirmed reservation');

    // Blocked ranges includes this reservation
    const blockedRanges = await inventoryService.getBlockedDateRanges(testVehicleId);
    expect(blockedRanges.some((r) => r.type === 'BOOKING' && r.startDate === '2026-10-10')).toBe(
      true,
    );
  });

  it('3. Try direct API booking during maintenance -> rejects with 409 Conflict', async () => {
    await inventoryService.addMaintenanceBlock(
      {
        vehicleId: testVehicleId,
        startDate: new Date('2026-11-01T00:00:00Z'),
        endDate: new Date('2026-11-05T23:59:59Z'),
        reason: 'MAINTENANCE',
        notes: 'Engine diagnostics',
      },
      'ADMIN',
    );

    await expect(
      bookingService.createBooking({
        vehicleId: testVehicleId,
        pickupLocation: 'Sydney Airport Hub (SYD)',
        dropoffLocation: 'Sydney Airport Hub (SYD)',
        pickupDate: new Date('2026-11-02T10:00:00Z'),
        dropoffDate: new Date('2026-11-04T10:00:00Z'),
        customer: {
          firstName: 'Bob',
          lastName: 'Builder',
          email: 'bob@example.com',
          phone: '+61 400 000 111',
          licenseNumber: 'NSW-999888',
        },
      }),
    ).rejects.toThrow(/unavailable/i);
  });

  it('4. Try payment creation during blocked dates -> rejects with 409 Conflict', async () => {
    await inventoryService.addMaintenanceBlock(
      {
        vehicleId: testVehicleId,
        startDate: new Date('2026-11-10T00:00:00Z'),
        endDate: new Date('2026-11-15T23:59:59Z'),
        reason: 'MAINTENANCE',
      },
      'ADMIN',
    );

    await expect(
      paymentService.createOrder({
        vehicleId: testVehicleId,
        pickupDate: new Date('2026-11-11T10:00:00Z'),
        dropoffDate: new Date('2026-11-13T10:00:00Z'),
      }),
    ).rejects.toThrow(/unavailable/i);
  });

  it('5. Valid dates -> returns authoritative quote and allows progression', async () => {
    const quote = await bookingService.calculateQuote({
      vehicleId: testVehicleId,
      pickupLocation: 'Sydney Airport Hub (SYD)',
      dropoffLocation: 'Sydney Airport Hub (SYD)',
      pickupDate: new Date('2026-12-01T10:00:00Z'),
      dropoffDate: new Date('2026-12-05T10:00:00Z'),
      selectedExtras: [],
    });

    expect(quote.vehicle.id).toBe(testVehicleId);
    expect(quote.rentalDays).toBe(4);
    expect(quote.finalAmount).toBeGreaterThan(0);
    expect(quote.currency).toBe('INR');
  });

  it('6. Clean error formatting: Zod and date errors do not leak JSON brackets', () => {
    let zodError: unknown;
    try {
      CalculateQuoteSchema.parse({
        vehicleId: testVehicleId,
        pickupLocation: 'Sydney Hub',
        dropoffLocation: 'Sydney Hub',
        pickupDate: new Date('2026-12-10T10:00:00Z'),
        dropoffDate: new Date('2026-12-05T10:00:00Z'), // dropoff before pickup
      });
    } catch (e) {
      zodError = e;
    }

    expect(zodError).toBeInstanceOf(ZodError);
    const cleanMessage = formatErrorMessage(zodError);
    expect(cleanMessage).toBe('Return date must be after pickup date.');
    expect(cleanMessage).not.toContain('[{');
    expect(cleanMessage).not.toContain('"code"');
  });
});
