import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ElevenLabsTTSProvider } from '@/lib/voice/elevenlabs-provider';

describe('ElevenLabs Single Voice Pipeline & Hardening', () => {
  let provider: ElevenLabsTTSProvider;

  beforeEach(() => {
    provider = new ElevenLabsTTSProvider();
    vi.restoreAllMocks();
    vi.spyOn(provider, 'isSupported').mockReturnValue(true);
  });

  afterEach(() => {
    provider.stop();
  });

  it('1. should handle ElevenLabs 401/500 API failure gracefully without crashing or throwing', async () => {
    // Mock fetch to simulate ElevenLabs error response
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      text: async () => JSON.stringify({ error: 'ElevenLabs API Error' }),
    } as unknown as Response);

    let errorReceived = '';
    let onEndCalled = false;

    await provider.speak('Welcome to NR Car Hire.', {
      onError: (err) => {
        errorReceived = err;
      },
      onEnd: () => {
        onEndCalled = true;
      },
    });

    expect(errorReceived).toContain('Voice synthesis service unavailable');
    expect(onEndCalled).toBe(true);
  });

  it('2. should handle network exception during fetch gracefully without crashing or throwing', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('Network down'));

    let errorReceived = '';
    let onEndCalled = false;

    await provider.speak('Testing network fault', {
      onError: (err) => {
        errorReceived = err;
      },
      onEnd: () => {
        onEndCalled = true;
      },
    });

    expect(errorReceived).toContain('Voice synthesis service unavailable');
    expect(onEndCalled).toBe(true);
  });

  it('3. should stop active audio playback on stop()', () => {
    provider.stop();
    expect(provider.isSpeaking()).toBe(false);
  });

  it('4. should pause and resume audio cleanly without throwing', () => {
    expect(() => {
      provider.pause();
      provider.resume();
    }).not.toThrow();
  });
});
