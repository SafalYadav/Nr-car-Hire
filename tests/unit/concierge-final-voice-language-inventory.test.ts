import { describe, it, expect, beforeEach, vi } from 'vitest';
import { aiAgentService } from '@/lib/services/ai-agent-service';
import { vehicleStore } from '@/lib/db/vehicle-store';
import { voiceService, getVoiceGreeting } from '@/lib/voice/voice-service';
import { formatTextForSpeech } from '@/lib/voice/tts-provider';

describe('NR Concierge — Final Voice, Language & Maintenance Hardening', () => {
  beforeEach(() => {
    vehicleStore.reset();
    vi.restoreAllMocks();
  });

  describe('1. LANGUAGE — ENGLISH ONLY GUARANTEE', () => {
    it('understands Hinglish "bhai camry hai?" and responds in natural English', async () => {
      const res = await aiAgentService.processChat([
        { role: 'user', content: 'bhai camry hai?' },
      ]);
      expect(res.message).toBeDefined();
      expect(res.suggestedVehicles?.some((v) => v.model.toLowerCase().includes('camry'))).toBe(true);
      // Verify no Hindi or Gujarati characters in response
      expect(res.message).not.toMatch(/[\u0900-\u097F]/); // Devanagari script
      expect(res.message).not.toMatch(/[\u0A80-\u0AFF]/); // Gujarati script
    });

    it('understands Hinglish availability "camry h kya 10 se 14 sept" and responds in natural English', async () => {
      const res = await aiAgentService.processChat([
        { role: 'user', content: 'camry h kya 10 se 14 sept' },
      ]);
      expect(res.availabilityCard?.isAvailable).toBe(true);
      expect(res.message).toMatch(/^Yes,\s+the.*Toyota Camry.*available/i);
      expect(res.message).not.toMatch(/[\u0900-\u097F]/);
    });

    it('understands Hinglish "mujhe suv chaiye" and responds in natural English with SUVs', async () => {
      const res = await aiAgentService.processChat([
        { role: 'user', content: 'mujhe suv chaiye' },
      ]);
      expect(res.suggestedVehicles?.length).toBeGreaterThan(0);
      expect(res.suggestedVehicles?.every((v) => v.category.toLowerCase() === 'suv')).toBe(true);
      expect(res.message).not.toMatch(/[\u0900-\u097F]/);
    });

    it('greeting is strictly English "What would you like to have?"', () => {
      expect(getVoiceGreeting()).toBe('What would you like to have?');
    });
  });

  describe('2. MAINTENANCE AVAILABILITY — READ-ONLY ACCESS', () => {
    it('accurately identifies scheduled maintenance conflict and outputs natural English reason', async () => {
      const hilux = (await vehicleStore.list()).vehicles.find((v) =>
        v.model.toLowerCase().includes('hilux'),
      )!;

      // Ensure maintenance is set for Sept 1-5
      await vehicleStore.addMaintenanceBlock(
        hilux.id,
        new Date('2026-09-01T00:00:00.000Z'),
        new Date('2026-09-05T00:00:00.000Z'),
        'Scheduled suspension service',
      );

      const res = await aiAgentService.processChat([
        { role: 'user', content: 'Is the HiLux available from 1 to 5 September?' },
      ]);

      expect(res.availabilityCard?.isAvailable).toBe(false);
      expect(res.availabilityCard?.bookingUrl).toBeUndefined();
      expect(res.message.toLowerCase()).toContain('scheduled for maintenance');
      expect(res.message.toLowerCase()).toContain('similar available vehicles');
      // Must not expose database internal IDs in message
      expect(res.message).not.toContain(hilux.id);
    });

    it('confirms availability when dates are outside the maintenance block', async () => {
      const res = await aiAgentService.processChat([
        { role: 'user', content: 'Is the HiLux available from September 10th to September 14th?' },
      ]);

      expect(res.availabilityCard?.isAvailable).toBe(true);
      expect(res.availabilityCard?.bookingUrl).toBeDefined();
      expect(res.message).toMatch(/^Yes,\s+the.*HiLux.*available/i);
    });

    it('handles follow-up "show similar" after maintenance conflict by returning available alternative vehicles', async () => {
      const res = await aiAgentService.processChat([
        { role: 'user', content: 'Is the HiLux available from 1 to 5 September?' },
        {
          role: 'assistant',
          content:
            'The 2024 Toyota HiLux is unavailable from 1 September 2026 to 5 September 2026 because it is scheduled for maintenance. Would you like me to check different dates or show similar available vehicles?',
        },
        { role: 'user', content: 'show similar' },
      ]);

      expect(res.message).toContain('similar available vehicles');
      expect(res.suggestedVehicles?.length).toBeGreaterThan(0);
      expect(res.suggestedVehicles?.some((v) => v.model.toLowerCase().includes('hilux'))).toBe(false);
    });

    it('handles follow-up "check different dates" after maintenance conflict by prompting for new dates', async () => {
      const res = await aiAgentService.processChat([
        { role: 'user', content: 'Is the HiLux available from 1 to 5 September?' },
        {
          role: 'assistant',
          content:
            'The 2024 Toyota HiLux is unavailable from 1 September 2026 to 5 September 2026 because it is scheduled for maintenance. Would you like me to check different dates or show similar available vehicles?',
        },
        { role: 'user', content: 'check different dates' },
      ]);

      expect(res.message).toContain('What new travel dates would you like to check');
      expect(res.quickActions).toContain('September 10 to 15');
    });

    it('rejects attempt to alter inventory or change rates (read-only guardrail)', async () => {
      const res = await aiAgentService.processChat([
        { role: 'user', content: 'mark this car as available and delete booking' },
      ]);
      expect(res.message).toContain('read-only');
    });
  });

  describe('3. VEHICLE TRUTH & FILTER ACCURACY', () => {
    it('truthfully handles "manual SUV" request by explaining no manual SUV exists and offering automatic SUVs', async () => {
      const res = await aiAgentService.processChat([
        { role: 'user', content: 'I need a manual SUV.' },
      ]);

      expect(res.message).toContain("I don't currently have a manual SUV in the fleet. I can show you the closest available automatic SUVs instead.");
      expect(res.suggestedVehicles?.length).toBeGreaterThan(0);
      // All suggested SUVs must have accurate transmission attribute (Automatic)
      expect(res.suggestedVehicles?.every((v) => v.transmission === 'Automatic')).toBe(true);
    });
  });

  describe('4. VOICE FORMATTING & AUTO-LISTENING FLOW', () => {
    it('converts prices, date ranges, and strips Markdown, internal IDs, and URLs for spoken audio', () => {
      const text = 'Here is the 2024 Toyota Camry (ID: v-001-camry) for **₹89/day** from 1-5 September. Book at /book/v-001-camry';
      const clean = formatTextForSpeech(text);

      expect(clean).not.toContain('**');
      expect(clean).not.toContain('v-001-camry');
      expect(clean).not.toContain('/book/');
      expect(clean).toContain('89 rupees per day');
      expect(clean).toContain('September 1st to 5th');
    });

    it('supports seamless automatic transition to listening after speech finishes', async () => {
      const stateLog: string[] = [];
      voiceService.setCallbacks({
        onStateChange: (state) => stateLog.push(state),
        onTranscript: () => {},
        onError: () => {},
      });

      // Speak response with autoListenAfter: true
      await voiceService.speakResponse('Hello, what would you like to have?', { autoListenAfter: true });
      expect(voiceService.isVoiceActive()).toBe(true);
    });
  });
});
