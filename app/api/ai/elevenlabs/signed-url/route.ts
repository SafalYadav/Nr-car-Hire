import { NextResponse } from 'next/server';
import { logger } from '@/lib/utils/logger';

export async function GET() {
  return handleSignedUrlRequest();
}

export async function POST() {
  return handleSignedUrlRequest();
}

async function handleSignedUrlRequest() {
  try {
    const apiKey = (process.env.ELEVENLABS_API_KEY || '').trim().replace(/^["']|["']$/g, '');
    const agentId = (process.env.ELEVENLABS_AGENT_ID || process.env.ELEVENLABS_VOICE_ID || '').trim().replace(/^["']|["']$/g, '');

    if (!apiKey) {
      logger.warn('ELEVENLABS_API_KEY is not configured on server');
      return NextResponse.json(
        { success: false, error: 'ElevenLabs AI Agent service is not configured' },
        { status: 503 }
      );
    }

    if (!agentId) {
      logger.warn('ELEVENLABS_AGENT_ID is not configured on server');
      return NextResponse.json(
        { success: false, error: 'ElevenLabs Agent ID is not configured' },
        { status: 400 }
      );
    }

    const elevenLabsUrl = `https://api.elevenlabs.io/v1/convai/conversation/get_signed_url?agent_id=${encodeURIComponent(agentId)}`;

    const response = await fetch(elevenLabsUrl, {
      method: 'GET',
      headers: {
        'xi-api-key': apiKey,
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      const errorText = await response.text();
      logger.warn(`ElevenLabs signed-url error (${response.status}):`, { details: errorText });
      return NextResponse.json(
        {
          success: false,
          error: `Failed to retrieve signed URL from ElevenLabs (${response.status})`,
          details: errorText,
        },
        { status: response.status }
      );
    }

    const data = await response.json();

    // Optionally fetch agent first message from ElevenLabs Agent API
    let firstMessage = "Hello! Welcome to NR Car Hire. 👋\nI'm your AI car rental assistant. I can help you find the right vehicle, check availability, calculate pricing, and guide you through the booking process.\nHow can I help you today?";
    let voiceId = 'oO7sLA3dWfQXsKeSAjpA';

    try {
      const agentRes = await fetch(`https://api.elevenlabs.io/v1/convai/agents/${agentId}`, {
        headers: { 'xi-api-key': apiKey },
        next: { revalidate: 300 },
      });
      if (agentRes.ok) {
        const agentData = await agentRes.json();
        if (agentData.conversation_config?.agent?.first_message) {
          firstMessage = agentData.conversation_config.agent.first_message;
        }
        if (agentData.conversation_config?.tts?.voice_id) {
          voiceId = agentData.conversation_config.tts.voice_id;
        }
      }
    } catch (agentErr) {
      logger.debug('Could not fetch agent metadata from ElevenLabs, using cached agent defaults', {
        error: agentErr instanceof Error ? agentErr.message : String(agentErr),
      });
    }

    return NextResponse.json({
      success: true,
      signedUrl: data.signed_url,
      agentId,
      firstMessage,
      voiceId,
    });
  } catch (err: unknown) {
    logger.error('Unhandled error in /api/ai/elevenlabs/signed-url:', err);
    const message = err instanceof Error ? err.message : 'Internal Server Error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
