'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mic,
  MicOff,
  Send,
  Sparkles,
  X,
  Volume2,
  VolumeX,
  ChevronDown,
  ArrowRight,
  Loader2,
  RotateCcw,
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils/cn';
import type { ChatResponse, SuggestedVehicle, PriceSummaryCard, AvailabilityCard } from '@/lib/services/ai-agent-service';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  suggestedVehicles?: SuggestedVehicle[];
  priceCard?: PriceSummaryCard;
  availabilityCard?: AvailabilityCard;
  quickActions?: string[];
  audioUrl?: string;
}

interface BrowserSpeechRecognitionEvent {
  results: Array<Array<{ transcript: string }>>;
}

interface BrowserSpeechRecognitionErrorEvent {
  error: string;
}

interface BrowserSpeechRecognition {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onstart: (() => void) | null;
  onresult: ((event: BrowserSpeechRecognitionEvent) => void) | null;
  onerror: ((event: BrowserSpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
}

const INITIAL_MESSAGE: Message = {
  id: 'msg-welcome',
  role: 'assistant',
  content: 'Hi! Welcome to NR Car Hire. What would you like to have today?',
  timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  quickActions: [
    'Is Camry available next weekend?',
    'Show me luxury SUVs',
    'What is your zero excess policy?',
    'Airport pickup locations',
  ],
};

export function AiAssistantWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [isVoiceMode, setIsVoiceMode] = useState(false);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isAudioLoading, setIsAudioLoading] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [messages, setMessages] = useState<Message[]>([INITIAL_MESSAGE]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);
  const recognitionRef = useRef<BrowserSpeechRecognition | null>(null);

