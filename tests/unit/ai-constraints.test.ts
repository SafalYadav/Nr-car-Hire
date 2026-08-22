import { describe, it, expect } from 'vitest';
import { aiAgentService } from '@/lib/services/ai-agent-service';

describe('Phase 5D - Hard Constraint Extraction', () => {
  it('should remove manual vehicles if automatic is requested', async () => {
    const res = await aiAgentService.processChat([
      { role: 'user', content: 'I want an automatic car' },
    ]);

    // Toyota Hilux is manual in the db. It should NOT be returned.
    const hilux = res.suggestedVehicles?.find(
      (v) => v.model === 'HiLux' || v.transmission === 'Manual',
    );
    expect(hilux).toBeUndefined();

    // But it should return vehicles, e.g. automatic ones
    expect(res.suggestedVehicles?.length).toBeGreaterThan(0);
    expect(res.suggestedVehicles?.every((v) => v.transmission === 'Automatic')).toBe(true);
  });

  it('should allow manual cars if requested', async () => {
    const res = await aiAgentService.processChat([
      { role: 'user', content: 'Actually manual is okay' },
    ]);
    expect(res.suggestedVehicles?.length).toBeGreaterThan(0);
  });

  it('should enforce min seats constraint', async () => {
    const res = await aiAgentService.processChat([
      { role: 'user', content: 'I need a car for 7 people' },
    ]);
    expect(res.suggestedVehicles?.every((v) => v.seats >= 7)).toBe(true);
  });
});
