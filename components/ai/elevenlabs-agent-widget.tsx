'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ConversationProvider, useConversation } from '@elevenlabs/react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mic,
  MicOff,
  PhoneOff,
  Sparkles,
  X,
  Volume2,
  VolumeX,
  Radio,
  ChevronDown,
  Car,
  ShieldCheck,
  Plane,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils/cn';

interface ChatMessage {
  id: string;
  source: 'user' | 'ai';
  text: string;
  timestamp: string;
}

const DEFAULT_AGENT_ID =
  process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID || 'agent_7101m0nhr59dekj8fj3germ8pq3j';

function ElevenLabsVoiceAgentInner() {
  const [isOpen, setIsOpen] = useState(false);
  const [isVolumeMuted, setIsVolumeMuted] = useState(false);
  const [transcriptMessages, setTranscriptMessages] = useState<ChatMessage[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const transcriptEndRef = useRef<HTMLDivElement>(null);

  const conversation = useConversation({
    onConnect: () => {
      setErrorMessage(null);
    },
    onDisconnect: () => {
      // Clean disconnect
    },
    onMessage: (message) => {
      if (message && typeof message === 'object' && 'message' in message && typeof message.message === 'string') {
        const source = message.source === 'user' ? 'user' : 'ai';
        setTranscriptMessages((prev) => [
          ...prev,
          {
            id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            source,
            text: message.message as string,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
      }
    },
    onError: (err) => {
      console.error('ElevenLabs AI Agent error:', err);
      const msg = typeof err === 'string' ? err : 'Connection lost. Please try again.';
      setErrorMessage(msg);
    },
  });

  const {
    status,
    isSpeaking,
    isListening,
    isMuted,
    setMuted,
    startSession,
    endSession,
    sendUserMessage,
  } = conversation;

  const isConnected = status === 'connected';
  const isConnecting = status === 'connecting';

  // Auto scroll transcript
  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcriptMessages]);

  const handleStartConversation = useCallback(async () => {
    try {
      setErrorMessage(null);
      // Request microphone permission explicitly for smooth UX
      await navigator.mediaDevices.getUserMedia({ audio: true });
      await startSession({
        agentId: DEFAULT_AGENT_ID,
      });
    } catch (err: unknown) {
      console.error('Failed to start ElevenLabs session:', err);
      if (err instanceof Error && err.name === 'NotAllowedError') {
        setErrorMessage('Microphone access was denied. Please allow microphone permissions.');
      } else {
        setErrorMessage('Could not connect to AI Voice Agent. Please check your connection.');
      }
    }
  }, [startSession]);

  const handleEndConversation = useCallback(async () => {
    try {
      await endSession();
    } catch (err) {
      console.error('Error ending session:', err);
    }
  }, [endSession]);

  const handleQuickPrompt = (promptText: string) => {
    if (!isConnected) {
      handleStartConversation();
    } else {
      sendUserMessage(promptText);
    }
  };

  return (
    <>
      {/* Floating Action Trigger Button */}
      <aside
        aria-label="NR Concierge Voice Assistant"
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
              <span
                className={cn(
                  'absolute inline-flex h-full w-full rounded-full opacity-75',
                  isConnected ? 'animate-ping bg-emerald-400' : 'bg-gold animate-pulse'
                )}
              />
              <span
                className={cn(
                  'relative inline-flex h-2 w-2 rounded-full',
                  isConnected ? 'bg-emerald-500' : 'bg-gold'
                )}
              />
            </span>
            <span>{isConnected ? 'Voice Call Active' : 'NR AI Concierge'}</span>
          </motion.div>
        )}

        <motion.button
          onClick={() => setIsOpen((prev) => !prev)}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          aria-expanded={isOpen}
          aria-label="Open NR Concierge Voice Assistant"
          className={cn(
            'group relative flex h-14 w-14 items-center justify-center rounded-full shadow-2xl transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-gold/30',
            isConnected
              ? 'bg-linear-to-br from-emerald-500 to-teal-700 text-white'
              : 'bg-linear-to-br from-midnight via-slate-900 to-midnight text-gold border-2 border-gold/60 hover:border-gold'
          )}
        >
          {/* Pulsing ring when connected */}
          {isConnected && (
            <span className="absolute inset-0 rounded-full animate-ping bg-emerald-400/30 duration-1000" />
          )}

          {isOpen ? (
            <X className="h-6 w-6 text-white transition-transform group-hover:rotate-90" />
          ) : isConnected ? (
            <Radio className="h-6 w-6 text-white animate-pulse" />
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

      {/* Main Luxury Voice Agent Modal */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.95 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="fixed bottom-24 right-4 sm:right-6 z-50 flex w-[calc(100vw-2rem)] max-w-sm sm:max-w-md flex-col overflow-hidden rounded-3xl border border-gold/30 bg-midnight/95 text-white shadow-2xl backdrop-blur-xl"
            role="dialog"
            aria-modal="true"
            aria-label="NR Concierge Voice Assistant Dialog"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-4 bg-white/5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gold/15 border border-gold/30 text-gold shadow-inner">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-display font-bold text-sm tracking-wide text-white">
                      NR Concierge
                    </h3>
                    <span className="rounded-full bg-gold/20 px-2 py-0.5 text-[10px] font-semibold text-gold border border-gold/30 uppercase tracking-wider">
                      ElevenLabs AI
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-300 flex items-center gap-1.5">
                    <span
                      className={cn(
                        'inline-block h-2 w-2 rounded-full',
                        isConnected
                          ? 'bg-emerald-400 animate-pulse'
                          : isConnecting
                          ? 'bg-amber-400 animate-pulse'
                          : 'bg-gray-400'
                      )}
                    />
                    {isConnected
                      ? isSpeaking
                        ? 'AI Speaking...'
                        : isListening
                        ? 'Listening to you...'
                        : 'Voice Session Active'
                      : isConnecting
                      ? 'Connecting to Voice Agent...'
                      : 'Voice Assistant Ready'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setIsVolumeMuted((prev) => !prev)}
                  className="rounded-full p-2 text-gray-300 hover:bg-white/10 hover:text-white transition-colors"
                  aria-label={isVolumeMuted ? 'Unmute Audio' : 'Mute Audio'}
                >
                  {isVolumeMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                </button>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="rounded-full p-2 text-gray-300 hover:bg-white/10 hover:text-white transition-colors"
                  aria-label="Minimize Assistant"
                >
                  <ChevronDown className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Visualizer & Dynamic Sound Wave Orb */}
            <div className="relative flex flex-col items-center justify-center px-6 py-8 overflow-hidden bg-linear-to-b from-transparent via-gold/5 to-transparent">
              {/* Pulsing ambient orbs */}
              <div
                className={cn(
                  'relative flex h-28 w-28 items-center justify-center rounded-full transition-all duration-700',
                  isConnected
                    ? isSpeaking
                      ? 'shadow-[0_0_50px_rgba(197,168,128,0.45)]'
                      : isListening
                      ? 'shadow-[0_0_50px_rgba(16,185,129,0.35)]'
                      : 'shadow-[0_0_30px_rgba(197,168,128,0.2)]'
                    : 'shadow-[0_0_20px_rgba(255,255,255,0.05)]'
                )}
              >
                {/* Visualizer ripple rings */}
                {isConnected && (
                  <>
                    <motion.div
                      animate={
                        isSpeaking
                          ? { scale: [1, 1.35, 1], opacity: [0.6, 0.1, 0.6] }
                          : isListening
                          ? { scale: [1, 1.2, 1], opacity: [0.4, 0.1, 0.4] }
                          : { scale: 1, opacity: 0.2 }
                      }
                      transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
                      className={cn(
                        'absolute inset-0 rounded-full border',
                        isSpeaking ? 'border-gold' : 'border-emerald-400'
                      )}
                    />
                    <motion.div
                      animate={
                        isSpeaking
                          ? { scale: [1.1, 1.55, 1.1], opacity: [0.4, 0, 0.4] }
                          : { scale: 1, opacity: 0 }
                      }
                      transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut', delay: 0.3 }}
                      className="absolute inset-0 rounded-full border border-gold/60"
                    />
                  </>
                )}

                {/* Center Audio Sphere */}
                <div
                  className={cn(
                    'flex h-20 w-20 items-center justify-center rounded-full transition-all duration-500 border',
                    isConnected
                      ? isSpeaking
                        ? 'bg-linear-to-br from-gold via-amber-600 to-midnight border-gold text-midnight scale-105'
                        : isListening
                        ? 'bg-linear-to-br from-emerald-400 via-teal-600 to-midnight border-emerald-300 text-white'
                        : 'bg-linear-to-br from-midnight via-slate-800 to-midnight border-gold/40 text-gold'
                      : 'bg-linear-to-br from-midnight via-slate-900 to-midnight border-white/20 text-gray-400'
                  )}
                >
                  {isConnected ? (
                    isSpeaking ? (
                      <Volume2 className="h-9 w-9 animate-bounce text-midnight" />
                    ) : isListening ? (
                      <Mic className="h-9 w-9 animate-pulse text-white" />
                    ) : (
                      <Radio className="h-8 w-8 text-gold" />
                    )
                  ) : (
                    <Sparkles className="h-8 w-8 text-gold" />
                  )}
                </div>
              </div>

              {/* Status Caption */}
              <div className="mt-4 text-center">
                <p className="text-xs font-semibold tracking-wide text-gold">
                  {isConnected
                    ? isSpeaking
                      ? 'AI Concierge is Speaking...'
                      : isListening
                      ? 'Speak now, agent is listening...'
                      : 'Connected — Speak anytime'
                    : isConnecting
                    ? 'Establishing secure voice stream...'
                    : 'Instant Voice Booking & Fleet Assistance'}
                </p>
                <p className="text-[11px] text-gray-300 mt-0.5">
                  {isConnected
                    ? 'Hands-free 2-way conversation in real-time'
                    : 'Tap "Start Voice Conversation" to speak with our AI agent'}
                </p>
              </div>
            </div>

            {/* Error banner */}
            {errorMessage && (
              <div className="mx-4 mb-2 rounded-xl bg-red-500/15 border border-red-500/30 p-2.5 text-xs text-red-200">
                {errorMessage}
              </div>
            )}

            {/* Live Transcript / Recent Messages */}
            {transcriptMessages.length > 0 && (
              <div className="mx-4 max-h-36 overflow-y-auto rounded-2xl bg-black/30 border border-white/5 p-3 space-y-2 text-xs">
                {transcriptMessages.slice(-4).map((msg) => (
                  <div
                    key={msg.id}
                    className={cn(
                      'rounded-xl px-3 py-1.5 max-w-[85%]',
                      msg.source === 'user'
                        ? 'ml-auto bg-gold/20 text-white border border-gold/30'
                        : 'mr-auto bg-white/10 text-gray-200 border border-white/10'
                    )}
                  >
                    <p className="text-[10px] font-semibold opacity-70 mb-0.5">
                      {msg.source === 'user' ? 'You' : 'NR Concierge'}
                    </p>
                    <p className="leading-relaxed">{msg.text}</p>
                  </div>
                ))}
                <div ref={transcriptEndRef} />
              </div>
            )}

            {/* Suggested Voice Prompts */}
            {!isConnected && (
              <div className="px-5 py-2">
                <p className="text-[10px] uppercase tracking-wider text-gray-300 font-semibold mb-2">
                  Popular Questions to Ask:
                </p>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleQuickPrompt('Is Toyota Camry available in Sydney?')}
                    className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] text-gray-300 hover:border-gold/50 hover:bg-gold/10 hover:text-white transition-colors"
                  >
                    <Car className="h-3 w-3 text-gold" />
                    <span>Camry Availability</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickPrompt('What are the airport pickup locations?')}
                    className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] text-gray-300 hover:border-gold/50 hover:bg-gold/10 hover:text-white transition-colors"
                  >
                    <Plane className="h-3 w-3 text-gold" />
                    <span>Airport Hubs</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickPrompt('Tell me about zero excess insurance.')}
                    className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] text-gray-300 hover:border-gold/50 hover:bg-gold/10 hover:text-white transition-colors"
                  >
                    <ShieldCheck className="h-3 w-3 text-gold" />
                    <span>Zero Excess</span>
                  </button>
                </div>
              </div>
            )}

            {/* Bottom Controls Panel */}
            <div className="border-t border-white/10 p-4 bg-white/5">
              {!isConnected ? (
                <Button
                  variant="gold"
                  size="lg"
                  className="w-full font-semibold shadow-lg shadow-gold/20 flex items-center justify-center gap-2 text-sm"
                  disabled={isConnecting}
                  onClick={handleStartConversation}
                >
                  <Mic className="h-4 w-4" />
                  <span>{isConnecting ? 'Connecting...' : 'Start Voice Conversation'}</span>
                </Button>
              ) : (
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="default"
                    onClick={() => setMuted(!isMuted)}
                    className={cn(
                      'flex-1 text-xs font-semibold border-white/20',
                      isMuted
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                        : 'bg-white/10 text-white hover:bg-white/20'
                    )}
                  >
                    {isMuted ? (
                      <>
                        <MicOff className="h-4 w-4 mr-1.5 text-amber-300" />
                        <span>Muted</span>
                      </>
                    ) : (
                      <>
                        <Mic className="h-4 w-4 mr-1.5 text-emerald-400" />
                        <span>Mute Mic</span>
                      </>
                    )}
                  </Button>

                  <Button
                    variant="destructive"
                    size="default"
                    onClick={handleEndConversation}
                    className="flex-1 text-xs font-semibold bg-red-600/90 hover:bg-red-700 text-white flex items-center justify-center gap-1.5 shadow-md shadow-red-900/30"
                  >
                    <PhoneOff className="h-4 w-4" />
                    <span>End Conversation</span>
                  </Button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export function ElevenLabsAgentWidget() {
  return (
    <ConversationProvider>
      <ElevenLabsVoiceAgentInner />
    </ConversationProvider>
  );
}
