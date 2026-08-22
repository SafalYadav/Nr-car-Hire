'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import { TransitionLink } from '@/components/shared/transition-link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Sparkles,
  X,
  Send,
  RotateCcw,
  Bot,
  User,
  Loader2,
  ArrowUpRight,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Receipt,
  ArrowRight,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Radio,
} from 'lucide-react';
import type {
  SuggestedVehicle,
  PriceSummaryCard,
  AvailabilityCard,
  BookingDraftCard,
} from '@/lib/services/ai-agent-service';
import { voiceService, getVoiceGreeting } from '@/lib/voice/voice-service';
import type { VoiceState } from '@/lib/voice/types';

interface MessageItem {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  suggestedVehicles?: SuggestedVehicle[];
  priceCard?: PriceSummaryCard;
  availabilityCard?: AvailabilityCard;
  bookingDraft?: BookingDraftCard;
  quickActions?: string[];
}

const INITIAL_MESSAGE: MessageItem = {
  id: 'msg-welcome',
  role: 'assistant',
  content: `What would you like to have? 🚗\n\n• Recommend a vehicle (SUVs, executive sedans, 4x4 utilities)\n• Check rates & live availability (from ₹89/day)\n• Rental policies, licences & airport hubs`,
  quickActions: [
    'Recommend an SUV',
    'Show cars under ₹150/day',
    'Check Camry availability',
    'Rental policies',
  ],
};

