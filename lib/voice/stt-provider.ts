import type {
  SpeechRecognitionProvider,
  SpeechRecognitionOptions,
  SupportedVoiceLanguage,
} from './types';

interface SpeechRecognitionEvent {
  resultIndex: number;
  results: {
    length: number;
    [index: number]: {
      isFinal: boolean;
      [altIndex: number]: {
        transcript: string;
      };
    };
  };
}

interface SpeechRecognitionErrorEvent {
  error: string;
  message?: string;
}

interface ISpeechRecognitionInstance {
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  lang: string;
  onstart: (() => void) | null;
  onend: (() => void) | null;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}

interface IWindowWithSpeech extends Window {
  SpeechRecognition?: new () => ISpeechRecognitionInstance;
  webkitSpeechRecognition?: new () => ISpeechRecognitionInstance;
}

export class BrowserSpeechRecognitionProvider implements SpeechRecognitionProvider {
  private recognition: ISpeechRecognitionInstance | null = null;
  private isCurrentlyListening = false;
  private transcriptCallback: ((transcript: string, isFinal: boolean) => void) | null = null;
  private errorCallback: ((errorMessage: string, isPermissionError: boolean) => void) | null = null;
  private stateChangeCallback: ((isListening: boolean) => void) | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      const win = window as unknown as IWindowWithSpeech;
      const SpeechRecognitionClass = win.SpeechRecognition || win.webkitSpeechRecognition;
      if (SpeechRecognitionClass) {
        this.recognition = new SpeechRecognitionClass();
        this.setupListeners();
      }
    }
  }

  public isSupported(): boolean {
    if (typeof window === 'undefined') return false;
    const win = window as unknown as IWindowWithSpeech;
    return !!(win.SpeechRecognition || win.webkitSpeechRecognition);
  }

  private setupListeners(): void {
    if (!this.recognition) return;

    this.recognition.continuous = false;
    this.recognition.interimResults = true;
    this.recognition.maxAlternatives = 1;

    this.recognition.onstart = () => {
      this.isCurrentlyListening = true;
      if (this.stateChangeCallback) {
        this.stateChangeCallback(true);
      }
    };

    this.recognition.onend = () => {
      this.isCurrentlyListening = false;
      if (this.stateChangeCallback) {
        this.stateChangeCallback(false);
      }
    };

    this.recognition.onresult = (event: SpeechRecognitionEvent) => {
      let finalTranscript = '';
      let interimTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const item = event.results[i];
        if (item.isFinal) {
          finalTranscript += item[0].transcript;
        } else {
          interimTranscript += item[0].transcript;
        }
      }

      if (finalTranscript.trim() && this.transcriptCallback) {
        this.transcriptCallback(finalTranscript.trim(), true);
      } else if (interimTranscript.trim() && this.transcriptCallback) {
        this.transcriptCallback(interimTranscript.trim(), false);
      }
    };

    this.recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      this.isCurrentlyListening = false;
      if (this.stateChangeCallback) {
        this.stateChangeCallback(false);
      }

      const errorType = event.error || 'unknown';
      const isPermissionDenied = errorType === 'not-allowed' || errorType === 'service-not-allowed';

      let customerMessage = "Sorry, I didn't catch that. Try again?";
      if (isPermissionDenied) {
        customerMessage =
          'Microphone access is required for voice chat. You can continue using text chat.';
      } else if (errorType === 'no-speech') {
        customerMessage = "Sorry, I didn't catch that. Try again?";
      } else if (errorType === 'network') {
        customerMessage =
          'Network connection issue with speech service. Please try again or use text chat.';
      } else if (errorType === 'audio-capture') {
        customerMessage = 'Microphone not detected. Please ensure your microphone is connected.';
      }

      if (this.errorCallback) {
        this.errorCallback(customerMessage, isPermissionDenied);
      }
    };
  }

  public async start(options: SpeechRecognitionOptions = {}): Promise<void> {
    if (!this.isSupported() || !this.recognition) {
      if (this.errorCallback) {
        this.errorCallback(
          'Voice chat is not supported in this browser. You can continue with text chat.',
          false,
        );
      }
      return;
    }

    try {
      const targetLang = this.mapLanguage(options.lang || 'en-AU');
      this.recognition.lang = targetLang;
      this.recognition.continuous = options.continuous ?? false;
      this.recognition.interimResults = options.interimResults ?? true;

      this.recognition.start();
    } catch (err: unknown) {
      const isInvalidState = err instanceof Error && err.name === 'InvalidStateError';
      if (!isInvalidState) {
        if (this.errorCallback) {
          this.errorCallback('Could not start microphone. Please try again.', false);
        }
      }
    }
  }

  public stop(): void {
    if (this.recognition && this.isCurrentlyListening) {
      try {
        this.recognition.stop();
      } catch {
        // Ignore stop on inactive recognition
      }
    }
    this.isCurrentlyListening = false;
    if (this.stateChangeCallback) {
      this.stateChangeCallback(false);
    }
  }

  public abort(): void {
    if (this.recognition) {
      try {
        this.recognition.abort();
      } catch {
        // Ignore abort errors
      }
    }
    this.isCurrentlyListening = false;
    if (this.stateChangeCallback) {
      this.stateChangeCallback(false);
    }
  }

  public onTranscript(callback: (transcript: string, isFinal: boolean) => void): void {
    this.transcriptCallback = callback;
  }

  public onError(callback: (errorMessage: string, isPermissionError: boolean) => void): void {
    this.errorCallback = callback;
  }

  public onStateChange(callback: (isListening: boolean) => void): void {
    this.stateChangeCallback = callback;
  }

  private mapLanguage(lang: SupportedVoiceLanguage): string {
    switch (lang) {
      case 'en-US':
        return 'en-US';
      case 'en-AU':
      case 'auto':
      default:
        return 'en-AU';
    }
  }
}

export const browserSpeechRecognitionProvider = new BrowserSpeechRecognitionProvider();
