import { describe, it, expect, beforeEach } from 'vitest';
import { aiAgentService } from '@/lib/services/ai-agent-service';
import { vehicleStore } from '@/lib/db/vehicle-store';

describe('Phase 5B Final Agent Intelligence Upgrade', () => {
  beforeEach(() => {
    vehicleStore.reset();
  });

  it('1. Handles casual Hinglish & conversational shortcuts seamlessly', async () => {
    const res = await aiAgentService.processChat([
      { role: 'user', content: 'bhai family ke liye car' },
    ]);
    expect(res.message.toLowerCase()).toContain('family');
    expect(res.suggestedVehicles).toBeDefined();
    expect(res.suggestedVehicles!.length).toBeGreaterThan(0);
  });

  it('2. Handles budget requests & "thoda sasta" / "aur sasti"', async () => {
    const res = await aiAgentService.processChat([{ role: 'user', content: 'aur sasti dikha' }]);
    expect(res.message.toLowerCase()).toContain('affordable');
    expect(res.suggestedVehicles?.[0].dailyRate).toBeLessThanOrEqual(99);
  });

  it('3. Handles luxury / "best wali kaunsi hai?"', async () => {
    const res = await aiAgentService.processChat([
      { role: 'user', content: 'best wali kaunsi hai?' },
    ]);
    expect(res.message.toLowerCase()).toContain('mercedes');
    expect(res.suggestedVehicles?.some((v) => v.category === 'Luxury')).toBe(true);
  });

  it('4. Handles attribute inquiry: luggage capacity ("isme luggage kitna aayega")', async () => {
    const res = await aiAgentService.processChat([
      { role: 'user', content: 'camry' },
      { role: 'assistant', content: 'Camry selected.' },
      { role: 'user', content: 'isme luggage kitna aayega?' },
    ]);
    expect(res.message.toLowerCase()).toContain('luggage');
    expect(res.message.toLowerCase()).toContain('suitcases');
  });

  it('5. Handles attribute inquiry: passenger capacity ("kitne log baith sakte hain")', async () => {
    const res = await aiAgentService.processChat([
      { role: 'user', content: 'hilux' },
      { role: 'assistant', content: 'HiLux selected.' },
      { role: 'user', content: 'kitne log baith sakte hain?' },
    ]);
    expect(res.message.toLowerCase()).toContain('seats');
    expect(res.message.toLowerCase()).toContain('passengers');
  });

  it('6. Handles cancellation / interruption ("ruk cancel")', async () => {
    const res = await aiAgentService.processChat([
      { role: 'user', content: 'camry 10-15 sept' },
      { role: 'assistant', content: 'Camry available.' },
      { role: 'user', content: 'book it' },
      { role: 'assistant', content: 'Booking draft created.' },
      { role: 'user', content: 'ruk cancel' },
    ]);
    expect(res.bookingDraft).toBeUndefined();
    expect(res.message.toLowerCase()).toContain('paused');
  });

  it('7. Handles out-of-domain queries gracefully without breaking character', async () => {
    const res = await aiAgentService.processChat([
      { role: 'user', content: 'write me a Python program to sort a list' },
    ]);
    expect(res.message.toLowerCase()).toContain('nr concierge');
    expect(res.message.toLowerCase()).toContain('car hire');
    expect(res.message.toLowerCase()).not.toContain('def sort_list');
  });

  it('8. Clean typography: Zero raw markdown asterisks (**) or code backticks', async () => {
    const res = await aiAgentService.processChat([
      { role: 'user', content: 'tell me about toyota camry and pricing' },
    ]);
    expect(res.message).not.toContain('**');
    expect(res.message).not.toContain('`');
    expect(res.message).not.toContain('###');
  });

  it('9. Fluid Multi-Turn Conversation with references & corrections', async () => {
    // Turn 1: family ke liye SUV dikha
    const t1 = await aiAgentService.processChat([
      { role: 'user', content: 'family ke liye SUV dikha' },
    ]);
    expect(t1.suggestedVehicles).toBeDefined();

    // Turn 2: pehli wali (selects index 0)
    const t2 = await aiAgentService.processChat([
      { role: 'user', content: 'family ke liye SUV dikha' },
      { role: 'assistant', content: t1.message },
      { role: 'user', content: 'pehli wali' },
    ]);
    expect(t2.suggestedVehicles).toBeDefined();

    // Turn 3: 5 din ke liye
    const t3 = await aiAgentService.processChat([
      { role: 'user', content: 'family ke liye SUV dikha' },
      { role: 'assistant', content: t1.message },
      { role: 'user', content: 'pehli wali' },
      { role: 'assistant', content: t2.message },
      { role: 'user', content: '5 din ke liye' },
    ]);
    expect(t3.priceCard?.rentalDays).toBe(5);

    // Turn 4: actually 7 din
    const t4 = await aiAgentService.processChat([
      { role: 'user', content: 'family ke liye SUV dikha' },
      { role: 'assistant', content: t1.message },
      { role: 'user', content: 'pehli wali' },
      { role: 'assistant', content: t2.message },
      { role: 'user', content: '5 din ke liye' },
      { role: 'assistant', content: t3.message },
      { role: 'user', content: 'actually 7 din' },
    ]);
    expect(t4.priceCard?.rentalDays).toBe(7);

    // Turn 5: nahi camry kar
    const t5 = await aiAgentService.processChat([
      { role: 'user', content: 'family ke liye SUV dikha' },
      { role: 'assistant', content: t1.message },
      { role: 'user', content: 'pehli wali' },
      { role: 'assistant', content: t2.message },
      { role: 'user', content: '5 din ke liye' },
      { role: 'assistant', content: t3.message },
      { role: 'user', content: 'actually 7 din' },
      { role: 'assistant', content: t4.message },
      { role: 'user', content: 'nahi camry kar' },
    ]);
    expect(t5.suggestedVehicles?.[0].name).toContain('Camry');
  });
});
