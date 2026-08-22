import { NextResponse } from 'next/server';
import { logger } from '@/lib/utils/logger';

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const text = typeof body?.text === 'string' ? body.text.trim() : '';

    if (!text) {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 });
    }

    const VOICE_ID = process.env.ELEVENLABS_VOICE_ID?.trim();
    const API_KEY = process.env.ELEVENLABS_API_KEY?.trim();

    if (!API_KEY || !VOICE_ID) {
      return NextResponse.json(
        { error: 'ElevenLabs configuration is missing' },
        { status: 503 },
      );
    }

    // Using ElevenLabs Streaming API for lowest latency
    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}/stream`, {
      method: 'POST',
      headers: {
        Accept: 'audio/mpeg',
        'xi-api-key': API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
        model_id: 'eleven_multilingual_v2',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
          style: 0.0,
          use_speaker_boost: true,
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      logger.warn('ElevenLabs API returned non-OK status', {
        status: response.status,
        error: errorText,
      });
      return NextResponse.json(
        { error: 'ElevenLabs API Error', status: response.status },
        { status: response.status },
      );
    }

    // Return the audio stream directly to the client
    return new NextResponse(response.body, {
      status: 200,
      headers: {
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'no-cache',
      },
    });
  } catch (error) {
    logger.warn('TTS generation caught exception', { error });
    return NextResponse.json({ error: 'Failed to generate speech' }, { status: 500 });
  }
}
