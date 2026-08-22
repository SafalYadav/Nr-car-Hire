import { describe, it, expect, beforeEach } from 'vitest';
import { aiAgentService } from '@/lib/services/ai-agent-service';
import { vehicleStore } from '@/lib/db/vehicle-store';
import { bookingService } from '@/lib/services/booking-service';
import { paymentService } from '@/lib/services/payment-service';
import { AppError } from '@/lib/utils/errors';

describe('Phase 5B Hardening: Context Switching & Maintenance Hold Protection', () => {
  beforeEach(() => {
    vehicleStore.reset();
  });

  it('1 & 14. Vehicle context replacement -> switches cleanly from Tucson to Camry', async () => {
    // Turn 1: I want the Tucson
    const t1 = await aiAgentService.processChat([{ role: 'user', content: 'I want the Tucson' }]);
    expect(t1.suggestedVehicles?.[0].name).toContain('Tucson');

    // Turn 2: for 10 days
    const t2 = await aiAgentService.processChat([
      { role: 'user', content: 'I want the Tucson' },
      { role: 'assistant', content: t1.message },
      { role: 'user', content: 'for 10 days' },
    ]);
    expect(t2.priceCard?.vehicleName).toContain('Tucson');
    expect(t2.priceCard?.rentalDays).toBe(10);

    // Turn 3: actually camry chahiye
    const t3 = await aiAgentService.processChat([
      { role: 'user', content: 'I want the Tucson' },
      { role: 'assistant', content: t1.message },
      { role: 'user', content: 'for 10 days' },
      { role: 'assistant', content: t2.message },
      { role: 'user', content: 'actually camry chahiye' },
    ]);
    expect(t3.suggestedVehicles?.[0].name).toContain('Camry');
    expect(t3.message.toLowerCase()).toContain('camry');
    expect(t3.message.toLowerCase()).not.toContain('tucson');
  });

  it('2. Date context replacement -> replaces 10-day duration with 1-5 Sept (4 days)', async () => {
    // Turn 1: family car for 10 days
    const t1 = await aiAgentService.processChat([
      { role: 'user', content: 'family car for 10 days' },
    ]);
    expect(t1.suggestedVehicles).toBeDefined();

    // Turn 2: hilux available hai 1-5 sept?
    const t2 = await aiAgentService.processChat([
      { role: 'user', content: 'family car for 10 days' },
      { role: 'assistant', content: t1.message },
      { role: 'user', content: 'hilux available hai 1-5 sept?' },
    ]);
    expect(t2.availabilityCard?.vehicleName).toContain('HiLux');
    expect(t2.availabilityCard?.pickupDate).toBe('2026-09-01');
    expect(t2.availabilityCard?.dropoffDate).toBe('2026-09-05');
    expect(t2.availabilityCard?.rentalDays).toBe(4);
    expect(t2.availabilityCard?.rentalDays).not.toBe(10);
  });

  it('4, 5 & 10. Maintenance hold detection -> AI strictly reports UNAVAILABLE without booking URL', async () => {
    const hilux = (await vehicleStore.list()).vehicles.find((v) =>
      v.model.toLowerCase().includes('hilux'),
    )!;

    // Place maintenance hold on HiLux from 2026-09-01 to 2026-09-05
    await vehicleStore.addMaintenanceBlock(
      hilux.id,
      new Date('2026-09-01T00:00:00.000Z'),
      new Date('2026-09-05T00:00:00.000Z'),
      'Scheduled 50,000km Engine Maintenance',
    );

    const res = await aiAgentService.processChat([
      { role: 'user', content: 'hilux available hai 1-5 sept?' },
    ]);

    expect(res.availabilityCard).toBeDefined();
    expect(res.availabilityCard?.isAvailable).toBe(false);
    expect(res.availabilityCard?.bookingUrl).toBeUndefined();
    expect(res.bookingDraft).toBeUndefined();
    expect(res.message.toLowerCase()).toContain('unavailable');
    expect(res.message.toLowerCase()).toContain('maintenance');
  });

  it('6. Existing booking overlap detection -> strictly reports UNAVAILABLE', async () => {
    const camry = (await vehicleStore.list()).vehicles.find((v) =>
      v.model.toLowerCase().includes('camry'),
    )!;

    // Place confirmed reservation on Camry from 2026-09-01 to 2026-09-05
    await vehicleStore.addBooking({
      id: 'bk-confirmed-test',
      vehicleId: camry.id,
      pickupDate: new Date('2026-09-01T00:00:00.000Z'),
      dropoffDate: new Date('2026-09-05T00:00:00.000Z'),
      status: 'CONFIRMED',
    });

    const res = await aiAgentService.processChat([
      { role: 'user', content: 'is camry available 1-5 sept?' },
    ]);

    expect(res.availabilityCard?.isAvailable).toBe(false);
    expect(res.availabilityCard?.bookingUrl).toBeUndefined();
    expect(res.message.toLowerCase()).toContain('unavailable');
  });

  it('7 & 8. Server-side bypass protection -> calculateQuote, createBooking, and createOrder return 409 Conflict', async () => {
    const hilux = (await vehicleStore.list()).vehicles.find((v) =>
      v.model.toLowerCase().includes('hilux'),
    )!;

    // Place maintenance hold
    await vehicleStore.addMaintenanceBlock(
      hilux.id,
      new Date('2026-09-01T00:00:00.000Z'),
      new Date('2026-09-05T00:00:00.000Z'),
      'Emergency differential repair',
    );

    // 1. calculateQuote must throw 409
    await expect(
      bookingService.calculateQuote({
        vehicleId: hilux.id,
        pickupLocation: 'Sydney',
        dropoffLocation: 'Sydney',
        pickupDate: new Date('2026-09-01T10:00:00.000Z'),
        dropoffDate: new Date('2026-09-05T10:00:00.000Z'),
      }),
    ).rejects.toThrowError(AppError);

    // 2. createBooking must throw 409
    await expect(
      bookingService.createBooking({
        vehicleId: hilux.id,
        pickupLocation: 'Sydney',
        dropoffLocation: 'Sydney',
        pickupDate: new Date('2026-09-01T10:00:00.000Z'),
        dropoffDate: new Date('2026-09-05T10:00:00.000Z'),
        customer: {
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          phone: '+61412345678',
          licenseNumber: 'LIC-998877',
        },
      }),
    ).rejects.toThrowError(AppError);

    // 3. createOrder must throw 409
    await expect(
      paymentService.createOrder({
        vehicleId: hilux.id,
        pickupDate: '2026-09-01',
        dropoffDate: '2026-09-05',
        currency: 'INR',
        customer: {
          name: 'John Doe',
          email: 'john@example.com',
          phone: '+61412345678',
        },
      }),
    ).rejects.toThrowError(AppError);
  });

  // Mandatory Full Lifecycle Scenario from Sections 13 & 15
  it('Mandatory Lifecycle: Maintenance + Context Switching Full Flow', async () => {
    const hilux = (await vehicleStore.list()).vehicles.find((v) =>
      v.model.toLowerCase().includes('hilux'),
    )!;

    // Step 1: User asks for family car for 10 days
    const t1 = await aiAgentService.processChat([
      { role: 'user', content: 'family car for 10 days' },
    ]);
    expect(t1.suggestedVehicles).toBeDefined();

    // Step 2: User asks "camry available hai 1-5 sept?" -> available
    const t2 = await aiAgentService.processChat([
      { role: 'user', content: 'family car for 10 days' },
      { role: 'assistant', content: t1.message },
      { role: 'user', content: 'camry available hai 1-5 sept?' },
    ]);
    expect(t2.availabilityCard?.isAvailable).toBe(true);

    // Step 3: Admin places maintenance hold on HiLux for 2026-09-01 to 2026-09-05
    await vehicleStore.addMaintenanceBlock(
      hilux.id,
      new Date('2026-09-01T00:00:00.000Z'),
      new Date('2026-09-05T00:00:00.000Z'),
      'Scheduled transmission rebuild',
    );

    // Step 4: User asks again "hilux available hai 1-5 sept?" -> UNAVAILABLE
    const t3 = await aiAgentService.processChat([
      { role: 'user', content: 'family car for 10 days' },
      { role: 'assistant', content: t1.message },
      { role: 'user', content: 'hilux available hai 1-5 sept?' },
    ]);
    expect(t3.availabilityCard?.isAvailable).toBe(false);
    expect(t3.availabilityCard?.bookingUrl).toBeUndefined();

    // Step 5: User asks "hilux available hai 10-15 sept?" -> FRESH availability check -> AVAILABLE
    const t4 = await aiAgentService.processChat([
      { role: 'user', content: 'family car for 10 days' },
      { role: 'assistant', content: t1.message },
      { role: 'user', content: 'hilux available hai 1-5 sept?' },
      { role: 'assistant', content: t3.message },
      { role: 'user', content: 'hilux available hai 10-15 sept?' },
    ]);
    expect(t4.availabilityCard?.vehicleName).toContain('HiLux');
    expect(t4.availabilityCard?.pickupDate).toBe('2026-09-10');
    expect(t4.availabilityCard?.dropoffDate).toBe('2026-09-15');
    expect(t4.availabilityCard?.isAvailable).toBe(true);
    expect(t4.availabilityCard?.bookingUrl).toBeDefined();

    // Step 6: User switches vehicle: "actually camry 1-5 sept?" -> Vehicle becomes Camry -> AVAILABLE
    const t5 = await aiAgentService.processChat([
      { role: 'user', content: 'family car for 10 days' },
      { role: 'assistant', content: t1.message },
      { role: 'user', content: 'hilux available hai 1-5 sept?' },
      { role: 'assistant', content: t3.message },
      { role: 'user', content: 'hilux available hai 10-15 sept?' },
      { role: 'assistant', content: t4.message },
      { role: 'user', content: 'actually camry 1-5 sept?' },
    ]);
    expect(t5.availabilityCard?.vehicleName).toContain('Camry');
    expect(t5.availabilityCard?.pickupDate).toBe('2026-09-01');
    expect(t5.availabilityCard?.dropoffDate).toBe('2026-09-05');
    expect(t5.availabilityCard?.isAvailable).toBe(true);
  });
});
