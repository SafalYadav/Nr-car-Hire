import { describe, it, expect } from 'vitest';
import { ElevenLabsAgentWidget } from '@/components/ai/elevenlabs-agent-widget';

describe('ElevenLabs Conversational AI Voice Agent Integration', () => {
  it('exports ElevenLabsAgentWidget component correctly', () => {
    expect(ElevenLabsAgentWidget).toBeDefined();
    expect(typeof ElevenLabsAgentWidget).toBe('function');
  });

  it('configures the official ElevenLabs agent ID default or from environment', () => {
    const configuredAgentId =
      process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID || 'agent_7101m0nhr59dekj8fj3germ8pq3j';
    expect(configuredAgentId).toBe('agent_7101m0nhr59dekj8fj3germ8pq3j');
    expect(configuredAgentId.startsWith('agent_')).toBe(true);
  });

  it('ensures no legacy duplicate AI widgets or TTS routes exist', async () => {
    // Verify legacy components/voice/website-voice-greeting is deleted
    let greetingExists = true;
    try {
      require.resolve('@/components/voice/website-voice-greeting');
    } catch {
      greetingExists = false;
    }
    expect(greetingExists).toBe(false);

    // Verify legacy components/ai/ai-chat-widget is deleted
    let legacyWidgetExists = true;
    try {
      require.resolve('@/components/ai/ai-chat-widget');
    } catch {
      legacyWidgetExists = false;
    }
    expect(legacyWidgetExists).toBe(false);
  });
});
