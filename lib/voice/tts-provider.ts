import type { TextToSpeechProvider, TextToSpeechOptions, SupportedVoiceLanguage } from './types';

/**
 * Strips raw markdown, JSON, URLs, and formats currencies and dates for spoken audio.
 */
export function formatTextForSpeech(text: string): string {
  if (!text) return '';

  return (
    text
      .replace(
        /([A-Za-z0-9\s]+)\s*[—–-]\s*₹\s*(\d+(?:\.\d+)?)\s*\/\s*(?:day|din)/gi,
        '$1 is $2 rupees per day',
      )
      // Date range natural phrasing: "1–5 September" / "1-5 September" -> "September 1st to 5th"
      .replace(/(\d{1,2})\s*[—–-]\s*(\d{1,2})\s+([A-Za-z]+)/gi, (match, d1, d2, month) => {
        const getOrdinal = (n: number) => {
          const s = ['th', 'st', 'nd', 'rd'];
          const v = n % 100;
          return n + (s[(v - 20) % 10] || s[v] || s[0]);
        };
        return `${month} ${getOrdinal(parseInt(d1, 10))} to ${getOrdinal(parseInt(d2, 10))}`;
      })
      // Currency conversions
      .replace(/₹\s*(\d+(?:\.\d+)?)\s*\/\s*(?:day|din)/gi, '$1 rupees per day')
      .replace(/₹\s*(\d+(?:\.\d+)?)/g, '$1 rupees')
      .replace(/INR\s*(\d+(?:\.\d+)?)/gi, '$1 rupees')
      // Extra codes to human-readable names
      .replace(/ext-zero-excess/gi, 'Zero Excess Protection')
      .replace(/ext-child-seat/gi, 'Child Safety Seat')
      .replace(/ext-roadside-plus/gi, 'Roadside Assistance Plus')
      .replace(/ext-gps/gi, 'GPS Navigation')
      .replace(/ext-add-driver/gi, 'Additional Driver')
      // Markdown link conversion [label](url) -> label
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      // Remove raw URLs and path routes
      .replace(/https?:\/\/[^\s]+/g, '')
      .replace(/\/book\/[^\s]+/g, '')
      .replace(/\/fleet\/[^\s]+/g, '')
      // Remove emoji
      .replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '')
      // Remove Markdown headers, bold, italics, code blocks
      .replace(/```[\s\S]*?```/g, '')
      .replace(/`([^`]+)`/g, '$1')
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/\*(.*?)\*/g, '$1')
      .replace(/^#{1,6}\s+/gm, '')
      .replace(/^[-•*]\s+/gm, ', ')
      // Parenthetical explanation simplification: e.g. "(isn't available)"
      .replace(/\(isn't available\)/gi, '')
      .replace(/\(unavailable\)/gi, '')
      // Clean up whitespace & punctuation
      .replace(/\s+/g, ' ')
      .replace(/,\s*,+/g, ',')
      .replace(/\.\s*\.+/g, '.')
      .trim()
  );
}

export class BrowserSpeechSynthesisProvider implements TextToSpeechProvider {
  private isSpeakingActive = false;
  private currentUtterance: SpeechSynthesisUtterance | null = null;

  public isSupported(): boolean {
    return typeof window !== 'undefined' && 'speechSynthesis' in window && !!window.speechSynthesis;
  }

  public isSpeaking(): boolean {
    if (typeof window === 'undefined' || !window.speechSynthesis) return false;
    return this.isSpeakingActive || !!window.speechSynthesis.speaking;
  }

  public async speak(text: string, options: TextToSpeechOptions = {}): Promise<void> {
    if (!this.isSupported()) {
      if (options.onError) {
        options.onError('Text-to-speech is not supported in this browser.');
      }
      if (options.onEnd) options.onEnd();
      return;
    }

    const cleanText = formatTextForSpeech(text);
    if (!cleanText) {
      if (options.onEnd) options.onEnd();
      return;
    }

    // Stop any ongoing speech and ensure engine is resumed
    this.stop();
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      try {
        window.speechSynthesis.resume();
      } catch {}
    }

    return new Promise((resolve) => {
      try {
        const utterance = new SpeechSynthesisUtterance(cleanText);
        this.currentUtterance = utterance;

        utterance.rate = options.rate ?? 1.0;
        utterance.pitch = options.pitch ?? 1.0;
        utterance.volume = options.volume ?? 1.0;

        // Choose best available voice for language
        const targetLang = this.mapLanguage(options.lang || 'en-AU');
        utterance.lang = targetLang;

        const voices = window.speechSynthesis?.getVoices?.() || [];
        if (voices && voices.length > 0) {
          const matchingVoice =
            voices.find((v) => v.lang === targetLang) ||
            voices.find((v) => v.lang.startsWith(targetLang.split('-')[0])) ||
            voices.find((v) => v.lang.includes('en'));

          if (matchingVoice) {
            utterance.voice = matchingVoice;
          }
        }

        utterance.onstart = () => {
          this.isSpeakingActive = true;
          if (options.onStart) options.onStart();
        };

        utterance.onend = () => {
          this.isSpeakingActive = false;
          this.currentUtterance = null;
          if (options.onEnd) options.onEnd();
          resolve();
        };

        utterance.onerror = (e) => {
          this.isSpeakingActive = false;
          this.currentUtterance = null;
          // Ignore canceled events (when user interrupted)
          if (e.error !== 'canceled' && e.error !== 'interrupted') {
            if (options.onError) {
              options.onError('Voice synthesis error occurred.');
            }
          }
          if (options.onEnd) options.onEnd();
          resolve();
        };

        setTimeout(() => {
          if (typeof window !== 'undefined' && window.speechSynthesis) {
            try {
              window.speechSynthesis.resume();
              window.speechSynthesis.speak(utterance);
            } catch {}
          }
        }, 50);
      } catch {
        this.isSpeakingActive = false;
        this.currentUtterance = null;
        if (options.onError) {
          options.onError('Voice playback could not start.');
        }
        if (options.onEnd) options.onEnd();
        resolve();
      }
    });
  }

  public stop(): void {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      try {
        window.speechSynthesis.cancel();
      } catch {
        // Ignore cancel errors
      }
    }
    this.isSpeakingActive = false;
    this.currentUtterance = null;
  }

  public pause(): void {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      try {
        window.speechSynthesis.pause();
      } catch {}
    }
  }

  public resume(): void {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      try {
        window.speechSynthesis.resume();
      } catch {}
    }
  }

  private mapLanguage(lang: SupportedVoiceLanguage): string {
    switch (lang) {
      case 'hi-IN':
        return 'hi-IN';
      case 'gu-IN':
        return 'gu-IN';
      case 'en-US':
        return 'en-US';
      case 'en-AU':
      case 'auto':
      default:
        return 'en-AU';
    }
  }
}

export const browserSpeechSynthesisProvider = new BrowserSpeechSynthesisProvider();
