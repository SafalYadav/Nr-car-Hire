import { NextResponse } from 'next/server';
import { logger } from '@/lib/utils/logger';

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const text = typeof body?.text === 'string' ? body.text.trim() : '';

    if (!text) {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 });
    }

    const sanitizeEnv = (val?: string) =>
      val ? val.trim().replace(/^["\x27]|["\x27]$/g, '').trim() : '';

    let VOICE_ID = sanitizeEnv(process.env.ELEVENLABS_VOICE_ID);
    const API_KEY = sanitizeEnv(process.env.ELEVENLABS_API_KEY);

    if (!API_KEY) {
      return NextResponse.json(
        { error: 'ElevenLabs configuration is missing' },
        { status: 503 },
      );
    }

    // Default pre-made high-quality conversational voice if not provided
    if (!VOICE_ID) {
      VOICE_ID = 'EXAVITQu4vr4xnSDxMaL'; // Sarah - Warm & Professional
    }

    const callElevenLabs = async (voice: string) => {
      return fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voice}/stream`, {
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
    };

    let response = await callElevenLabs(VOICE_ID);

    // If configured voice is a paid library voice rejected with 402 on a free plan, fallback to standard premade voice
    if (response.status === 402 && VOICE_ID !== 'EXAVITQu4vr4xnSDxMaL') {
      logger.info('ElevenLabs library voice requires paid plan, falling back to standard voice EXAVITQu4vr4xnSDxMaL');
      response = await callElevenLabs('EXAVITQu4vr4xnSDxMaL');
    }

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
