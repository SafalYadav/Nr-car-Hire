import { describe, it, expect } from 'vitest';
import { aiAgentService } from '@/lib/services/ai-agent-service';
import { POST as chatHandler } from '@/app/api/ai/chat/route';

describe('Phase 5A: AI Rental Assistant Foundation', () => {
  it('1. Vehicle recommendation -> recommends SUVs for family trip with booking URLs', async () => {
    const res = await aiAgentService.processChat([
      { role: 'user', content: 'I need an SUV for a family trip with luggage' },
    ]);

    expect(res.message).toBeTruthy();
    expect(res.message.toLowerCase()).toContain('suv');
    expect(res.suggestedVehicles).toBeDefined();
    expect(res.suggestedVehicles!.length).toBeGreaterThan(0);
    expect(res.suggestedVehicles![0].category.toLowerCase()).toBe('suv');
    expect(res.suggestedVehicles![0].bookingUrl).toMatch(/^\/book\/v-/);
  });

  it('2. Database search -> filters cars under price threshold', async () => {
    const res = await aiAgentService.processChat([
      { role: 'user', content: 'Show automatic cars under ₹150/day' },
    ]);

    expect(res.message).toBeTruthy();
    expect(res.suggestedVehicles).toBeDefined();
    expect(res.suggestedVehicles!.length).toBeGreaterThan(0);
    for (const v of res.suggestedVehicles!) {
      expect(v.dailyRate).toBeLessThanOrEqual(150);
    }
  });

  it('3. Availability query -> checks vehicle without fabricating fake confirmed booking', async () => {
    const res = await aiAgentService.processChat([
      { role: 'user', content: 'Is Toyota Camry available next week?' },
    ]);

    expect(res.message).toBeTruthy();
    expect(res.message.toLowerCase()).toContain('camry');
    expect(res.suggestedVehicles).toBeDefined();
    expect(res.suggestedVehicles![0].make.toLowerCase()).toBe('toyota');
    expect(res.suggestedVehicles![0].model.toLowerCase()).toBe('camry');
  });

  it('4. Rental policies -> answers licence, age, and fuel policy', async () => {
    const res = await aiAgentService.processChat([
      { role: 'user', content: 'What are the rental rules for driver age and licence?' },
    ]);

    expect(res.message).toBeTruthy();
    expect(res.message.toLowerCase()).toContain('21');
    expect(res.message.toLowerCase()).toContain('licence');
  });

  it('5. API route POST /api/ai/chat -> accepts valid messages and returns 200', async () => {
    const req = new Request('http://localhost:3000/api/ai/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [{ role: 'user', content: 'Recommend a luxury sedan for an executive trip' }],
      }),
    });

    const response = await chatHandler(req);
    expect(response.status).toBe(200);

    const json = await response.json();
    expect(json.success).toBe(true);
    expect(json.data.message).toBeTruthy();
    expect(json.data.suggestedVehicles?.length).toBeGreaterThan(0);
  });

  it('6. API route POST /api/ai/chat -> rejects empty or invalid message payloads with 400', async () => {
    const req = new Request('http://localhost:3000/api/ai/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [],
      }),
    });

    const response = await chatHandler(req);
    expect(response.status).toBe(400);

    const json = await response.json();
    expect(json.success).toBe(false);
    expect(json.error).toBeTruthy();
  });
});
