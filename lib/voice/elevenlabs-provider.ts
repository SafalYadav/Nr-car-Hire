import type { TextToSpeechProvider, TextToSpeechOptions } from './types';
import { formatTextForSpeech, browserSpeechSynthesisProvider } from './tts-provider';

export class ElevenLabsTTSProvider implements TextToSpeechProvider {
  private isSpeakingActive = false;
  private audioObject: HTMLAudioElement | null = null;
  private currentObjectUrl: string | null = null;

  public isSupported(): boolean {
    return (
      typeof window !== 'undefined' &&
      (typeof Audio !== 'undefined' || browserSpeechSynthesisProvider.isSupported())
    );
  }

  public isSpeaking(): boolean {
    const isAudioPlaying = this.audioObject !== null && !this.audioObject.paused;
    return this.isSpeakingActive || isAudioPlaying || browserSpeechSynthesisProvider.isSpeaking();
  }

  public async speak(text: string, options: TextToSpeechOptions = {}): Promise<void> {
    if (!this.isSupported()) {
      if (options.onError) options.onError('Audio playback is not supported in this browser.');
      if (options.onEnd) options.onEnd();
      return;
    }

    const cleanText = formatTextForSpeech(text);
    if (!cleanText) {
      if (options.onEnd) options.onEnd();
      return;
    }

    // Stop any currently playing audio before starting new one
    this.stop();

    try {
      this.isSpeakingActive = true;

      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: cleanText }),
      }).catch(() => null);

      // If ElevenLabs endpoint failed (401, 500, network error, etc.), silently fall back to browser speech
      if (!response || !response.ok) {
        this.isSpeakingActive = false;
        if (browserSpeechSynthesisProvider.isSupported()) {
          return browserSpeechSynthesisProvider.speak(cleanText, options);
        }
        if (options.onEnd) options.onEnd();
        return;
      }

      const blob = await response.blob();
      if (!blob || blob.size === 0) {
        this.isSpeakingActive = false;
        if (browserSpeechSynthesisProvider.isSupported()) {
          return browserSpeechSynthesisProvider.speak(cleanText, options);
        }
        if (options.onEnd) options.onEnd();
        return;
      }

      const url = URL.createObjectURL(blob);
      this.currentObjectUrl = url;
      this.audioObject = new Audio(url);
      this.audioObject.volume = options.volume ?? 1.0;
      this.audioObject.playbackRate = options.rate ?? 1.0;

      if (options.onStart) options.onStart();

      return new Promise<void>((resolve) => {
        if (!this.audioObject) {
          this.isSpeakingActive = false;
          if (options.onEnd) options.onEnd();
          return resolve();
        }

        this.audioObject.onended = () => {
          this.cleanupAudio();
          if (options.onEnd) options.onEnd();
          resolve();
        };

        this.audioObject.onerror = () => {
          this.cleanupAudio();
          // If audio element failed to play the stream, fallback to browser synthesis
          if (browserSpeechSynthesisProvider.isSupported()) {
            browserSpeechSynthesisProvider.speak(cleanText, options).then(resolve).catch(resolve);
            return;
          }
          if (options.onEnd) options.onEnd();
          resolve();
        };

        this.audioObject.play().catch(() => {
          // Play was interrupted or blocked by browser autoplay policy
          this.cleanupAudio();
          if (options.onEnd) options.onEnd();
          resolve();
        });
      });
    } catch {
      this.cleanupAudio();
      if (browserSpeechSynthesisProvider.isSupported()) {
        try {
          return await browserSpeechSynthesisProvider.speak(cleanText, options);
        } catch {
          if (options.onEnd) options.onEnd();
        }
      } else {
        if (options.onEnd) options.onEnd();
      }
    }
  }

  private cleanupAudio(): void {
    if (this.currentObjectUrl) {
      try {
        URL.revokeObjectURL(this.currentObjectUrl);
      } catch {}
      this.currentObjectUrl = null;
    }
    this.audioObject = null;
    this.isSpeakingActive = false;
  }

  public stop(): void {
    if (this.audioObject) {
      try {
        this.audioObject.pause();
        this.audioObject.currentTime = 0;
      } catch {}
      this.cleanupAudio();
    }
    this.isSpeakingActive = false;
    browserSpeechSynthesisProvider.stop();
  }

  public pause(): void {
    if (this.audioObject && !this.audioObject.paused) {
      try {
        this.audioObject.pause();
      } catch {}
      this.isSpeakingActive = false;
    }
    browserSpeechSynthesisProvider.pause();
  }

  public resume(): void {
    if (this.audioObject && this.audioObject.paused) {
      this.audioObject
        .play()
        .then(() => {
          this.isSpeakingActive = true;
        })
        .catch(() => {
          // Silent catch on interrupted playback
        });
    } else {
      browserSpeechSynthesisProvider.resume();
    }
  }
}

export const elevenLabsTTSProvider = new ElevenLabsTTSProvider();
