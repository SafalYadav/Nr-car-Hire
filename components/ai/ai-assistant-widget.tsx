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
import { ConversationProvider, useConversation } from '@elevenlabs/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils/cn';
import type { SuggestedVehicle, PriceSummaryCard, AvailabilityCard } from '@/lib/services/ai-agent-service';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  suggestedVehicles?: SuggestedVehicle[];
  priceCard?: PriceSummaryCard;
  availabilityCard?: AvailabilityCard;
  quickActions?: string[];
}

function AiAssistantWidgetInner() {
  const [isOpen, setIsOpen] = useState(false);
  const [inputText, setInputText] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [initialAgentMessage, setInitialAgentMessage] = useState<string>('');

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // ElevenLabs Official Conversational AI Hook
  const conversation = useConversation({
    onConnect: () => {
      setIsConnecting(false);
      setErrorMessage(null);
    },
    onDisconnect: () => {
      setIsConnecting(false);
    },
    onMessage: (payload: { message: string; source: 'user' | 'ai' }) => {
      if (!payload.message) return;
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last && last.role === (payload.source === 'ai' ? 'assistant' : 'user') && last.content === payload.message) {
          return prev;
        }
        return [
          ...prev,
          {
            id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            role: payload.source === 'ai' ? 'assistant' : 'user',
            content: payload.message,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            quickActions: payload.source === 'ai' && prev.length <= 1 ? [
              'Is Camry available next weekend?',
              'Show me luxury SUVs',
              'What is your zero excess policy?',
              'Airport pickup locations',
            ] : undefined,
          },
        ];
      });
    },
    onError: (error: string | Error) => {
      console.error('ElevenLabs Agent Error:', error);
      setIsConnecting(false);
      const errText = typeof error === 'string' ? error : error?.message || 'ElevenLabs connection error';
      setErrorMessage(errText);
    },
  });

  // Auto-scroll chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isConnecting, conversation.isSpeaking]);

  // Fetch Agent's configured first message dynamically from ElevenLabs API
  useEffect(() => {
    async function loadAgentInitialMessage() {
      try {
        const res = await fetch('/api/ai/elevenlabs/signed-url');
        if (res.ok) {
          const data = await res.json();
          if (data.firstMessage) {
            setInitialAgentMessage(data.firstMessage);
            setMessages([
              {
                id: 'msg-initial',
                role: 'assistant',
                content: data.firstMessage,
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                quickActions: [
                  'Is Camry available next weekend?',
                  'Show me luxury SUVs',
                  'What is your zero excess policy?',
                  'Airport pickup locations',
                ],
              },
            ]);
          }
        }
      } catch (e) {
        console.warn('Could not prefetch agent greeting:', e);
      }
    }
    loadAgentInitialMessage();
  }, []);

  // Connect / Start Live ElevenLabs Realtime Voice Session
  const startLiveConversation = useCallback(async () => {
    if (conversation.status === 'connected' || conversation.status === 'connecting') return;

    try {
      setIsConnecting(true);
      setErrorMessage(null);

      // Request browser microphone access
      await navigator.mediaDevices.getUserMedia({ audio: true });

      // Fetch signed WebSocket URL from secure backend endpoint
      const res = await fetch('/api/ai/elevenlabs/signed-url');
      const data = await res.json();

      if (!data.success || !data.signedUrl) {
        throw new Error(data.error || 'Failed to retrieve ElevenLabs signed URL from server');
      }

      await conversation.startSession({
        signedUrl: data.signedUrl,
      });
    } catch (err: unknown) {
      setIsConnecting(false);
      const msg = err instanceof Error ? err.message : 'Microphone access or connection failed';
      setErrorMessage(msg);
    }
  }, [conversation]);

  // Disconnect Live Session
  const endLiveConversation = useCallback(async () => {
    try {
      await conversation.endSession();
    } catch (e) {
      console.warn('Session end note:', e);
    }
  }, [conversation]);

  // Handle user send message (Text or Quick Action)
  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || inputText).trim();
    if (!query) return;

    setInputText('');
    setErrorMessage(null);

    // If connected to ElevenLabs live session, send directly through client
    if (conversation.status === 'connected') {
      try {
        conversation.sendUserMessage(query);
      } catch (e) {
        console.warn('Error sending user message to ElevenLabs:', e);
      }
    } else {
      // Add message to UI and trigger live connection
      setMessages((prev) => [
        ...prev,
        {
          id: `usr-${Date.now()}`,
          role: 'user',
          content: query,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);

      try {
        await startLiveConversation();
      } catch (e) {
        console.warn('Connection trigger note:', e);
      }
    }
  };

  const handleOpenToggle = () => {
    setIsOpen((prev) => {
      const next = !prev;
      if (!next && conversation.status === 'connected') {
        endLiveConversation();
      }
      return next;
    });
  };

  const resetChat = () => {
    if (conversation.status === 'connected') {
      endLiveConversation();
    }
    if (initialAgentMessage) {
      setMessages([
        {
          id: 'msg-initial',
          role: 'assistant',
          content: initialAgentMessage,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          quickActions: [
            'Is Camry available next weekend?',
            'Show me luxury SUVs',
            'What is your zero excess policy?',
            'Airport pickup locations',
          ],
        },
      ]);
    } else {
      setMessages([]);
    }
    setErrorMessage(null);
  };

  const isLiveConnected = conversation.status === 'connected';
  const isSpeaking = conversation.isSpeaking;

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
            isSpeaking
              ? 'bg-linear-to-br from-gold via-amber-600 to-midnight text-midnight border-2 border-gold'
              : isLiveConnected
              ? 'bg-linear-to-br from-emerald-500 to-midnight text-white border-2 border-emerald-400'
              : 'bg-linear-to-br from-midnight via-slate-900 to-midnight text-gold border-2 border-gold/60 hover:border-gold'
          )}
        >
          {isSpeaking && (
            <span className="absolute inset-0 rounded-full animate-ping bg-gold/30 duration-1000" />
          )}

          {isOpen ? (
            <X className="h-6 w-6 text-white transition-transform group-hover:rotate-90" />
          ) : isSpeaking ? (
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
                        isSpeaking
                          ? 'bg-amber-400 animate-pulse'
                          : isLiveConnected
                          ? 'bg-emerald-400 animate-pulse'
                          : 'bg-emerald-500'
                      )}
                    />
                    {isSpeaking
                      ? 'AI Speaking (Sia)...'
                      : isLiveConnected
                      ? 'Live Voice Session Active'
                      : isConnecting
                      ? 'Connecting to ElevenLabs...'
                      : 'Authoritative Fleet Agent'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                {/* Voice Session Toggle Button */}
                <button
                  type="button"
                  onClick={isLiveConnected ? endLiveConversation : startLiveConversation}
                  className={cn(
                    'rounded-full px-2.5 py-1 text-[10px] font-semibold transition-all border flex items-center gap-1',
                    isLiveConnected
                      ? 'bg-emerald-500 text-white border-emerald-400'
                      : 'bg-white/5 text-gray-300 border-white/10 hover:text-white hover:border-gold/40'
                  )}
                  title={isLiveConnected ? 'End Voice Session' : 'Start Realtime Voice Session'}
                >
                  {isLiveConnected ? <MicOff className="h-3 w-3" /> : <Mic className="h-3 w-3" />}
                  <span>{isLiveConnected ? 'Live Voice On' : 'Start Voice'}</span>
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
                  onClick={() => setIsOpen(false)}
                  className="rounded-full p-1.5 text-gray-300 hover:bg-white/10 hover:text-white transition-colors"
                  aria-label="Minimize Assistant"
                >
                  <ChevronDown className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Voice Mode Visualizer Screen */}
            {isLiveConnected && (
              <div className="flex flex-col items-center justify-center p-5 bg-linear-to-b from-white/5 via-gold/5 to-transparent border-b border-white/10">
                <div
                  className={cn(
                    'relative flex h-20 w-20 items-center justify-center rounded-full transition-all duration-500',
                    isSpeaking
                      ? 'shadow-[0_0_40px_rgba(197,168,128,0.5)] border border-gold'
                      : 'shadow-[0_0_40px_rgba(16,185,129,0.4)] border border-emerald-400'
                  )}
                >
                  {isSpeaking && (
                    <motion.div
                      animate={{ scale: [1, 1.35, 1], opacity: [0.6, 0.1, 0.6] }}
                      transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
                      className="absolute inset-0 rounded-full border border-gold"
                    />
                  )}

                  <div
                    className={cn(
                      'flex h-14 w-14 items-center justify-center rounded-full transition-all',
                      isSpeaking
                        ? 'bg-linear-to-br from-gold to-amber-600 text-midnight scale-105'
                        : 'bg-linear-to-br from-emerald-400 to-teal-600 text-white'
                    )}
                  >
                    {isSpeaking ? (
                      <Volume2 className="h-7 w-7 animate-bounce text-midnight" />
                    ) : (
                      <Mic className="h-7 w-7 animate-pulse text-white" />
                    )}
                  </div>
                </div>

                <div className="mt-2.5 text-center">
                  <p className="text-xs font-semibold text-gold">
                    {isSpeaking
                      ? 'ElevenLabs Agent Speaking (Sia)...'
                      : 'Listening... Speak naturally anytime'}
                  </p>
                  <p className="text-[10px] text-gray-400 mt-0.5">
                    Persistent real-time microphone session • No restart required
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
                              ? 'Live Availability: Available'
                              : 'Live Availability: Unavailable'}
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

              {isConnecting && (
                <div className="flex items-center gap-2 text-gold text-xs py-2">
                  <Loader2 className="h-4 w-4 animate-spin text-gold" />
                  <span>Connecting to ElevenLabs Conversational AI Agent...</span>
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
                  onClick={isLiveConnected ? endLiveConversation : startLiveConversation}
                  className={cn(
                    'flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border transition-all',
                    isLiveConnected
                      ? 'bg-emerald-500 border-emerald-400 text-white animate-pulse'
                      : 'bg-white/10 border-white/15 text-gold hover:bg-white/20'
                  )}
                  title={isLiveConnected ? 'Stop Live Voice' : 'Start Live Voice Session'}
                  aria-label="Microphone"
                >
                  {isLiveConnected ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                </button>

                <Input
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Ask about cars, prices, airport hubs, or booking..."
                  className="flex-1 bg-white/10 border-white/15 text-white placeholder:text-gray-400 text-xs rounded-2xl h-10 focus-visible:ring-gold/50"
                />

                <Button
                  type="submit"
                  variant="gold"
                  size="icon"
                  disabled={!inputText.trim()}
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

export function AiAssistantWidget() {
  return (
    <ConversationProvider>
      <AiAssistantWidgetInner />
    </ConversationProvider>
  );
}
