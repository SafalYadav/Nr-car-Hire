import { NextResponse } from 'next/server';
import { z } from 'zod';
import { logger } from '@/lib/utils/logger';

const TtsRequestSchema = z.object({
  text: z.string().min(1, 'Text cannot be empty').max(2500, 'Text exceeds limit'),
  voiceId: z.string().optional(),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const validated = TtsRequestSchema.parse(body);

    const apiKey = (process.env.ELEVENLABS_API_KEY || '').trim().replace(/^["']|["']$/g, '');
    const defaultVoiceId =
      (process.env.ELEVENLABS_VOICE_ID || 'oO7sLA3dWfQXsKeSAjpA').trim().replace(/^["']|["']$/g, '');
    const voiceId = validated.voiceId || defaultVoiceId;

    if (!apiKey) {
      logger.warn('ELEVENLABS_API_KEY is not configured on server');
      return NextResponse.json(
        { success: false, error: 'Voice synthesis service is not configured' },
        { status: 503 }
      );
    }

    // Clean text for optimal TTS articulation (strip markdown links, URLs, symbols)
    const cleanText = validated.text
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // [link text](url) -> link text
      .replace(/https?:\/\/\S+/g, '') // remove raw URLs
      .replace(/[`*#_~]/g, '') // remove markdown symbols
      .replace(/₹/g, 'dollars ') // pronounce currency clearly
      .replace(/\s+/g, ' ')
      .trim();

    const elevenLabsUrl = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream`;

    const response = await fetch(elevenLabsUrl, {
      method: 'POST',
      headers: {
        Accept: 'audio/mpeg',
        'xi-api-key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: cleanText,
        model_id: 'eleven_turbo_v2_5', // ultra-fast low-latency TTS model
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.8,
          use_speaker_boost: true,
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      logger.error(`ElevenLabs TTS API error (${response.status}):`, errorText);
      return NextResponse.json(
        { success: false, error: `TTS generation failed with status ${response.status}` },
        { status: response.status }
      );
    }

    const audioBuffer = await response.arrayBuffer();

    return new Response(audioBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': String(audioBuffer.byteLength),
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (err: unknown) {
    logger.error('Unhandled error in /api/ai/tts:', err);
    const message = err instanceof Error ? err.message : 'Internal Server Error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
