import { describe, it, expect, beforeEach, vi } from 'vitest';
import { aiAgentService } from '@/lib/services/ai-agent-service';
import { vehicleStore } from '@/lib/db/vehicle-store';
import { inventoryService } from '@/lib/services/inventory-service';

describe('Phase 5B Final Response + Availability Hardening', () => {
  beforeEach(() => {
    vehicleStore.reset();
    vi.restoreAllMocks();
  });

  it('Test 1: Vehicle exists + available -> Clear AVAILABLE response', async () => {
    const res = await aiAgentService.processChat([
      { role: 'user', content: 'camry available 1-5 sept?' },
    ]);
    expect(res.availabilityCard?.isAvailable).toBe(true);
    expect(res.message).toMatch(/^Yes,\s+the.*Toyota Camry.*available/i);
    expect(res.message).not.toContain('Search not found');
  });

  it('Test 2: Vehicle found + maintenance unavailable -> NOT AVAILABLE + maintenance reason', async () => {
    const hilux = (await vehicleStore.list()).vehicles.find((v) =>
      v.model.toLowerCase().includes('hilux'),
    )!;
    await vehicleStore.addMaintenanceBlock(
      hilux.id,
      new Date('2026-09-01T00:00:00.000Z'),
      new Date('2026-09-05T00:00:00.000Z'),
      'Scheduled gearbox overhaul',
    );

    const res = await aiAgentService.processChat([
      { role: 'user', content: 'hilux available 1-5 sept?' },
    ]);
    expect(res.availabilityCard?.isAvailable).toBe(false);
    expect(res.availabilityCard?.bookingUrl).toBeUndefined();
    expect(res.message.toLowerCase()).toContain("isn't available");
    expect(res.message.toLowerCase()).toContain('scheduled maintenance');
    expect(res.message.toLowerCase()).toContain('show you similar vehicles');
  });

  it('Test 3: Vehicle found + existing booking overlap -> NOT AVAILABLE + booking reason', async () => {
    const camry = (await vehicleStore.list()).vehicles.find((v) =>
      v.model.toLowerCase().includes('camry'),
    )!;
    await vehicleStore.addBooking({
      id: 'bk-test-overlap',
      vehicleId: camry.id,
      pickupDate: new Date('2026-09-01T00:00:00.000Z'),
      dropoffDate: new Date('2026-09-05T00:00:00.000Z'),
      status: 'CONFIRMED',
    });

    const res = await aiAgentService.processChat([
      { role: 'user', content: 'camry 1-5 sept' },
      { role: 'assistant', content: 'Checking availability.' },
      { role: 'user', content: 'ye available hai?' },
    ]);
    expect(res.availabilityCard?.isAvailable).toBe(false);
    expect(res.message.toLowerCase()).toContain("isn't available");
    expect(res.message.toLowerCase()).toContain('already booked');
  });

  it('Test 4: Vehicle does not exist -> Natural NOT FOUND with alternatives, NEVER "Search not found"', async () => {
    const res = await aiAgentService.processChat([{ role: 'user', content: 'bmw x7 available?' }]);
    expect(res.message).toBe(
      "I couldn't find that vehicle in our NR Car Hire fleet. Want me to show you some similar options?",
    );
    expect(res.message).not.toContain('Search not found');
    expect(res.message).not.toContain('undefined');
    expect(res.message).not.toContain('null');
    expect(res.suggestedVehicles).toBeDefined();
    expect(res.suggestedVehicles!.length).toBeGreaterThan(0);
  });

  it('Test 5: Typo matching -> "camri available?" resolves to Camry with high confidence', async () => {
    const res = await aiAgentService.processChat([
      { role: 'user', content: 'camri available 1-5 sept?' },
    ]);
    expect(res.availabilityCard?.vehicleName).toContain('Camry');
    expect(res.availabilityCard?.isAvailable).toBe(true);
  });

  it('Test 6: Backend/Tool failure -> Friendly retry message, NEVER "Not available"', async () => {
    vi.spyOn(inventoryService, 'checkAvailability').mockRejectedValueOnce(
      new Error('Database connection timeout'),
    );

    const res = await aiAgentService.processChat([
      { role: 'user', content: 'camry available 1-5 sept?' },
    ]);
    expect(res.availabilityCard?.isAvailable).not.toBe(true);
    expect(res.message).toBe(
      "I'm having trouble checking availability right now. Please try again in a moment.",
    );
    expect(res.message.toLowerCase()).not.toContain("isn't available");
  });
});
