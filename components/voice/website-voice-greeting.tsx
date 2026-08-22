'use client';

import { useEffect } from 'react';
import { elevenLabsTTSProvider } from '@/lib/voice/elevenlabs-provider';

export function WebsiteVoiceGreeting() {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      const alreadySpoken = sessionStorage.getItem('nr_website_welcome_spoken');
      if (alreadySpoken) return;

      const speakWelcome = async () => {
        try {
          if (sessionStorage.getItem('nr_website_welcome_spoken')) return;
          sessionStorage.setItem('nr_website_welcome_spoken', 'true');

          await elevenLabsTTSProvider.speak('Welcome to NR Car Hire.', { volume: 0.85 });
        } catch {
          // Ignore autoplay blocks gracefully
        }
      };

      // Try initial speak after slight delay for audio engine initialization
      const timer = setTimeout(() => {
        speakWelcome();
      }, 800);

      // Fallback on first user interaction if browser enforces user gesture
      const handleFirstInteraction = () => {
        speakWelcome();
        window.removeEventListener('click', handleFirstInteraction);
        window.removeEventListener('keydown', handleFirstInteraction);
        window.removeEventListener('touchstart', handleFirstInteraction);
      };

      window.addEventListener('click', handleFirstInteraction, { once: true });
      window.addEventListener('keydown', handleFirstInteraction, { once: true });
      window.addEventListener('touchstart', handleFirstInteraction, { once: true });

      return () => {
        clearTimeout(timer);
        window.removeEventListener('click', handleFirstInteraction);
        window.removeEventListener('keydown', handleFirstInteraction);
        window.removeEventListener('touchstart', handleFirstInteraction);
      };
    } catch {
      // Fail silently without disrupting page
    }
  }, []);

  return null;
}