  // Auto-scroll chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Clean text for speech synthesis
  const cleanSpeechText = (raw: string): string => {
    return raw
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .replace(/https?:\/\/\S+/g, '')
      .replace(/[`*#_~]/g, '')
      .replace(/₹/g, 'dollars ')
      .replace(/\s+/g, ' ')
      .trim();
  };

  // High-fidelity Browser Speech Synthesis Fallback
  const speakWithBrowserSpeech = useCallback((textToSpeak: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      setIsAudioLoading(false);
      setIsPlayingAudio(false);
      return;
    }

    try {
      window.speechSynthesis.cancel();
      const clean = cleanSpeechText(textToSpeak);
      const utterance = new SpeechSynthesisUtterance(clean);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      utterance.lang = 'en-AU';

      const voices = window.speechSynthesis.getVoices();
      const preferredVoice =
        voices.find(
          (v) =>
            v.lang.includes('en-AU') ||
            v.lang.includes('en-GB') ||
            v.name.includes('Natural') ||
            v.name.includes('Google') ||
            v.name.includes('Samantha')
        ) ||
        voices.find((v) => v.lang.startsWith('en')) ||
        voices[0];

      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }

      utterance.onstart = () => {
        setIsPlayingAudio(true);
        setIsAudioLoading(false);
      };

      utterance.onend = () => {
        setIsPlayingAudio(false);
      };

      utterance.onerror = () => {
        setIsPlayingAudio(false);
        setIsAudioLoading(false);
      };

      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.warn('Browser Speech error:', err);
      setIsPlayingAudio(false);
      setIsAudioLoading(false);
    }
  }, []);

  // Text-To-Speech playback (ElevenLabs Primary with instant Browser Speech Fallback)
  const playResponseAudio = useCallback(
    async (textToSpeak: string) => {
      if (isMuted) return;

      try {
        setIsAudioLoading(true);
        if (audioPlayerRef.current) {
          audioPlayerRef.current.pause();
          audioPlayerRef.current = null;
        }
        if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
          window.speechSynthesis.cancel();
        }

        const res = await fetch('/api/ai/tts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: textToSpeak }),
        });

        if (!res.ok) {
          // ElevenLabs quota exceeded or unavailable -> Seamless fallback to browser speech
          speakWithBrowserSpeech(textToSpeak);
          return;
        }

        const audioBlob = await res.blob();
        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);
        audioPlayerRef.current = audio;

        audio.onplay = () => {
          setIsPlayingAudio(true);
          setIsAudioLoading(false);
        };

        audio.onended = () => {
          setIsPlayingAudio(false);
          URL.revokeObjectURL(audioUrl);
        };

        audio.onerror = () => {
          speakWithBrowserSpeech(textToSpeak);
        };

        await audio.play();
      } catch (err) {
        console.warn('TTS playback network note, falling back to browser speech:', err);
        speakWithBrowserSpeech(textToSpeak);
      }
    },
    [isMuted, speakWithBrowserSpeech]
  );

  const handleSendMessage = useCallback(
    async (textToSend?: string) => {
      const query = (textToSend || inputText).trim();
      if (!query || isLoading) return;

      setInputText('');
      setErrorMessage(null);

      const userMessage: Message = {
        id: `usr-${Date.now()}`,
        role: 'user',
        content: query,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, userMessage]);
      setIsLoading(true);

      try {
        const historyPayload = [...messages, userMessage].map((m) => ({
          role: m.role === 'user' ? 'user' : 'assistant',
          content: m.content,
        }));

        const res = await fetch('/api/ai/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messages: historyPayload }),
        });

        const json = await res.json();

        if (!json.success || !json.data) {
          throw new Error(json.error || 'Failed to get response from AI Concierge');
        }

        const chatData: ChatResponse = json.data;

        const assistantMessage: Message = {
          id: `ast-${Date.now()}`,
          role: 'assistant',
          content: chatData.message,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          suggestedVehicles: chatData.suggestedVehicles,
          priceCard: chatData.priceCard,
          availabilityCard: chatData.availabilityCard,
          quickActions: chatData.quickActions,
        };

        setMessages((prev) => [...prev, assistantMessage]);
        setIsLoading(false);

        // Speak response if voice mode is active or user unmuted
        if (isVoiceMode || !isMuted) {
          playResponseAudio(chatData.message);
        }
      } catch (err: unknown) {
        setIsLoading(false);
        const errMsg = err instanceof Error ? err.message : 'Connection failed. Please try again.';
        setErrorMessage(errMsg);
      }
    },
    [inputText, isLoading, isMuted, isVoiceMode, messages, playResponseAudio]
  );

  // Initialize Speech Recognition if supported in browser
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognitionConstructor =
        (window as unknown as { SpeechRecognition?: new () => BrowserSpeechRecognition }).SpeechRecognition ||
        (window as unknown as { webkitSpeechRecognition?: new () => BrowserSpeechRecognition }).webkitSpeechRecognition;

      if (SpeechRecognitionConstructor) {
        const recognition = new SpeechRecognitionConstructor();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-AU';

        recognition.onstart = () => {
          setIsListening(true);
          setErrorMessage(null);
        };

        recognition.onresult = (event: BrowserSpeechRecognitionEvent) => {
          const transcript = event.results[0]?.[0]?.transcript;
          if (transcript) {
            setInputText(transcript);
            handleSendMessage(transcript);
          }
        };

        recognition.onerror = (event: BrowserSpeechRecognitionErrorEvent) => {
          console.warn('Speech recognition error:', event.error);
          setIsListening(false);
          if (event.error === 'not-allowed') {
            setErrorMessage('Microphone access was denied. Please allow microphone permissions.');
          }
        };

        recognition.onend = () => {
          setIsListening(false);
        };

        recognitionRef.current = recognition;
      }
    }
  }, [handleSendMessage]);

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.start();
        } catch (e) {
          console.warn('Speech recognition start note:', e);
        }
      } else {
        setErrorMessage('Speech recognition is not supported in this browser. Please type your message.');
      }
    }
  };

  const stopAudio = useCallback(() => {
    if (audioPlayerRef.current) {
      audioPlayerRef.current.pause();
      audioPlayerRef.current = null;
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsPlayingAudio(false);
    setIsAudioLoading(false);
  }, []);

  const handleOpenToggle = () => {
    setIsOpen((prev) => {
      const next = !prev;
      if (next && messages.length === 1 && !isMuted) {
        // Speak initial welcome greeting when user opens widget
        playResponseAudio(INITIAL_MESSAGE.content);
      }
      if (!next) {
        stopAudio();
      }
      return next;
    });
  };

  const resetChat = () => {
    stopAudio();
    setMessages([INITIAL_MESSAGE]);
    setErrorMessage(null);
  };

  return (
    <>
      {/* Floating Action Trigger Button */}
      <aside
        aria-label="NR Concierge AI Assistant"
        className="fixed bottom-6 right-6 z-40 flex items-center gap-3"
      >
        {!isOpen && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="hidden md:flex items-center gap-2 rounded-full border border-gold/40 bg-midnight/90 px-3.5 py-1.5 shadow-xl backdrop-blur-md text-xs font-medium text-white pointer-events-none"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-gold opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-gold" />
            </span>
            <span>NR AI Concierge</span>
          </motion.div>
        )}

        <motion.button
          onClick={handleOpenToggle}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          aria-expanded={isOpen}
          aria-label="Open NR Concierge AI Assistant"
          className={cn(
            'group relative flex h-14 w-14 items-center justify-center rounded-full shadow-2xl transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-gold/30',
            isPlayingAudio
              ? 'bg-linear-to-br from-gold via-amber-600 to-midnight text-midnight border-2 border-gold'
              : 'bg-linear-to-br from-midnight via-slate-900 to-midnight text-gold border-2 border-gold/60 hover:border-gold'
          )}
        >
          {isPlayingAudio && (
            <span className="absolute inset-0 rounded-full animate-ping bg-gold/30 duration-1000" />
          )}

          {isOpen ? (
            <X className="h-6 w-6 text-white transition-transform group-hover:rotate-90" />
          ) : isPlayingAudio ? (
            <Volume2 className="h-6 w-6 text-midnight animate-bounce" />
          ) : (
            <div className="relative flex items-center justify-center">
              <Sparkles className="h-6 w-6 text-gold transition-transform group-hover:scale-110" />
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-gold opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-gold" />
              </span>
            </div>
          )}
        </motion.button>
      </aside>

      {/* Main Luxury AI Assistant Dialog */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.95 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="fixed bottom-24 right-4 sm:right-6 z-50 flex w-[calc(100vw-2rem)] max-w-sm sm:max-w-md h-[580px] max-h-[82vh] flex-col overflow-hidden rounded-3xl border border-gold/30 bg-midnight/95 text-white shadow-2xl backdrop-blur-xl"
            role="dialog"
            aria-modal="true"
            aria-label="NR Concierge AI Assistant"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-3.5 bg-white/5">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-gold/15 border border-gold/30 text-gold shadow-inner">
                  <Sparkles className="h-4 w-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-display font-bold text-sm tracking-wide text-white">
                      NR Concierge
                    </h3>
                    <span className="rounded-full bg-gold/20 px-2 py-0.5 text-[9px] font-semibold text-gold border border-gold/30 uppercase tracking-wider">
                      ElevenLabs AI Agent
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-300 flex items-center gap-1.5">
                    <span
                      className={cn(
                        'inline-block h-1.5 w-1.5 rounded-full',
                        isPlayingAudio
                          ? 'bg-amber-400 animate-pulse'
                          : isListening
                          ? 'bg-emerald-400 animate-pulse'
                          : 'bg-emerald-500'
                      )}
                    />
                    {isPlayingAudio
                      ? 'AI Speaking...'
                      : isListening
                      ? 'Listening to you...'
                      : 'Authoritative Fleet AI Online'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                {/* Voice / Text Mode Toggle */}
                <button
                  type="button"
                  onClick={() => {
                    setIsVoiceMode((prev) => !prev);
                    if (isPlayingAudio) stopAudio();
                  }}
                  className={cn(
                    'rounded-full px-2.5 py-1 text-[10px] font-semibold transition-all border',
                    isVoiceMode
                      ? 'bg-gold text-midnight border-gold'
                      : 'bg-white/5 text-gray-300 border-white/10 hover:text-white'
                  )}
                  title="Toggle Voice Mode"
                >
                  {isVoiceMode ? 'Voice Mode' : 'Chat Mode'}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (isPlayingAudio) stopAudio();
                    setIsMuted((prev) => !prev);
                  }}
                  className="rounded-full p-1.5 text-gray-300 hover:bg-white/10 hover:text-white transition-colors"
                  aria-label={isMuted ? 'Unmute Audio' : 'Mute Audio'}
                >
                  {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                </button>

                <button
                  type="button"
                  onClick={resetChat}
                  className="rounded-full p-1.5 text-gray-300 hover:bg-white/10 hover:text-white transition-colors"
                  aria-label="Reset Conversation"
                  title="Reset Chat"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                </button>

                <button
                  type="button"
                  onClick={() => {
                    stopAudio();
                    setIsOpen(false);
                  }}
                  className="rounded-full p-1.5 text-gray-300 hover:bg-white/10 hover:text-white transition-colors"
                  aria-label="Minimize Assistant"
                >
                  <ChevronDown className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Voice Mode Visualizer Screen */}
            {isVoiceMode && (
              <div className="flex flex-col items-center justify-center p-6 bg-linear-to-b from-white/5 via-gold/5 to-transparent border-b border-white/10">
                <div
                  className={cn(
                    'relative flex h-24 w-24 items-center justify-center rounded-full transition-all duration-500',
                    isPlayingAudio
                      ? 'shadow-[0_0_40px_rgba(197,168,128,0.5)] border border-gold'
                      : isListening
                      ? 'shadow-[0_0_40px_rgba(16,185,129,0.4)] border border-emerald-400'
                      : 'border border-white/20 shadow-inner'
                  )}
                >
                  {isPlayingAudio && (
                    <motion.div
                      animate={{ scale: [1, 1.35, 1], opacity: [0.6, 0.1, 0.6] }}
                      transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
                      className="absolute inset-0 rounded-full border border-gold"
                    />
                  )}

                  <div
                    className={cn(
                      'flex h-16 w-16 items-center justify-center rounded-full transition-all',
                      isPlayingAudio
                        ? 'bg-linear-to-br from-gold to-amber-600 text-midnight scale-105'
                        : isListening
                        ? 'bg-linear-to-br from-emerald-400 to-teal-600 text-white'
                        : 'bg-white/10 text-gold'
                    )}
                  >
                    {isPlayingAudio ? (
                      <Volume2 className="h-8 w-8 animate-bounce text-midnight" />
                    ) : isListening ? (
                      <Mic className="h-8 w-8 animate-pulse text-white" />
                    ) : (
                      <Sparkles className="h-7 w-7 text-gold" />
                    )}
                  </div>
                </div>

                <div className="mt-3 text-center">
                  <p className="text-xs font-semibold text-gold">
                    {isPlayingAudio
                      ? 'AI Concierge Speaking...'
                      : isListening
                      ? 'Listening... Speak your car inquiry'
                      : 'Tap microphone to speak'}
                  </p>
                  <p className="text-[11px] text-gray-300 mt-0.5">
                    Real-time knowledge retrieval from knowledge.md
                  </p>
                </div>
              </div>
            )}

            {/* Error banner */}
            {errorMessage && (
              <div className="mx-4 mt-2 rounded-xl bg-red-500/15 border border-red-500/30 p-2.5 text-xs text-red-200 flex items-center justify-between">
                <span>{errorMessage}</span>
                <button
                  type="button"
                  onClick={() => setErrorMessage(null)}
                  className="text-red-300 hover:text-white p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            )}

            {/* Message Stream */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3.5 text-xs">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={cn(
                    'flex flex-col',
                    msg.role === 'user' ? 'items-end' : 'items-start'
                  )}
                >
                  <div
                    className={cn(
                      'rounded-2xl px-3.5 py-2.5 max-w-[88%] shadow-md leading-relaxed',
                      msg.role === 'user'
                        ? 'bg-gold/25 text-white border border-gold/40 rounded-br-xs'
                        : 'bg-white/10 text-gray-100 border border-white/10 rounded-bl-xs'
                    )}
                  >
                    <p className="whitespace-pre-wrap">{msg.content}</p>

                    {/* Rich Suggested Vehicle Cards */}
                    {msg.suggestedVehicles && msg.suggestedVehicles.length > 0 && (
                      <div className="mt-3 space-y-2 pt-2 border-t border-white/10">
                        <p className="text-[10px] uppercase tracking-wider text-gold font-bold">
                          Recommended Fleet Options:
                        </p>
                        <div className="grid grid-cols-1 gap-2">
                          {msg.suggestedVehicles.map((v) => (
                            <div
                              key={v.id}
                              className="rounded-xl bg-black/40 border border-gold/30 p-2.5 flex items-center justify-between gap-2"
                            >
                              <div className="min-w-0 flex-1">
                                <p className="font-semibold text-white text-xs truncate">
                                  {v.year} {v.make} {v.model}
                                </p>
                                <p className="text-[10px] text-gray-300">
                                  {v.category} • ₹{v.dailyRate}/day • {v.transmission}
                                </p>
                              </div>
                              <Link
                                href={v.bookingUrl}
                                onClick={() => setIsOpen(false)}
                                className="inline-flex items-center gap-1 rounded-lg bg-gold px-2.5 py-1 text-[11px] font-semibold text-midnight hover:bg-gold-light transition-colors whitespace-nowrap shadow-sm"
                              >
                                <span>Book</span>
                                <ArrowRight className="h-3 w-3" />
                              </Link>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Rich Availability Badge Card */}
                    {msg.availabilityCard && (
                      <div className="mt-2.5 rounded-xl bg-black/40 border border-white/10 p-2.5 text-[11px]">
                        <div className="flex items-center gap-1.5 font-semibold">
                          <span
                            className={cn(
                              'h-2 w-2 rounded-full',
                              msg.availabilityCard.isAvailable ? 'bg-emerald-400' : 'bg-red-400'
                            )}
                          />
                          <span className={msg.availabilityCard.isAvailable ? 'text-emerald-400' : 'text-red-300'}>
                            {msg.availabilityCard.isAvailable
                              ? 'Authoritative Live: Available'
                              : 'Authoritative Live: Unavailable'}
                          </span>
                        </div>
                        <p className="text-gray-300 mt-1">
                          Dates: {msg.availabilityCard.pickupDate} to {msg.availabilityCard.dropoffDate}
                        </p>
                        {msg.availabilityCard.bookingUrl && (
                          <Link
                            href={msg.availabilityCard.bookingUrl}
                            onClick={() => setIsOpen(false)}
                            className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-gold hover:underline"
                          >
                            <span>Proceed to direct booking</span>
                            <ArrowRight className="h-3 w-3" />
                          </Link>
                        )}
                      </div>
                    )}

                    {/* Rich Price Breakdown Card */}
                    {msg.priceCard && (
                      <div className="mt-2.5 rounded-xl bg-black/40 border border-gold/30 p-2.5 text-[11px]">
                        <p className="font-semibold text-gold mb-1">Authoritative Price Quote:</p>
                        <div className="space-y-0.5 text-gray-300">
                          <div className="flex justify-between">
                            <span>Base ({msg.priceCard.rentalDays} days @ ₹{msg.priceCard.dailyRate}):</span>
                            <span>₹{msg.priceCard.baseAmount}</span>
                          </div>
                          {msg.priceCard.extrasAmount > 0 && (
                            <div className="flex justify-between">
                              <span>Selected Extras:</span>
                              <span>₹{msg.priceCard.extrasAmount}</span>
                            </div>
                          )}
                          {msg.priceCard.discountAmount > 0 && (
                            <div className="flex justify-between text-emerald-400">
                              <span>Promo ({msg.priceCard.promoCode}):</span>
                              <span>-₹{msg.priceCard.discountAmount}</span>
                            </div>
                          )}
                          <div className="flex justify-between font-bold text-white pt-1 border-t border-white/10 mt-1">
                            <span>Estimated Total:</span>
                            <span className="text-gold">₹{msg.priceCard.finalAmount} INR</span>
                          </div>
                        </div>
                      </div>
                    )}

                    <span className="block text-[9px] text-gray-400 mt-1 text-right">
                      {msg.timestamp}
                    </span>
                  </div>

                  {/* Quick Action Suggestion Chips */}
                  {msg.quickActions && msg.quickActions.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1 max-w-[90%]">
                      {msg.quickActions.map((action, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleSendMessage(action)}
                          className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] text-gray-300 hover:border-gold/50 hover:bg-gold/10 hover:text-white transition-colors"
                        >
                          {action}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}

              {isLoading && (
                <div className="flex items-center gap-2 text-gray-400 text-xs py-2">
                  <Loader2 className="h-4 w-4 animate-spin text-gold" />
                  <span>NR Concierge is checking live fleet...</span>
                </div>
              )}

              {isAudioLoading && (
                <div className="flex items-center gap-2 text-gold text-xs py-1">
                  <Volume2 className="h-4 w-4 animate-pulse" />
                  <span>Speaking voice audio...</span>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input Footer */}
            <div className="border-t border-white/10 p-3 bg-white/5">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage();
                }}
                className="flex items-center gap-2"
              >
                <button
                  type="button"
                  onClick={toggleListening}
                  className={cn(
                    'flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border transition-all',
                    isListening
                      ? 'bg-emerald-500 border-emerald-400 text-white animate-pulse'
                      : 'bg-white/10 border-white/15 text-gold hover:bg-white/20'
                  )}
                  title={isListening ? 'Stop Listening' : 'Voice Input (Speak)'}
                  aria-label="Microphone"
                >
                  {isListening ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                </button>

                <Input
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Ask about cars, prices, airport hubs, or booking..."
                  disabled={isLoading}
                  className="flex-1 bg-white/10 border-white/15 text-white placeholder:text-gray-400 text-xs rounded-2xl h-10 focus-visible:ring-gold/50"
                />

                <Button
                  type="submit"
                  variant="gold"
                  size="icon"
                  disabled={!inputText.trim() || isLoading}
                  className="h-10 w-10 shrink-0 rounded-2xl shadow-md shadow-gold/20"
                  aria-label="Send Message"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
