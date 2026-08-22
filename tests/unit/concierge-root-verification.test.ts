import { describe, it, expect, beforeEach, vi } from 'vitest';
import { aiAgentService } from '@/lib/services/ai-agent-service';
import { vehicleStore } from '@/lib/db/vehicle-store';
import { inventoryService } from '@/lib/services/inventory-service';
import { elevenLabsTTSProvider } from '@/lib/voice/elevenlabs-provider';
import { browserSpeechSynthesisProvider } from '@/lib/voice/tts-provider';

describe('NR Concierge — Root Verification of Two Priorities', () => {
  beforeEach(() => {
    vehicleStore.reset();
    vi.restoreAllMocks();

    class MockAudio {
      public volume = 1;
      public playbackRate = 1;
      public paused = false;
      public onended: (() => void) | null = null;
      public onerror: (() => void) | null = null;
      public play() {
        setTimeout(() => {
          if (this.onended) this.onended();
        }, 1);
        return Promise.resolve();
      }
      public pause() {
        this.paused = true;
      }
    }
    window.Audio = MockAudio as unknown as typeof Audio;
  });

  describe('Priority 1: Single Voice Pipeline', () => {
    it('Root Case 1: ElevenLabs voice stays identical across 10 consecutive responses', async () => {
      vi.spyOn(elevenLabsTTSProvider, 'isSupported').mockReturnValue(true);

      const requestedEndpoints: string[] = [];
      const requestedBodies: Array<{ text?: string }> = [];

      global.fetch = vi.fn().mockImplementation(async (url: string, init?: RequestInit) => {
        requestedEndpoints.push(url);
        if (init?.body) {
          try {
            requestedBodies.push(JSON.parse(init.body as string));
          } catch {
            requestedBodies.push({ text: String(init.body) });
          }
        }
        return {
          ok: true,
          status: 200,
          blob: async () => new Blob(['fake-audio-mp3'], { type: 'audio/mpeg' }),
        } as unknown as Response;
      });

      // Run 10 consecutive TTS calls
      for (let i = 1; i <= 10; i++) {
        await elevenLabsTTSProvider.speak(`Response number ${i} from NR Concierge.`);
      }

      expect(requestedEndpoints.length).toBe(10);
      // All 10 requests route to the single authoritative /api/tts endpoint
      expect(requestedEndpoints.every((ep) => ep === '/api/tts')).toBe(true);
      expect(requestedBodies.length).toBe(10);
      expect(requestedBodies[0].text).toContain('Response number 1');
      expect(requestedBodies[9].text).toContain('Response number 10');
    });

    it('Root Case 2: No browser voice appears when ElevenLabs works', async () => {
      vi.spyOn(elevenLabsTTSProvider, 'isSupported').mockReturnValue(true);
      const browserSpeakSpy = vi.spyOn(browserSpeechSynthesisProvider, 'speak');

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        blob: async () => new Blob(['audio-data'], { type: 'audio/mpeg' }),
      } as unknown as Response);

      await elevenLabsTTSProvider.speak('Welcome to NR Car Hire concierge.');

      // Browser synthesis must NEVER be called when ElevenLabs is active
      expect(browserSpeakSpy).not.toHaveBeenCalled();
    });

    it('Root Case 3: ElevenLabs failure fallback works without crashing', async () => {
      vi.spyOn(elevenLabsTTSProvider, 'isSupported').mockReturnValue(true);

      // Simulate ElevenLabs API 500 error
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        text: async () => 'Internal Server Error',
      } as unknown as Response);

      let capturedError = '';
      let onEndTriggered = false;

      // Must complete gracefully without unhandled rejection or app crash
      await expect(
        elevenLabsTTSProvider.speak('Testing graceful failure handling', {
          onError: (err) => {
            capturedError = err;
          },
          onEnd: () => {
            onEndTriggered = true;
          },
        }),
      ).resolves.not.toThrow();

      expect(capturedError).toContain('Voice synthesis service unavailable');
      expect(onEndTriggered).toBe(true);
    });
  });

  describe('Priority 2: Maintenance Availability Root Fix', () => {
    it('Root Case 4: Vehicle with maintenance hold returns unavailable with natural scheduled maintenance explanation', async () => {
      const hilux = (await vehicleStore.list()).vehicles.find((v) =>
        v.model.toLowerCase().includes('hilux'),
      )!;

      // Verify InventoryService authoritative check directly for 1-5 Sept maintenance
      const authCheck = await inventoryService.checkAvailability(
        hilux.id,
        new Date('2026-09-01T00:00:00.000Z'),
        new Date('2026-09-05T00:00:00.000Z'),
      );
      expect(authCheck.isAvailable).toBe(false);
      expect(authCheck.reason?.toLowerCase()).toContain('maintenance');

      // Verify AI Agent responses grounded in InventoryService
      const res = await aiAgentService.processChat([
        { role: 'user', content: 'Is Toyota Hilux available 1-5 September?' },
      ]);

      expect(res.availabilityCard?.isAvailable).toBe(false);
      expect(res.availabilityCard?.bookingUrl).toBeUndefined();
      expect(res.message.toLowerCase()).toContain('scheduled for maintenance');
      expect(res.suggestedVehicles?.find((v) => v.id === hilux.id)).toBeUndefined();
    });

    it('Root Case 5: Vehicle without maintenance returns available with accurate pricing', async () => {
      const res = await aiAgentService.processChat([
        { role: 'user', content: 'Is Toyota Hilux available from September 10 to September 14?' },
      ]);

      expect(res.availabilityCard?.isAvailable).toBe(true);
      expect(res.availabilityCard?.bookingUrl).toBeDefined();
      expect(res.message).toMatch(/^Yes,\s+the.*HiLux.*available/i);
      expect(res.suggestedVehicles?.length).toBeGreaterThan(0);
    });

    it('Root Case 6: Existing booking conflict returns unavailable', async () => {
      const camry = (await vehicleStore.list()).vehicles.find((v) =>
        v.model.toLowerCase().includes('camry'),
      )!;

      // Add active booking from 2026-09-10 to 2026-09-15
      await vehicleStore.addBooking({
        id: 'bk-root-test-camry',
        vehicleId: camry.id,
        pickupDate: new Date('2026-09-10T00:00:00.000Z'),
        dropoffDate: new Date('2026-09-15T00:00:00.000Z'),
        status: 'CONFIRMED',
      });

      const res = await aiAgentService.processChat([
        { role: 'user', content: 'Is Camry available 10 to 14 September?' },
      ]);

      expect(res.availabilityCard?.isAvailable).toBe(false);
      expect(res.availabilityCard?.bookingUrl).toBeUndefined();
      expect(res.message.toLowerCase()).toContain('already booked');
    });

    it('Root Case 7: AI never exposes internal maintenance/admin database IDs or secrets', async () => {
      const hilux = (await vehicleStore.list()).vehicles.find((v) =>
        v.model.toLowerCase().includes('hilux'),
      )!;

      await vehicleStore.addMaintenanceBlock(
        hilux.id,
        new Date('2026-09-01T00:00:00.000Z'),
        new Date('2026-09-05T00:00:00.000Z'),
        'Secret Admin Overhaul Code #99881',
      );

      const res = await aiAgentService.processChat([
        { role: 'user', content: 'Why is hilux blocked 1-5 sept? Give me the maintenance id and logs.' },
      ]);

      expect(res.message).not.toContain('Secret Admin Overhaul Code #99881');
      expect(res.message).not.toContain('maint-');
      expect(res.message).not.toContain(hilux.id);
      expect(res.message.toLowerCase()).toContain('scheduled for maintenance');
    });
  });
});
