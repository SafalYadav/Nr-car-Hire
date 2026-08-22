import { describe, it, expect, beforeEach } from 'vitest';
import { VoiceService, getVoiceGreeting } from '@/lib/voice/voice-service';
import { formatTextForSpeech } from '@/lib/voice/tts-provider';
import { aiAgentService } from '@/lib/services/ai-agent-service';
import { vehicleStore } from '@/lib/db/vehicle-store';
import type {
  SpeechRecognitionProvider,
  TextToSpeechProvider,
  TextToSpeechOptions,
} from '@/lib/voice/types';

class MockSTTProvider implements SpeechRecognitionProvider {
  public isSupportedReturn = true;
  public isListening = false;
  private transcriptCb: ((transcript: string, isFinal: boolean) => void) | null = null;
  private errorCb: ((err: string, isPerm: boolean) => void) | null = null;
  private stateCb: ((listening: boolean) => void) | null = null;

  public isSupported(): boolean {
    return this.isSupportedReturn;
  }
  public start(): void {
    if (!this.isSupportedReturn) {
      if (this.errorCb) this.errorCb('Voice chat is not supported in this browser.', false);
      return;
    }
    this.isListening = true;
    if (this.stateCb) this.stateCb(true);
  }
  public stop(): void {
    this.isListening = false;
    if (this.stateCb) this.stateCb(false);
  }
  public abort(): void {
    this.isListening = false;
    if (this.stateCb) this.stateCb(false);
  }
  public onTranscript(cb: (t: string, f: boolean) => void): void {
    this.transcriptCb = cb;
  }
  public onError(cb: (e: string, p: boolean) => void): void {
    this.errorCb = cb;
  }
  public onStateChange(cb: (l: boolean) => void): void {
    this.stateCb = cb;
  }
  // Test helper
  public emitTranscript(t: string, f: boolean) {
    if (this.transcriptCb) this.transcriptCb(t, f);
  }
  public emitError(err: string, isPerm: boolean) {
    this.isListening = false;
    if (this.stateCb) this.stateCb(false);
    if (this.errorCb) this.errorCb(err, isPerm);
  }
}

class MockTTSProvider implements TextToSpeechProvider {
  public isSupportedReturn = true;
  public speaking = false;
  public lastSpokenText = '';

  public isSupported(): boolean {
    return this.isSupportedReturn;
  }
  public isSpeaking(): boolean {
    return this.speaking;
  }
  public async speak(text: string, options?: TextToSpeechOptions): Promise<void> {
    if (!this.isSupportedReturn) {
      if (options?.onError) options.onError('TTS not supported');
      return;
    }
    this.speaking = true;
    this.lastSpokenText = text;
    if (options?.onStart) options.onStart();
    this.speaking = false;
    if (options?.onEnd) options.onEnd();
  }
  public stop(): void {
    this.speaking = false;
  }
  public pause(): void {}
  public resume(): void {}
}

