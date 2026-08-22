import type { TextToSpeechProvider, TextToSpeechOptions } from './types';
import { formatTextForSpeech } from './tts-provider';

/**
 * ElevenLabs Single Voice Pipeline Provider
 * Single Source of Truth for all spoken voice audio across the application.
 */
export class ElevenLabsTTSProvider implements TextToSpeechProvider {
  private isSpeakingActive = false;
  private audioObject: HTMLAudioElement | null = null;
  private currentObjectUrl: string | null = null;

  public isSupported(): boolean {
    return typeof window !== 'undefined' && typeof Audio !== 'undefined';
  }

  public isSpeaking(): boolean {
    const isAudioPlaying = this.audioObject !== null && !this.audioObject.paused;
    return this.isSpeakingActive || isAudioPlaying;
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

    // Stop any currently playing audio before starting new playback
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

      if (!response || !response.ok) {
        this.cleanupAudio();
        if (options.onError) {
          options.onError('Voice synthesis service unavailable.');
        }
        if (options.onEnd) options.onEnd();
        return;
      }

      const blob = await response.blob();
      if (!blob || blob.size === 0) {
        this.cleanupAudio();
        if (options.onError) {
          options.onError('Empty voice stream received.');
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
          this.cleanupAudio();
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
          if (options.onError) {
            options.onError('Error during voice playback.');
          }
          if (options.onEnd) options.onEnd();
          resolve();
        };

        const playPromise = this.audioObject.play();
        if (playPromise && typeof playPromise.catch === 'function') {
          playPromise.catch(() => {
            // Play was interrupted or blocked by browser autoplay policy
            this.cleanupAudio();
            if (options.onEnd) options.onEnd();
            resolve();
          });
        } else {
          // If playback starts synchronously or in mock environment, finish immediately on end
        }
      });
    } catch {
      this.cleanupAudio();
      if (options.onError) {
        options.onError('Voice synthesis encountered an error.');
      }
      if (options.onEnd) options.onEnd();
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
  }

  public pause(): void {
    if (this.audioObject && !this.audioObject.paused) {
      try {
        this.audioObject.pause();
      } catch {}
      this.isSpeakingActive = false;
    }
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
    }
  }
}

export const elevenLabsTTSProvider = new ElevenLabsTTSProvider();
