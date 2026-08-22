import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ElevenLabsTTSProvider } from '@/lib/voice/elevenlabs-provider';
import { browserSpeechSynthesisProvider } from '@/lib/voice/tts-provider';

describe('ElevenLabs TTS Provider & Fallback Hardening', () => {
  let provider: ElevenLabsTTSProvider;

  beforeEach(() => {
    provider = new ElevenLabsTTSProvider();
    vi.spyOn(provider, 'isSupported').mockReturnValue(true);
    vi.spyOn(browserSpeechSynthesisProvider, 'isSupported').mockReturnValue(true);
    vi.restoreAllMocks();
    vi.spyOn(provider, 'isSupported').mockReturnValue(true);
    vi.spyOn(browserSpeechSynthesisProvider, 'isSupported').mockReturnValue(true);
  });

  afterEach(() => {
    provider.stop();
  });

  it('1. should gracefully handle ElevenLabs 401/500 API failure by falling back to browser speech synthesis', async () => {
    // Mock fetch to simulate ElevenLabs 401 Unauthorized
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      text: async () => JSON.stringify({ error: 'ElevenLabs API Error' }),
    } as unknown as Response);

    const browserSpeakSpy = vi
      .spyOn(browserSpeechSynthesisProvider, 'speak')
      .mockImplementation(async (_text, options) => {
        if (options?.onStart) options.onStart();
        if (options?.onEnd) options.onEnd();
      });

    let onStartCalled = false;
    let onEndCalled = false;

    await provider.speak('Welcome to NR Car Hire.', {
      onStart: () => {
        onStartCalled = true;
      },
      onEnd: () => {
        onEndCalled = true;
      },
    });

    expect(browserSpeakSpy).toHaveBeenCalledTimes(1);
    expect(onStartCalled).toBe(true);
    expect(onEndCalled).toBe(true);
  });

  it('2. should gracefully handle network exception during fetch without crashing or throwing', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('Network down'));

    const browserSpeakSpy = vi
      .spyOn(browserSpeechSynthesisProvider, 'speak')
      .mockImplementation(async (_text, options) => {
        if (options?.onEnd) options.onEnd();
      });

    let onEndCalled = false;
    await provider.speak('Testing network fault', {
      onEnd: () => {
        onEndCalled = true;
      },
    });

    expect(browserSpeakSpy).toHaveBeenCalledTimes(1);
    expect(onEndCalled).toBe(true);
  });

  it('3. should stop both ElevenLabs audio and browser speech synthesis on stop()', () => {
    const browserStopSpy = vi.spyOn(browserSpeechSynthesisProvider, 'stop');
    provider.stop();
    expect(browserStopSpy).toHaveBeenCalled();
    expect(provider.isSpeaking()).toBe(false);
  });

  it('4. should pause and resume both providers cleanly', () => {
    const browserPauseSpy = vi.spyOn(browserSpeechSynthesisProvider, 'pause');
    const browserResumeSpy = vi.spyOn(browserSpeechSynthesisProvider, 'resume');

    provider.pause();
    expect(browserPauseSpy).toHaveBeenCalled();

    provider.resume();
    expect(browserResumeSpy).toHaveBeenCalled();
  });
});