describe('Phase 5C Voice NR Concierge Agent', () => {
  let mockSTT: MockSTTProvider;
  let mockTTS: MockTTSProvider;
  let voiceService: VoiceService;

  beforeEach(() => {
    vehicleStore.reset();
    mockSTT = new MockSTTProvider();
    mockTTS = new MockTTSProvider();
    voiceService = new VoiceService(mockSTT, mockTTS);
  });

  it('1. Voice Provider Initialization & Support Detection', () => {
    expect(voiceService.isSupported()).toEqual({ stt: true, tts: true });
    expect(voiceService.getState()).toBe('IDLE');
    expect(voiceService.getLanguage()).toBe('en-AU');
  });

  it('2. Speech Recognition Start and Stop Lifecycle', () => {
    voiceService.startListening();
    expect(mockSTT.isListening).toBe(true);
    expect(voiceService.getState()).toBe('LISTENING');

    voiceService.stopListening();
    expect(mockSTT.isListening).toBe(false);
    expect(voiceService.getState()).toBe('IDLE');
  });

  it('3. Transcript Forwarding & Barge-In (stops active TTS when user speaks)', () => {
    let receivedTranscript = '';
    voiceService.setCallbacks({
      onStateChange: () => {},
      onTranscript: (t) => {
        receivedTranscript = t;
      },
      onError: () => {},
    });

    mockTTS.speaking = true;
    mockSTT.emitTranscript('I need an SUV', true);

    expect(receivedTranscript).toBe('I need an SUV');
    expect(mockTTS.speaking).toBe(false); // TTS stopped by barge-in
  });

  it('4. TTS Formatting: converts currency symbols, dash prices, date ranges, and strips raw Markdown', () => {
    const rawMarkdown =
      'The **Toyota Camry** is available at ₹89/day, total ₹356 for 4 days. [Book Here](/book/v-001-camry)';
    const cleanSpeech = formatTextForSpeech(rawMarkdown);

    expect(cleanSpeech).toContain('Toyota Camry');
    expect(cleanSpeech).toContain('89 rupees per day');
    expect(cleanSpeech).toContain('356 rupees');
    expect(cleanSpeech).not.toContain('**');
    expect(cleanSpeech).not.toContain('/book/v-001-camry');
    expect(cleanSpeech).not.toContain('₹');

    // Test dash before price: "Toyota Tucson — ₹99/day"
    const dashText = 'Toyota Tucson — ₹99/day';
    const cleanDash = formatTextForSpeech(dashText);
    expect(cleanDash).toBe('Toyota Tucson is 99 rupees per day');

    // Test date range conversion: "1–5 September"
    const dateRangeText = 'Available from 1-5 September';
    const cleanDate = formatTextForSpeech(dateRangeText);
    expect(cleanDate).toContain('September 1st to 5th');

    // Natural Greetings check
    expect(getVoiceGreeting('en-AU')).toBe('What would you like to have?');
    expect(getVoiceGreeting('hi-IN')).toContain('पसंद करेंगे');
    expect(getVoiceGreeting('gu-IN')).toContain('પસંદ કરશો');
  });

  it('5. Microphone Permission Denial Handling', () => {
    let errorReceived = '';
    let isPerm = false;
    voiceService.setCallbacks({
      onStateChange: () => {},
      onTranscript: () => {},
      onError: (err, p) => {
        errorReceived = err;
        isPerm = p;
      },
    });

    mockSTT.emitError('Microphone access is required for voice chat.', true);
    expect(voiceService.getState()).toBe('ERROR');
    expect(errorReceived).toContain('Microphone access is required');
    expect(isPerm).toBe(true);
  });

  it('6. Browser Unsupported Fallback', () => {
    mockSTT.isSupportedReturn = false;
    let errorReceived = '';
    voiceService.setCallbacks({
      onStateChange: () => {},
      onTranscript: () => {},
      onError: (err) => {
        errorReceived = err;
      },
    });

    voiceService.startListening();
    expect(errorReceived).toContain('not supported');
  });

  it('7. Multilingual Support: English, Hindi, Gujarati', () => {
    voiceService.setLanguage('hi-IN');
    expect(voiceService.getLanguage()).toBe('hi-IN');

    voiceService.setLanguage('gu-IN');
    expect(voiceService.getLanguage()).toBe('gu-IN');

    voiceService.setLanguage('en-AU');
    expect(voiceService.getLanguage()).toBe('en-AU');
  });

  it('8. Full Conversational Flow & Voice Context Continuity', async () => {
    // Step 1: User speaks "Hey, I need a family car."
    const t1 = await aiAgentService.processChat([
      { role: 'user', content: 'Hey, I need a family car.' },
    ]);
    expect(t1.suggestedVehicles).toBeDefined();

    // Step 2: User speaks "Five people and lots of luggage."
    const t2 = await aiAgentService.processChat([
      { role: 'user', content: 'Hey, I need a family car.' },
      { role: 'assistant', content: t1.message },
      { role: 'user', content: 'Five people and lots of luggage.' },
    ]);
    expect(t2.suggestedVehicles).toBeDefined();

    // Step 3: User speaks "Which one is cheaper?"
    const t3 = await aiAgentService.processChat([
      { role: 'user', content: 'Hey, I need a family car.' },
      { role: 'assistant', content: t1.message },
      { role: 'user', content: 'Five people and lots of luggage.' },
      { role: 'assistant', content: t2.message },
      { role: 'user', content: 'Which one is cheaper?' },
    ]);
    expect(t3.suggestedVehicles![0].dailyRate).toBeLessThanOrEqual(109);

    // Step 4: User speaks "Okay, I will take the Tucson."
    const t4 = await aiAgentService.processChat([
      { role: 'user', content: 'Hey, I need a family car.' },
      { role: 'assistant', content: t1.message },
      { role: 'user', content: 'Five people and lots of luggage.' },
      { role: 'assistant', content: t2.message },
      { role: 'user', content: 'Which one is cheaper?' },
      { role: 'assistant', content: t3.message },
      { role: 'user', content: 'Okay, I will take the Tucson.' },
    ]);
    expect(t4.suggestedVehicles![0].name).toContain('Tucson');

    // Step 5: User speaks "For five days."
    const t5 = await aiAgentService.processChat([
      { role: 'user', content: 'Okay, I will take the Tucson.' },
      { role: 'assistant', content: t4.message },
      { role: 'user', content: 'For five days.' },
    ]);
    expect(t5.priceCard?.rentalDays).toBe(5);

    // Step 6: User speaks "Is it available?"
    const t6 = await aiAgentService.processChat([
      { role: 'user', content: 'Okay, I will take the Tucson.' },
      { role: 'assistant', content: t4.message },
      { role: 'user', content: 'For five days.' },
      { role: 'assistant', content: t5.message },
      { role: 'user', content: 'Is it available?' },
    ]);
    expect(t6.availabilityCard?.isAvailable).toBe(true);

    // Step 7: User speaks "Actually, make it seven days."
    const t7 = await aiAgentService.processChat([
      { role: 'user', content: 'Okay, I will take the Tucson.' },
      { role: 'assistant', content: t4.message },
      { role: 'user', content: 'For five days.' },
      { role: 'assistant', content: t5.message },
      { role: 'user', content: 'Is it available?' },
      { role: 'assistant', content: t6.message },
      { role: 'user', content: 'Actually, make it seven days.' },
    ]);
    expect(t7.priceCard?.rentalDays).toBe(7);

    // Step 8: User speaks "Book it." -> Secure booking handoff (no auto payment)
    const t8 = await aiAgentService.processChat([
      { role: 'user', content: 'Okay, I will take the Tucson.' },
      { role: 'assistant', content: t4.message },
      { role: 'user', content: 'For five days.' },
      { role: 'assistant', content: t5.message },
      { role: 'user', content: 'Is it available?' },
      { role: 'assistant', content: t6.message },
      { role: 'user', content: 'Actually, make it seven days.' },
      { role: 'assistant', content: t7.message },
      { role: 'user', content: 'Book it.' },
    ]);
    expect(t8.bookingDraft).toBeDefined();
    expect(t8.bookingDraft?.bookingUrl).toContain('/book/v-006-tucson');
  });

  it('9. Voice Maintenance Availability Protection: HiLux is unavailable 1-5 Sept', async () => {
    const res = await aiAgentService.processChat([
      { role: 'user', content: 'Is the Hilux available from September 1st to September 5th?' },
    ]);
    expect(res.availabilityCard?.isAvailable).toBe(false);
    expect(res.availabilityCard?.bookingUrl).toBeUndefined();
    expect(res.message.toLowerCase()).toContain('scheduled maintenance');

    // Fresh availability check for 10-15 Sept is available
    const freshRes = await aiAgentService.processChat([
      { role: 'user', content: 'Is the Hilux available from September 10th to September 15th?' },
    ]);
    expect(freshRes.availabilityCard?.isAvailable).toBe(true);
    expect(freshRes.availabilityCard?.bookingUrl).toBeDefined();
  });
});
