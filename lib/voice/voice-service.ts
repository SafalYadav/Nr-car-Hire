import type {
  VoiceState,
  SupportedVoiceLanguage,
  SpeechRecognitionProvider,
  TextToSpeechProvider,
} from './types';
import { browserSpeechRecognitionProvider } from './stt-provider';
import { elevenLabsTTSProvider } from './elevenlabs-provider';

export interface VoiceServiceCallbacks {
  onStateChange: (state: VoiceState) => void;
  onTranscript: (transcript: string, isFinal: boolean) => void;
  onError: (errorMessage: string, isPermissionError: boolean) => void;
}

/**
 * Service to manage Voice interactions (STT & TTS)
 */
export class VoiceService {
  private isVoiceModeActive = false;
  private isListeningActive = false;
  private stt: SpeechRecognitionProvider;
  private tts: TextToSpeechProvider;
  private currentState: VoiceState = 'IDLE';
  private currentLanguage: SupportedVoiceLanguage = 'en-AU';
  private callbacks: VoiceServiceCallbacks | null = null;
  private isProcessing = false;

  constructor(
    stt: SpeechRecognitionProvider = browserSpeechRecognitionProvider,
    tts: TextToSpeechProvider = elevenLabsTTSProvider,
  ) {
    this.stt = stt;
    this.tts = tts;
    this.setupProviderListeners();
  }

  public isSupported(): { stt: boolean; tts: boolean } {
    return {
      stt: this.stt.isSupported(),
      tts: this.tts.isSupported(),
    };
  }

  public setCallbacks(callbacks: VoiceServiceCallbacks): void {
    this.callbacks = callbacks;
  }

  public setLanguage(lang: SupportedVoiceLanguage): void {
    this.currentLanguage = lang;
  }

  public getLanguage(): SupportedVoiceLanguage {
    return this.currentLanguage;
  }

  public getState(): VoiceState {
    return this.currentState;
  }

  public isVoiceActive(): boolean {
    return this.isVoiceModeActive;
  }

  private setState(newState: VoiceState): void {
    this.currentState = newState;
    if (this.callbacks) {
      this.callbacks.onStateChange(newState);
    }
  }

  private setupProviderListeners(): void {
    this.stt.onTranscript((transcript, isFinal) => {
      // Barge-in: if user speaks while TTS is active, stop TTS immediately
      if (this.tts.isSpeaking()) {
        this.tts.stop();
      }

      if (this.callbacks) {
        this.callbacks.onTranscript(transcript, isFinal);
      }
    });

    this.stt.onError((errorMessage, isPermissionError) => {
      this.setState('ERROR');
      if (this.callbacks) {
        this.callbacks.onError(errorMessage, isPermissionError);
      }
    });

    this.stt.onStateChange((isListening) => {
      if (isListening) {
        this.setState('LISTENING');
      } else if (this.currentState === 'LISTENING') {
        if (!this.isProcessing && !this.tts.isSpeaking()) {
          this.setState('IDLE');
        }
      }
    });
  }

  /**
   * Start listening for voice input
   */
  public async startListening(): Promise<void> {
    // Interruption / barge-in: cancel any active speech
    this.stopSpeaking();

    this.isVoiceModeActive = true;
    this.setState('LISTENING');

    await this.stt.start({
      lang: this.currentLanguage,
      continuous: false,
      interimResults: true,
    });
  }

  /**
   * Stop listening
   */
  public stopListening(): void {
    this.stt.stop();
    if (this.currentState === 'LISTENING') {
      this.setState('IDLE');
    }
  }

  /**
   * Stop all voice activity (both listening and speaking)
   */
  public stopAll(): void {
    this.isVoiceModeActive = false;
    this.stt.abort();
    this.tts.stop();
    this.setState('IDLE');
  }

  /**
   * Stop speech playback (barge-in / mute)
   */
  public stopSpeaking(): void {
    this.tts.stop();
    if (this.currentState === 'SPEAKING') {
      this.setState('IDLE');
    }
  }

  /**
   * Speak the assistant's response and transition states cleanly
   */
  public async speakResponse(
    text: string,
    options: {
      autoListenAfter?: boolean;
    } = {},
  ): Promise<void> {
    if (!this.tts.isSupported() || !text) {
      this.setState('IDLE');
      return;
    }

    // Guarantee STT is stopped before speech starts
    this.stt.stop();
    this.setState('SPEAKING');

    await this.tts.speak(text, {
      lang: this.currentLanguage,
      onStart: () => {
        this.stt.stop();
        this.setState('SPEAKING');
      },
      onEnd: () => {
        if (options.autoListenAfter !== false) {
          this.isVoiceModeActive = true;
          this.startListening();
        } else {
          this.setState('IDLE');
        }
      },
      onError: () => {
        if (options.autoListenAfter) {
          this.isVoiceModeActive = true;
          this.startListening();
        } else {
          this.setState('IDLE');
        }
      },
    });
  }

  /**
   * Set processing state when AI call is in-flight
   */
  public setProcessing(isProcessing: boolean): void {
    this.isProcessing = isProcessing;
    if (isProcessing) {
      this.stt.stop();
      this.setState('PROCESSING');
    }
  }
}

export const voiceService = new VoiceService();

export function getVoiceGreeting(): string {
  return 'What would you like to have?';
}
