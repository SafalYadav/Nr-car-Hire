export type VoiceState = 'IDLE' | 'LISTENING' | 'PROCESSING' | 'SPEAKING' | 'ERROR';

export type SupportedVoiceLanguage = 'en-AU' | 'en-US' | 'auto';

export interface SpeechRecognitionOptions {
  lang?: SupportedVoiceLanguage;
  continuous?: boolean;
  interimResults?: boolean;
}

export interface SpeechRecognitionProvider {
  start(options?: SpeechRecognitionOptions): void | Promise<void>;
  stop(): void;
  abort(): void;
  isSupported(): boolean;
  onTranscript(callback: (transcript: string, isFinal: boolean) => void): void;
  onError(callback: (errorMessage: string, isPermissionError: boolean) => void): void;
  onStateChange(callback: (isListening: boolean) => void): void;
}

export interface TextToSpeechOptions {
  lang?: SupportedVoiceLanguage;
  rate?: number;
  pitch?: number;
  volume?: number;
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (error: string) => void;
}

export interface TextToSpeechProvider {
  speak(text: string, options?: TextToSpeechOptions): Promise<void>;
  stop(): void;
  pause(): void;
  resume(): void;
  isSpeaking(): boolean;
  isSupported(): boolean;
}
