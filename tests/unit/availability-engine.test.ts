import { describe, it, expect, beforeEach } from 'vitest';
import { inventoryService } from '@/lib/services/inventory-service';
import { vehicleStore } from '@/lib/db/vehicle-store';
import { AppError } from '@/lib/utils/errors';

describe('Availability Engine & Conflict Prevention', () => {
  beforeEach(() => {
    vehicleStore.reset();
  });

  const vehicleId = 'v-001-camry';

  it('returns available when no conflicting bookings or maintenance holds exist', async () => {
    const pickup = new Date('2026-09-01T10:00:00Z');
    const dropoff = new Date('2026-09-05T10:00:00Z');

    const result = await inventoryService.checkAvailability(vehicleId, pickup, dropoff);
    expect(result.isAvailable).toBe(true);
    expect(result.totalDays).toBe(4);
    expect(result.estimatedTotal).toBe(4 * 89);
  });

  it('detects overlap with an existing confirmed booking', async () => {
    // Add existing reservation: 10 Sep -> 15 Sep
    await vehicleStore.addBooking({
      id: 'book-001',
      vehicleId,
      pickupDate: new Date('2026-09-10T10:00:00Z'),
      dropoffDate: new Date('2026-09-15T10:00:00Z'),
      status: 'CONFIRMED',
    });

    // Overlapping request: 12 Sep -> 18 Sep
    const overlapping = await inventoryService.checkAvailability(
      vehicleId,
      new Date('2026-09-12T10:00:00Z'),
      new Date('2026-09-18T10:00:00Z'),
    );

    expect(overlapping.isAvailable).toBe(false);
    expect(overlapping.conflictingBookingId).toBe('book-001');
    expect(overlapping.reason).toContain('confirmed reservation');
  });

  it('allows non-overlapping bookings before and after existing reservations', async () => {
    // Existing reservation: 10 Sep -> 15 Sep
    await vehicleStore.addBooking({
      id: 'book-001',
      vehicleId,
      pickupDate: new Date('2026-09-10T10:00:00Z'),
      dropoffDate: new Date('2026-09-15T10:00:00Z'),
      status: 'CONFIRMED',
    });

    // Before: 1 Sep -> 8 Sep
    const before = await inventoryService.checkAvailability(
      vehicleId,
      new Date('2026-09-01T10:00:00Z'),
      new Date('2026-09-08T10:00:00Z'),
    );
    expect(before.isAvailable).toBe(true);

    // After: 16 Sep -> 20 Sep
    const after = await inventoryService.checkAvailability(
      vehicleId,
      new Date('2026-09-16T10:00:00Z'),
      new Date('2026-09-20T10:00:00Z'),
    );
    expect(after.isAvailable).toBe(true);
  });

  it('detects conflict when requested period completely engulfs an existing booking', async () => {
    // Existing reservation: 10 Sep -> 15 Sep
    await vehicleStore.addBooking({
      id: 'book-001',
      vehicleId,
      pickupDate: new Date('2026-09-10T10:00:00Z'),
      dropoffDate: new Date('2026-09-15T10:00:00Z'),
      status: 'CONFIRMED',
    });

    // Request engulfing: 5 Sep -> 20 Sep
    const engulfing = await inventoryService.checkAvailability(
      vehicleId,
      new Date('2026-09-05T10:00:00Z'),
      new Date('2026-09-20T10:00:00Z'),
    );
    expect(engulfing.isAvailable).toBe(false);
    expect(engulfing.conflictingBookingId).toBe('book-001');
  });

  it('detects conflict with an administrative maintenance block', async () => {
    // Add maintenance block: 20 Sep -> 25 Sep
    await inventoryService.addMaintenanceBlock(
      {
        vehicleId,
        startDate: new Date('2026-09-20T00:00:00Z'),
        endDate: new Date('2026-09-25T23:59:59Z'),
        reason: 'MAINTENANCE',
        notes: '10,000 km logbook service',
      },
      'ADMIN',
    );

    // Conflicting request: 22 Sep -> 28 Sep
    const conflict = await inventoryService.checkAvailability(
      vehicleId,
      new Date('2026-09-22T10:00:00Z'),
      new Date('2026-09-28T10:00:00Z'),
    );

    expect(conflict.isAvailable).toBe(false);
    expect(conflict.conflictingMaintenanceId).toBeDefined();
    expect(conflict.reason).toContain('maintenance');
  });

  it('rejects availability for vehicles with operational status MAINTENANCE or INACTIVE', async () => {
    // Set status to MAINTENANCE
    await vehicleStore.setStatus(vehicleId, 'MAINTENANCE');

    const result = await inventoryService.checkAvailability(
      vehicleId,
      new Date('2026-10-01T10:00:00Z'),
      new Date('2026-10-05T10:00:00Z'),
    );
    expect(result.isAvailable).toBe(false);
    expect(result.reason).toContain('maintenance');

    // Deactivate vehicle
    await inventoryService.deactivateVehicle(vehicleId, 'ADMIN');
    const inactiveResult = await inventoryService.checkAvailability(
      vehicleId,
      new Date('2026-10-01T10:00:00Z'),
      new Date('2026-10-05T10:00:00Z'),
    );
    expect(inactiveResult.isAvailable).toBe(false);
    expect(inactiveResult.reason).toContain('not currently active');
  });

  // ----------------------------------------------------
  // Concurrency & Double-Booking Prevention
  // ----------------------------------------------------
  describe('Concurrency & Double-Booking Prevention', () => {
    it('prevents two simultaneous bookings from double-booking the same vehicle for overlapping dates', async () => {
      const pickup = new Date('2026-11-01T10:00:00Z');
      const dropoff = new Date('2026-11-05T10:00:00Z');

      // Customer 1 reserves vehicle
      const customer1Booking = await inventoryService.reserveWithConcurrencyCheck({
        id: 'cust-1-booking',
        vehicleId,
        pickupDate: pickup,
        dropoffDate: dropoff,
      });
      expect(customer1Booking).toBeDefined();
      expect(customer1Booking.status).toBe('CONFIRMED');

      // Customer 2 attempts to reserve same vehicle for overlapping dates (2 Nov -> 6 Nov)
      await expect(
        inventoryService.reserveWithConcurrencyCheck({
          id: 'cust-2-booking',
          vehicleId,
          pickupDate: new Date('2026-11-02T10:00:00Z'),
          dropoffDate: new Date('2026-11-06T10:00:00Z'),
        }),
      ).rejects.toThrow(AppError);
    });
  });
});