export function AiChatWidget() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<MessageItem[]>([INITIAL_MESSAGE]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Voice Mode States
  const [voiceState, setVoiceState] = useState<VoiceState>('IDLE');
  const [isVoiceMode, setIsVoiceMode] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState('');
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const [currentlySpeakingId, setCurrentlySpeakingId] = useState<string | null>(null);

  const messageCounter = useRef(1);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isHandlingVoiceSubmission = useRef(false);
  const hasSpokenGreeting = useRef(false);

  // Spoken greeting on opening AI Concierge widget (Part B)
  useEffect(() => {
    if (isOpen && !hasSpokenGreeting.current && messages.length <= 1) {
      hasSpokenGreeting.current = true;
      setIsVoiceMode(true);
      const greeting = getVoiceGreeting();
      voiceService.speakResponse(greeting, { autoListenAfter: true }).catch(() => {});
    }
  }, [isOpen, messages.length]);

  // Auto-scroll to bottom of conversation
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, interimTranscript]);

  const handleSendMessage = useCallback(
    async (textToSend?: string, isVoiceInitiated = false) => {
      const text = (textToSend || input).trim();
      if (!text || isLoading || isHandlingVoiceSubmission.current) return;

      isHandlingVoiceSubmission.current = true;
      messageCounter.current += 1;
      const userMessage: MessageItem = {
        id: `user-${messageCounter.current}`,
        role: 'user',
        content: text,
      };

      const newMessages = [...messages, userMessage];
      setMessages(newMessages);
      setInput('');
      setInterimTranscript('');
      setIsLoading(true);
      voiceService.setProcessing(true);

      try {
        const apiMessages = newMessages.map((m) => ({
          role: m.role,
          content: m.content,
        }));

        const res = await fetch('/api/ai/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messages: apiMessages }),
        });

        const data = await res.json();

        if (data.success && data.data) {
          messageCounter.current += 1;
          const msgId = `ai-${messageCounter.current}`;
          const replyText =
            data.data.message || "I'm here to assist with our fleet and reservations.";
          const assistantMessage: MessageItem = {
            id: msgId,
            role: 'assistant',
            content: replyText,
            suggestedVehicles: data.data.suggestedVehicles,
            priceCard: data.data.priceCard,
            availabilityCard: data.data.availabilityCard,
            bookingDraft: data.data.bookingDraft,
            quickActions: data.data.quickActions,
          };
          setMessages((prev) => [...prev, assistantMessage]);

          // If voice was used or voice mode is on, speak the response naturally and auto listen after
          if (isVoiceInitiated || isVoiceMode) {
            setCurrentlySpeakingId(msgId);
            await voiceService.speakResponse(replyText, { autoListenAfter: true });
            setCurrentlySpeakingId(null);
          }
        } else {
          throw new Error(data.error || 'Failed to get AI response');
        }
      } catch {
        messageCounter.current += 1;
        const errorMessage: MessageItem = {
          id: `err-${messageCounter.current}`,
          role: 'assistant',
          content:
            "I'm having trouble connecting to the concierge network. Please check your internet connection or browse our fleet directly.",
          quickActions: ['Browse Fleet', 'Contact Support'],
        };
        setMessages((prev) => [...prev, errorMessage]);
      } finally {
        setIsLoading(false);
        voiceService.setProcessing(false);
        isHandlingVoiceSubmission.current = false;
      }
    },
    [input, isLoading, isVoiceMode, messages],
  );

  // Setup Voice Service Callbacks
  useEffect(() => {
    voiceService.setCallbacks({
      onStateChange: (state) => {
        setVoiceState(state);
      },
      onTranscript: (transcript, isFinal) => {
        if (isFinal) {
          setInterimTranscript('');
          handleSendMessage(transcript, true);
        } else {
          setInterimTranscript(transcript);
        }
      },
      onError: (errMsg) => {
        setVoiceError(errMsg);
        setInterimTranscript('');
      },
    });

    return () => {
      voiceService.stopAll();
    };
  }, [handleSendMessage]);

  // Completely hide on all /admin routes
  if (pathname?.startsWith('/admin')) {
    return null;
  }

  const toggleVoiceMode = async () => {
    setVoiceError(null);
    if (voiceState === 'LISTENING') {
      voiceService.stopListening();
      setIsVoiceMode(false);
    } else {
      setIsVoiceMode(true);
      voiceService.setLanguage('en-AU');
      await voiceService.startListening();
    }
  };

  const handleSpeakMessage = async (msg: MessageItem) => {
    if (currentlySpeakingId === msg.id) {
      voiceService.stopSpeaking();
      setCurrentlySpeakingId(null);
    } else {
      setCurrentlySpeakingId(msg.id);
      await voiceService.speakResponse(msg.content);
      setCurrentlySpeakingId(null);
    }
  };

  const handleClearChat = () => {
    voiceService.stopAll();
    hasSpokenGreeting.current = false;
    setMessages([INITIAL_MESSAGE]);
    setInterimTranscript('');
    setVoiceError(null);
    setCurrentlySpeakingId(null);
    setIsVoiceMode(false);
  };

  return (
    <>
      {/* Floating Launcher Button */}
      {!isOpen && (
        <div className="fixed bottom-6 right-6 z-50">
          <button
            onClick={() => {
              setIsOpen(true);
            }}
            className="group relative flex items-center gap-3 rounded-full bg-neutral-950 px-4 py-3.5 text-white shadow-2xl ring-1 ring-gold/40 transition-all duration-300 hover:scale-105 hover:bg-neutral-900 hover:ring-gold focus:outline-none focus:ring-2 focus:ring-gold"
            aria-label="Open AI Rental Assistant"
          >
            <div className="relative flex h-8 w-8 items-center justify-center rounded-full bg-gold/15 text-gold">
              <Sparkles className="h-4 w-4 animate-pulse text-gold" />
              <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-neutral-950" />
            </div>
            <div className="text-left">
              <p className="text-xs font-semibold tracking-wide text-white font-display">
                NR Concierge
              </p>
              <p className="text-[10px] font-medium text-gold">AI Fleet & Voice Assistant</p>
            </div>
          </button>
        </div>
      )}

      {/* Floating Chat Window */}
      {isOpen && (
        <div className="fixed bottom-4 right-4 z-50 flex h-[640px] max-h-[calc(100vh-2rem)] w-[390px] max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-950 text-neutral-100 shadow-2xl ring-1 ring-gold/30 sm:bottom-6 sm:right-6 sm:w-[450px]">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-neutral-800 bg-neutral-900/90 px-4 py-3 backdrop-blur-md">
            <div className="flex items-center gap-2.5">
              <div className="relative flex h-8 w-8 items-center justify-center rounded-full bg-gold/15 text-gold border border-gold/30">
                {voiceState === 'SPEAKING' ? (
                  <Volume2 className="h-4 w-4 animate-pulse text-gold" />
                ) : voiceState === 'LISTENING' ? (
                  <Radio className="h-4 w-4 animate-ping text-red-400" />
                ) : (
                  <Sparkles className="h-4 w-4 text-gold" />
                )}
                <span
                  className={`absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full ring-2 ring-neutral-900 ${
                    voiceState === 'LISTENING'
                      ? 'bg-red-500 animate-ping'
                      : voiceState === 'SPEAKING'
                        ? 'bg-gold animate-pulse'
                        : 'bg-emerald-500'
                  }`}
                />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="text-xs font-semibold tracking-tight text-white font-display">
                    NR Concierge
                  </h3>
                  <span className="rounded bg-gold/20 px-1.5 py-0.2 text-[8px] font-bold uppercase tracking-wider text-gold">
                    {voiceState === 'SPEAKING'
                      ? 'Speaking'
                      : voiceState === 'LISTENING'
                        ? 'Listening'
                        : 'AI Online'}
                  </span>
                </div>
                <p className="text-[10px] text-neutral-400">Live Australian Fleet & Voice Engine</p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              {/* Voice Mode Toggle Button */}
              <button
                onClick={toggleVoiceMode}
                title={voiceState === 'LISTENING' ? 'Stop voice listening' : 'Start voice mode'}
                aria-label={
                  voiceState === 'LISTENING' ? 'Stop listening' : 'Start voice conversation'
                }
                className={`rounded-lg p-1.5 transition ${
                  voiceState === 'LISTENING'
                    ? 'bg-red-500/20 text-red-400 ring-1 ring-red-500 animate-pulse'
                    : isVoiceMode
                      ? 'bg-gold/20 text-gold ring-1 ring-gold'
                      : 'text-neutral-400 hover:bg-neutral-800 hover:text-white'
                }`}
              >
                {voiceState === 'LISTENING' ? (
                  <MicOff className="h-3.5 w-3.5" />
                ) : (
                  <Mic className="h-3.5 w-3.5" />
                )}
              </button>

              <button
                onClick={handleClearChat}
                title="Reset conversation"
                aria-label="Reset conversation"
                className="rounded-lg p-1.5 text-neutral-400 transition hover:bg-neutral-800 hover:text-white"
              >
                <RotateCcw className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => {
                  voiceService.stopAll();
                  setIsOpen(false);
                }}
                title="Close chat"
                aria-label="Close chat"
                className="rounded-lg p-1.5 text-neutral-400 transition hover:bg-neutral-800 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Active Voice Status Banner */}
          {(voiceState === 'LISTENING' || voiceState === 'SPEAKING' || voiceError) && (
            <div
              className={`flex items-center justify-between border-b px-3.5 py-2 text-xs transition-all ${
                voiceState === 'LISTENING'
                  ? 'border-red-500/30 bg-red-950/40 text-red-200'
                  : voiceState === 'SPEAKING'
                    ? 'border-gold/30 bg-gold/10 text-amber-200'
                    : 'border-amber-500/30 bg-amber-950/40 text-amber-200'
              }`}
            >
              <div className="flex items-center gap-2 truncate">
                {voiceState === 'LISTENING' && (
                  <>
                    <span className="flex h-2 w-2 rounded-full bg-red-500 animate-ping" />
                    <span className="font-semibold text-red-300">Listening...</span>
                    <span className="truncate text-[11px] text-neutral-300 italic">
                      {interimTranscript
                        ? `"${interimTranscript}"`
                        : 'Speak naturally in English or Hinglish'}
                    </span>
                  </>
                )}

                {voiceState === 'SPEAKING' && (
                  <>
                    <div className="flex items-center gap-0.5">
                      <span className="h-2.5 w-0.5 bg-gold animate-bounce" />
                      <span className="h-4 w-0.5 bg-gold animate-pulse" />
                      <span className="h-2 w-0.5 bg-gold animate-bounce" />
                    </div>
                    <span className="font-medium text-gold">NR Concierge is speaking...</span>
                  </>
                )}

                {voiceError && (
                  <>
                    <AlertCircle className="h-3.5 w-3.5 text-amber-400 flex-shrink-0" />
                    <span className="truncate text-[11px] text-amber-200">{voiceError}</span>
                  </>
                )}
              </div>

              <div className="flex items-center gap-1.5">
                {voiceState === 'SPEAKING' && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => voiceService.stopSpeaking()}
                    className="h-5 px-2 text-[10px] border-gold/40 text-gold hover:bg-gold/20"
                  >
                    <VolumeX className="mr-1 h-3 w-3" /> Mute
                  </Button>
                )}

                {voiceState === 'LISTENING' && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => voiceService.stopListening()}
                    className="h-5 px-2 text-[10px] border-red-500/40 text-red-300 hover:bg-red-900/40"
                  >
                    Done
                  </Button>
                )}

                {voiceError && (
                  <button
                    onClick={() => setVoiceError(null)}
                    className="text-neutral-400 hover:text-white"
                    aria-label="Dismiss error"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Message Stream */}
          <div className="flex-1 space-y-4 overflow-y-auto p-4 scrollbar-thin scrollbar-thumb-neutral-800">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div className="flex items-end gap-2 max-w-[90%]">
                  {m.role === 'assistant' && (
                    <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-gold/15 text-gold border border-gold/30 text-xs">
                      <Bot className="h-3 w-3" />
                    </div>
                  )}

                  <div
                    className={`group relative rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed ${
                      m.role === 'user'
                        ? 'rounded-br-sm bg-gradient-to-r from-amber-500 to-amber-600 text-neutral-950 font-medium shadow-md'
                        : 'rounded-bl-sm border border-neutral-800/80 bg-neutral-900/90 text-neutral-200'
                    }`}
                  >
                    <div className="whitespace-pre-wrap">{m.content}</div>

                    {/* Speaker Button on Assistant Messages */}
                    {m.role === 'assistant' && (
                      <button
                        onClick={() => handleSpeakMessage(m)}
                        title={currentlySpeakingId === m.id ? 'Stop reading' : 'Read aloud'}
                        aria-label={
                          currentlySpeakingId === m.id ? 'Stop reading' : 'Read message aloud'
                        }
                        className={`absolute -bottom-2 right-2 rounded-full p-1 border shadow transition ${
                          currentlySpeakingId === m.id
                            ? 'bg-gold text-neutral-950 border-gold ring-2 ring-gold/40'
                            : 'bg-neutral-950/80 text-neutral-400 border-neutral-800 hover:text-gold hover:border-gold/40 opacity-0 group-hover:opacity-100'
                        }`}
                      >
                        {currentlySpeakingId === m.id ? (
                          <VolumeX className="h-2.5 w-2.5" />
                        ) : (
                          <Volume2 className="h-2.5 w-2.5" />
                        )}
                      </button>
                    )}
                  </div>

                  {m.role === 'user' && (
                    <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-neutral-800 text-neutral-400 text-xs">
                      <User className="h-3 w-3" />
                    </div>
                  )}
                </div>

                {/* 1. Suggested Vehicle Cards */}
                {m.suggestedVehicles && m.suggestedVehicles.length > 0 && (
                  <div className="mt-2.5 grid w-full grid-cols-1 gap-2 pl-8 sm:grid-cols-2">
                    {m.suggestedVehicles.map((v) => (
                      <div
                        key={v.id}
                        className="flex flex-col justify-between rounded-xl border border-neutral-800/90 bg-neutral-900/80 p-2.5 shadow-md transition hover:border-gold/40"
                      >
                        <div>
                          {v.imageUrl && (
                            <div className="relative mb-2 h-20 w-full overflow-hidden rounded-lg bg-neutral-950">
                              <Image
                                src={v.imageUrl}
                                alt={v.name}
                                fill
                                className="object-cover"
                                sizes="(max-width: 440px) 100vw, 200px"
                              />
                            </div>
                          )}
                          <div>
                            <div className="flex items-center justify-between">
                              <p className="truncate text-xs font-bold text-white">{v.name}</p>
                              <span className="text-xs font-extrabold text-gold">
                                ₹{v.dailyRate}/day
                              </span>
                            </div>
                            <p className="text-[10px] text-neutral-400 mt-0.5">
                              {v.category} • {v.transmission} • {v.seats} Seats • {v.location}
                            </p>
                            {v.matchReason && (
                              <p className="text-[10px] text-amber-200/80 mt-1 line-clamp-2 italic">
                                {v.matchReason}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="mt-2.5 flex items-center justify-end gap-2 border-t border-neutral-800/60 pt-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-6 px-2 text-[10px] border-neutral-700 hover:bg-neutral-800"
                            asChild
                            onClick={() => setIsOpen(false)}
                          >
                            <TransitionLink href={v.detailsUrl || `/fleet/${v.id}`}>
                              View Details
                            </TransitionLink>
                          </Button>
                          {!m.availabilityCard ||
                          m.availabilityCard.isAvailable ||
                          v.id !== m.availabilityCard.vehicleId ? (
                            <Button
                              size="sm"
                              variant="gold"
                              className="h-6 px-2.5 text-[10px] font-semibold"
                              asChild
                              onClick={() => setIsOpen(false)}
                            >
                              <TransitionLink href={v.bookingUrl || `/book/${v.id}`}>
                                Book Now <ArrowUpRight className="ml-1 h-3 w-3" />
                              </TransitionLink>
                            </Button>
                          ) : (
                            <span className="rounded bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold text-amber-400 border border-amber-500/30">
                              Unavailable for Dates
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* 2. Price Calculation Summary Card */}
                {m.priceCard && (
                  <div className="mt-2.5 w-full pl-8">
                    <div className="rounded-xl border border-gold/30 bg-neutral-900/90 p-3 shadow-lg">
                      <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
                        <div className="flex items-center gap-1.5">
                          <Receipt className="h-3.5 w-3.5 text-gold" />
                          <span className="text-xs font-bold text-white">
                            Authoritative Price Breakdown
                          </span>
                        </div>
                        <span className="rounded bg-gold/15 px-1.5 py-0.5 text-[10px] font-semibold text-gold">
                          {m.priceCard.rentalDays} Days
                        </span>
                      </div>

                      <div className="mt-2 space-y-1 text-[11px] text-neutral-300">
                        <div className="flex justify-between">
                          <span className="text-neutral-400">Vehicle:</span>
                          <span className="font-medium text-white">{m.priceCard.vehicleName}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-neutral-400">Base Daily Rate:</span>
                          <span>₹{m.priceCard.dailyRate}/day</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-neutral-400">Base Rental:</span>
                          <span>₹{m.priceCard.baseAmount}</span>
                        </div>
                        {m.priceCard.extrasAmount > 0 && (
                          <div className="flex justify-between text-amber-300">
                            <span>Selected Extras:</span>
                            <span>+₹{m.priceCard.extrasAmount}</span>
                          </div>
                        )}
                        {m.priceCard.discountAmount > 0 && (
                          <div className="flex justify-between text-emerald-400 font-medium">
                            <span>
                              Discount {m.priceCard.promoCode ? `(${m.priceCard.promoCode})` : ''}:
                            </span>
                            <span>-₹{m.priceCard.discountAmount}</span>
                          </div>
                        )}
                        <div className="flex justify-between text-neutral-400">
                          <span>Australian GST (10%):</span>
                          <span>₹{m.priceCard.taxAmount}</span>
                        </div>

                        <div className="flex justify-between border-t border-neutral-800 pt-1.5 text-xs font-bold text-white">
                          <span>Total Amount:</span>
                          <span className="text-gold text-sm font-extrabold">
                            ₹{m.priceCard.finalAmount}
                          </span>
                        </div>
                      </div>

                      <div className="mt-2.5 pt-1">
                        <Button
                          size="sm"
                          variant="gold"
                          className="w-full h-7 text-[11px] font-semibold"
                          asChild
                          onClick={() => setIsOpen(false)}
                        >
                          <TransitionLink
                            href={`/book/${m.priceCard.vehicleId}?pickupDate=${m.priceCard.pickupDate}&dropoffDate=${m.priceCard.dropoffDate}${m.priceCard.promoCode ? `&promo=${m.priceCard.promoCode}` : ''}`}
                          >
                            Continue Booking <ArrowRight className="ml-1 h-3 w-3" />
                          </TransitionLink>
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {/* 3. Availability Result Card */}
                {m.availabilityCard && (
                  <div className="mt-2.5 w-full pl-8">
                    <div
                      className={`rounded-xl border p-3 ${
                        m.availabilityCard.isAvailable
                          ? 'border-emerald-500/40 bg-emerald-950/20'
                          : 'border-amber-500/40 bg-amber-950/20'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          {m.availabilityCard.isAvailable ? (
                            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                          ) : (
                            <AlertCircle className="h-4 w-4 text-amber-400" />
                          )}
                          <span
                            className={`text-xs font-bold ${
                              m.availabilityCard.isAvailable ? 'text-emerald-300' : 'text-amber-300'
                            }`}
                          >
                            {m.availabilityCard.isAvailable ? 'AVAILABLE FOR DATES' : 'UNAVAILABLE'}
                          </span>
                        </div>
                        <span className="text-[10px] text-neutral-400">
                          {m.availabilityCard.pickupDate} → {m.availabilityCard.dropoffDate}
                        </span>
                      </div>

                      <p className="mt-2 text-[11px] text-neutral-300">
                        {m.availabilityCard.isAvailable
                          ? 'Vehicle is cleared and ready for immediate online reservation.'
                          : 'This vehicle is scheduled for maintenance or reserved during your selected dates. Please choose different dates.'}
                      </p>

                      {m.availabilityCard.isAvailable && m.availabilityCard.bookingUrl && (
                        <div className="mt-2.5 pt-1">
                          <Button
                            size="sm"
                            variant="gold"
                            className="w-full h-7 text-[11px] font-semibold"
                            asChild
                            onClick={() => setIsOpen(false)}
                          >
                            <TransitionLink href={m.availabilityCard.bookingUrl}>
                              Proceed with {m.availabilityCard.vehicleName}{' '}
                              <ArrowRight className="ml-1 h-3 w-3" />
                            </TransitionLink>
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* 4. Booking Draft Card */}
                {m.bookingDraft && (
                  <div className="mt-2.5 w-full pl-8">
                    <div className="rounded-xl border border-gold/40 bg-neutral-900/95 p-3.5 shadow-xl">
                      <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="h-4 w-4 text-gold" />
                          <span className="text-xs font-bold text-white">Trip Booking Draft</span>
                        </div>
                        <span className="text-xs font-extrabold text-gold">
                          ₹{m.bookingDraft.estimatedTotal}
                        </span>
                      </div>

                      <div className="mt-2 space-y-1 text-[11px] text-neutral-300">
                        <p className="font-bold text-white">{m.bookingDraft.vehicleName}</p>
                        <p className="text-neutral-400">
                          {m.bookingDraft.pickupDate} → {m.bookingDraft.dropoffDate}
                        </p>
                        <p className="text-neutral-400">Hub: {m.bookingDraft.pickupLocation}</p>
                      </div>

                      <div className="mt-3">
                        <Button
                          size="sm"
                          variant="gold"
                          className="w-full h-8 text-xs font-bold shadow-md"
                          asChild
                          onClick={() => setIsOpen(false)}
                        >
                          <TransitionLink href={m.bookingDraft.bookingUrl}>
                            Continue to Booking <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                          </TransitionLink>
                        </Button>
                      </div>
                      <p className="mt-1 text-center text-[9px] text-neutral-500">
                        Secured with 256-bit encrypted Razorpay checkout
                      </p>
                    </div>
                  </div>
                )}

                {/* Quick Action Suggestion Chips */}
                {m.quickActions && m.quickActions.length > 0 && (
                  <div className="mt-2.5 flex flex-wrap gap-1.5 pl-8">
                    {m.quickActions.map((action, i) => (
                      <button
                        key={i}
                        onClick={() => handleSendMessage(action)}
                        disabled={isLoading}
                        className="rounded-full border border-neutral-800 bg-neutral-900/60 px-2.5 py-1 text-[10px] font-medium text-neutral-300 transition-all hover:border-gold/50 hover:bg-gold/10 hover:text-gold"
                      >
                        {action}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {/* Live Interim Voice Transcript Preview */}
            {interimTranscript && (
              <div className="flex items-center gap-2 pl-8 text-xs text-neutral-400 animate-pulse">
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-red-500/20 text-red-400">
                  <Radio className="h-3 w-3 animate-ping" />
                </div>
                <span className="text-[11px] text-neutral-300 italic font-medium">
                  “{interimTranscript}…”
                </span>
              </div>
            )}

            {/* Typing Loader */}
            {isLoading && (
              <div className="flex items-center gap-2 pl-8 text-xs text-neutral-400">
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-gold/15 text-gold">
                  <Loader2 className="h-3 w-3 animate-spin text-gold" />
                </div>
                <span className="text-[11px] text-neutral-400 animate-pulse">
                  Running fleet tools & calculating rates...
                </span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Footer Input Form & Voice Control */}
          <div className="border-t border-neutral-800 bg-neutral-900/90 p-3">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center gap-2"
            >
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={
                  voiceState === 'LISTENING'
                    ? 'Listening to voice...'
                    : 'Ask or speak about cars, pricing, dates...'
                }
                disabled={isLoading}
                className="h-9 flex-1 border-neutral-800 bg-neutral-950 text-xs text-white placeholder:text-neutral-500 focus-visible:ring-gold"
              />

              {/* Dedicated Microphone Button */}
              <Button
                type="button"
                variant={voiceState === 'LISTENING' ? 'destructive' : 'outline'}
                size="sm"
                onClick={toggleVoiceMode}
                disabled={isLoading}
                title={voiceState === 'LISTENING' ? 'Stop listening' : 'Speak to NR Concierge'}
                aria-label={
                  voiceState === 'LISTENING' ? 'Stop voice listening' : 'Start voice input'
                }
                className={`h-9 w-9 p-0 flex-shrink-0 transition ${
                  voiceState === 'LISTENING'
                    ? 'bg-red-600 hover:bg-red-700 animate-pulse ring-2 ring-red-400'
                    : 'border-neutral-800 bg-neutral-950 text-neutral-300 hover:bg-neutral-800 hover:text-gold hover:border-gold/40'
                }`}
              >
                {voiceState === 'LISTENING' ? (
                  <MicOff className="h-4 w-4" />
                ) : (
                  <Mic className="h-4 w-4" />
                )}
              </Button>

              <Button
                type="submit"
                variant="gold"
                size="sm"
                disabled={isLoading || !input.trim()}
                aria-label="Send message"
                className="h-9 w-9 p-0 flex-shrink-0"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </form>
            <p className="mt-1.5 text-center text-[10px] text-neutral-500">
              Powered by Google Gemini AI • Multilingual Voice & Australian Fleet Engine
            </p>
          </div>
        </div>
      )}
    </>
  );
}
