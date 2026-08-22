import { describe, it, expect, beforeEach } from 'vitest';
import { aiAgentService } from '@/lib/services/ai-agent-service';
import { vehicleStore } from '@/lib/db/vehicle-store';
import {
  extractNaturalDates,
  resolveVehicleWithTypoTolerance,
  sanitizeChatText,
} from '@/lib/utils/ai-nlp';

describe('Phase 5B Refinement: NR Concierge Natural Language & Typo Tolerance', () => {
  beforeEach(() => {
    vehicleStore.reset();
  });

  // Test NLP Helpers
  it('Natural date extraction parses various month formats', () => {
    const d1 = extractNaturalDates('is toyota camry available for 10 september to 14 september');
    expect(d1).not.toBeNull();
    expect(d1?.pickupDate).toBe('2026-09-10');
    expect(d1?.dropoffDate).toBe('2026-09-14');

    const d2 = extractNaturalDates('10 sept to 14 sept');
    expect(d2?.pickupDate).toBe('2026-09-10');
    expect(d2?.dropoffDate).toBe('2026-09-14');

    const d3 = extractNaturalDates('10 sep - 14 sep');
    expect(d3?.pickupDate).toBe('2026-09-10');
    expect(d3?.dropoffDate).toBe('2026-09-14');
  });

  it('Typo tolerance resolves vehicle names with misspellings', async () => {
    const vehicles = (await vehicleStore.list()).vehicles;
    const v1 = resolveVehicleWithTypoTolerance('toyta camry', vehicles);
    expect(v1?.model).toBe('Camry');

    const v2 = resolveVehicleWithTypoTolerance('camryy', vehicles);
    expect(v2?.model).toBe('Camry');

    const v3 = resolveVehicleWithTypoTolerance('tuccon', vehicles);
    expect(v3?.model).toBe('Tucson');
  });

  it('Sanitizes markdown syntax to clean readable customer text', () => {
    const raw =
      '**2024 Toyota Camry** is **AVAILABLE** for your trip from `2026-09-10` to `2026-09-14`.\n### Rental Policies\n- **Age**: 21';
    const clean = sanitizeChatText(raw);
    expect(clean).not.toContain('**');
    expect(clean).not.toContain('###');
    expect(clean).not.toContain('`');
    expect(clean).toContain('2024 Toyota Camry is AVAILABLE');
  });

  // Test the 10 exact prompt inputs:
  it('Input 1: "is toyota camry available for 10 september to 14 september"', async () => {
    const res = await aiAgentService.processChat([
      { role: 'user', content: 'is toyota camry available for 10 september to 14 september' },
    ]);
    expect(res.availabilityCard).toBeDefined();
    expect(res.availabilityCard?.vehicleName).toContain('Camry');
    expect(res.availabilityCard?.isAvailable).toBe(true);
    expect(res.availabilityCard?.pickupDate).toBe('2026-09-10');
    expect(res.availabilityCard?.dropoffDate).toBe('2026-09-14');
    expect(res.message).not.toContain('**');
  });

  it('Input 2: "Is Toyota Camry available from 10 September to 14 September?"', async () => {
    const res = await aiAgentService.processChat([
      { role: 'user', content: 'Is Toyota Camry available from 10 September to 14 September?' },
    ]);
    expect(res.availabilityCard).toBeDefined();
    expect(res.availabilityCard?.isAvailable).toBe(true);
    expect(res.message).not.toContain('**');
  });

  it('Input 3: "is toyta camry avalable 10 sept to 14 sept"', async () => {
    const res = await aiAgentService.processChat([
      { role: 'user', content: 'is toyta camry avalable 10 sept to 14 sept' },
    ]);
    expect(res.availabilityCard).toBeDefined();
    expect(res.availabilityCard?.vehicleName).toContain('Camry');
    expect(res.availabilityCard?.isAvailable).toBe(true);
    expect(res.message).not.toContain('**');
  });

  it('Input 4: "show me suvs"', async () => {
    const res = await aiAgentService.processChat([{ role: 'user', content: 'show me suvs' }]);
    expect(res.suggestedVehicles).toBeDefined();
    expect(res.suggestedVehicles?.length).toBeGreaterThan(0);
    expect(res.suggestedVehicles?.[0].category.toLowerCase()).toBe('suv');
    expect(res.message).not.toContain('**');
  });

  it('Input 5: "SHOW ME SUVS"', async () => {
    const res = await aiAgentService.processChat([{ role: 'user', content: 'SHOW ME SUVS' }]);
    expect(res.suggestedVehicles).toBeDefined();
    expect(res.suggestedVehicles?.length).toBeGreaterThan(0);
    expect(res.suggestedVehicles?.[0].category.toLowerCase()).toBe('suv');
    expect(res.message).not.toContain('**');
  });

  it('Input 6: "show me suv plz"', async () => {
    const res = await aiAgentService.processChat([{ role: 'user', content: 'show me suv plz' }]);
    expect(res.suggestedVehicles).toBeDefined();
    expect(res.suggestedVehicles?.length).toBeGreaterThan(0);
    expect(res.suggestedVehicles?.[0].category.toLowerCase()).toBe('suv');
    expect(res.message).not.toContain('**');
  });

  it('Input 7: "i want the camry"', async () => {
    const res = await aiAgentService.processChat([{ role: 'user', content: 'i want the camry' }]);
    expect(res.suggestedVehicles).toBeDefined();
    expect(res.suggestedVehicles?.[0].name).toContain('Camry');
    expect(res.priceCard).toBeDefined();
    expect(res.message).not.toContain('**');
  });

  it('Input 8: "how much camry for 4 days"', async () => {
    const res = await aiAgentService.processChat([
      { role: 'user', content: 'how much camry for 4 days' },
    ]);
    expect(res.priceCard).toBeDefined();
    expect(res.priceCard?.rentalDays).toBe(4);
    expect(res.priceCard?.finalAmount).toBeGreaterThan(0);
    expect(res.message).not.toContain('**');
  });

  it('Input 9: "anything for family trip?"', async () => {
    const res = await aiAgentService.processChat([
      { role: 'user', content: 'anything for family trip?' },
    ]);
    expect(res.message.toLowerCase()).toContain('child');
    expect(res.message).not.toContain('**');
  });

  it('Input 10: "book it"', async () => {
    const res = await aiAgentService.processChat([
      { role: 'user', content: 'i want the camry' },
      { role: 'assistant', content: 'The Camry is ready.' },
      { role: 'user', content: 'book it' },
    ]);
    expect(res.bookingDraft).toBeDefined();
    expect(res.bookingDraft?.bookingUrl).toContain('/book/v-001-camry');
    expect(res.message).not.toContain('**');
  });
});
