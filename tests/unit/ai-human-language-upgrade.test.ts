import { describe, it, expect, beforeEach } from 'vitest';
import { aiAgentService } from '@/lib/services/ai-agent-service';
import { vehicleStore } from '@/lib/db/vehicle-store';
import { extractNaturalDates, resolveVehicleWithTypoTolerance } from '@/lib/utils/ai-nlp';

describe('NR Concierge: Human-Like Language Understanding Upgrade', () => {
  beforeEach(() => {
    vehicleStore.reset();
  });

  // A. Case Variations
  it('A. Case variations -> resolves identically across all casings', async () => {
    const inputs = ['Toyota Hilux', 'toyota hilux', 'TOYOTA HILUX', 'ToYoTa HiLuX'];
    for (const text of inputs) {
      const v = resolveVehicleWithTypoTolerance(text, (await vehicleStore.list()).vehicles);
      expect(v?.model).toBe('HiLux');
    }

    const suvInputs = ['SUV', 'suv', 'Suv', 'SuV'];
    for (const text of suvInputs) {
      const res = await aiAgentService.searchVehicles({ query: text });
      expect(res.vehicles.length).toBeGreaterThan(0);
      expect(res.vehicles[0].category.toLowerCase()).toBe('suv');
    }
  });

  // B & I. Minor Spelling Mistakes & Typo Handling
  it('B & I. Minor spelling mistakes -> resolves correctly to authoritative fleet', async () => {
    const vehicles = (await vehicleStore.list()).vehicles;

    // Hilux typos
    expect(resolveVehicleWithTypoTolerance('hiluux', vehicles)?.model).toBe('HiLux');
    expect(resolveVehicleWithTypoTolerance('hilx', vehicles)?.model).toBe('HiLux');
    expect(resolveVehicleWithTypoTolerance('hiluks', vehicles)?.model).toBe('HiLux');

    // Camry typos
    expect(resolveVehicleWithTypoTolerance('camrry', vehicles)?.model).toBe('Camry');
    expect(resolveVehicleWithTypoTolerance('camryy', vehicles)?.model).toBe('Camry');
    expect(resolveVehicleWithTypoTolerance('camri', vehicles)?.model).toBe('Camry');

    // Tucson typos
    expect(resolveVehicleWithTypoTolerance('tuksan', vehicles)?.model).toBe('Tucson');
    expect(resolveVehicleWithTypoTolerance('tucsan', vehicles)?.model).toBe('Tucson');
  });

  // C. Date Variations
  it('C. Date variations -> resolves diverse expressions and Hinglish date formats', () => {
    const d1 = extractNaturalDates('Is Hilux available from 1 to 5 Sept?');
    expect(d1?.pickupDate).toBe('2026-09-01');
    expect(d1?.dropoffDate).toBe('2026-09-05');

    const d2 = extractNaturalDates('is hilux available 1-5 sept');
    expect(d2?.pickupDate).toBe('2026-09-01');
    expect(d2?.dropoffDate).toBe('2026-09-05');

    const d3 = extractNaturalDates('hilux chahiye 1 se 5 sept');
    expect(d3?.pickupDate).toBe('2026-09-01');
    expect(d3?.dropoffDate).toBe('2026-09-05');

    const d4 = extractNaturalDates('1-5 sept hilux milega?');
    expect(d4?.pickupDate).toBe('2026-09-01');
    expect(d4?.dropoffDate).toBe('2026-09-05');

    const d5 = extractNaturalDates('bhai hilux 1 se 5 ko free h?');
    expect(d5?.pickupDate).toBe('2026-09-01');
    expect(d5?.dropoffDate).toBe('2026-09-05');

    const d6 = extractNaturalDates('can i rent the hilux from sept first to fifth?');
    expect(d6?.pickupDate).toBe('2026-09-01');
    expect(d6?.dropoffDate).toBe('2026-09-05');

    const d7 = extractNaturalDates('can i get hilux for sept 1 till sept 5');
    expect(d7?.pickupDate).toBe('2026-09-01');
    expect(d7?.dropoffDate).toBe('2026-09-05');
  });

  // D & E. Casual English & Hinglish
  it('D & E. Casual English & Hinglish -> accurately classifies and resolves intents', async () => {
    // "hilux chahiye 1 se 5 sept"
    const res1 = await aiAgentService.processChat([
      { role: 'user', content: 'hilux chahiye 1 se 5 sept' },
    ]);
    expect(res1.availabilityCard).toBeDefined();
    expect(res1.availabilityCard?.vehicleName).toContain('HiLux');
    expect(res1.availabilityCard?.pickupDate).toBe('2026-09-01');
    expect(res1.availabilityCard?.dropoffDate).toBe('2026-09-05');

    // "camry 4 din ki kitne ki"
    const res2 = await aiAgentService.processChat([
      { role: 'user', content: 'camry 4 din ki kitne ki' },
    ]);
    expect(res2.priceCard).toBeDefined();
    expect(res2.priceCard?.rentalDays).toBe(4);
    expect(res2.priceCard?.finalAmount).toBeGreaterThan(0);

    // "family ke liye cheap car bata"
    const res3 = await aiAgentService.processChat([
      { role: 'user', content: 'family ke liye cheap car bata' },
    ]);
    expect(res3.suggestedVehicles).toBeDefined();
    expect(res3.suggestedVehicles?.length).toBeGreaterThan(0);

    // "bhai camry milegi kya?"
    const res4 = await aiAgentService.processChat([
      { role: 'user', content: 'bhai camry milegi kya?' },
    ]);
    expect(res4.suggestedVehicles).toBeDefined();
    expect(res4.suggestedVehicles?.[0].name).toContain('Camry');
  });

  // H. Ambiguous Vehicle Request
  it('H. Ambiguous request -> asks for clarification when multiple vehicles match', async () => {
    const res = await aiAgentService.processChat([{ role: 'user', content: 'show me the toyta' }]);
    expect(res.message.toLowerCase()).toContain('did you mean');
    expect(res.message.toLowerCase()).toContain('camry');
    expect(res.message.toLowerCase()).toContain('hilux');
  });

  // G. Multi-Turn Context Retention (Exact scenario from Section 14)
  it('G. Multi-turn contextual conversation retains context across turns', async () => {
    // Turn 1: User: "show me SUVs"
    const turn1 = await aiAgentService.processChat([{ role: 'user', content: 'show me SUVs' }]);
    expect(turn1.suggestedVehicles).toBeDefined();
    expect(turn1.suggestedVehicles?.length).toBe(2);

    // Turn 2: User: "which is cheapest?"
    const turn2 = await aiAgentService.processChat([
      { role: 'user', content: 'show me SUVs' },
      { role: 'assistant', content: turn1.message },
      { role: 'user', content: 'which is cheapest?' },
    ]);
    expect(turn2.message.toLowerCase()).toContain('tucson');
    expect(turn2.suggestedVehicles?.[0].name).toContain('Tucson');

    // Turn 3: User: "what about automatic?"
    const turn3 = await aiAgentService.processChat([
      { role: 'user', content: 'show me SUVs' },
      { role: 'assistant', content: turn1.message },
      { role: 'user', content: 'which is cheapest?' },
      { role: 'assistant', content: turn2.message },
      { role: 'user', content: 'what about automatic?' },
    ]);
    expect(turn3.message.toLowerCase()).toContain('automatic');

    // Turn 4: User: "I'll take the Tucson"
    const turn4 = await aiAgentService.processChat([
      { role: 'user', content: 'show me SUVs' },
      { role: 'assistant', content: turn1.message },
      { role: 'user', content: 'which is cheapest?' },
      { role: 'assistant', content: turn2.message },
      { role: 'user', content: 'what about automatic?' },
      { role: 'assistant', content: turn3.message },
      { role: 'user', content: "I'll take the Tucson" },
    ]);
    expect(turn4.suggestedVehicles?.[0].name).toContain('Tucson');

    // Turn 5: User: "for 4 days"
    const turn5 = await aiAgentService.processChat([
      { role: 'user', content: 'show me SUVs' },
      { role: 'assistant', content: turn1.message },
      { role: 'user', content: 'which is cheapest?' },
      { role: 'assistant', content: turn2.message },
      { role: 'user', content: 'what about automatic?' },
      { role: 'assistant', content: turn3.message },
      { role: 'user', content: "I'll take the Tucson" },
      { role: 'assistant', content: turn4.message },
      { role: 'user', content: 'for 4 days' },
    ]);
    expect(turn5.priceCard).toBeDefined();
    expect(turn5.priceCard?.rentalDays).toBe(4);
    expect(turn5.priceCard?.finalAmount).toBe(396);

    // Turn 6: User: "book it"
    const turn6 = await aiAgentService.processChat([
      { role: 'user', content: 'show me SUVs' },
      { role: 'assistant', content: turn1.message },
      { role: 'user', content: 'which is cheapest?' },
      { role: 'assistant', content: turn2.message },
      { role: 'user', content: 'what about automatic?' },
      { role: 'assistant', content: turn3.message },
      { role: 'user', content: "I'll take the Tucson" },
      { role: 'assistant', content: turn4.message },
      { role: 'user', content: 'for 4 days' },
      { role: 'assistant', content: turn5.message },
      { role: 'user', content: 'book it' },
    ]);
    expect(turn6.bookingDraft).toBeDefined();
    expect(turn6.bookingDraft?.bookingUrl).toContain('/book/v-006-tucson');
  });
});
