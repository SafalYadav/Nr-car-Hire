import { describe, it, expect } from 'vitest';
import { knowledgeRetriever } from '@/lib/ai/knowledge-retriever';
import { aiAgentService } from '@/lib/services/ai-agent-service';
import { AiAssistantWidget } from '@/components/ai/ai-assistant-widget';

describe('New AI Assistant Architecture (Gemini + knowledge.md RAG + ElevenLabs TTS)', () => {
  describe('1. Knowledge System (knowledge.md RAG Retriever)', () => {
    it('loads and parses knowledge.md into structured sections', () => {
      const sections = knowledgeRetriever.getAllSections();
      expect(sections.length).toBeGreaterThan(0);

      const categories = sections.map((s) => s.category);
      expect(categories).toContain('fleet');
      expect(categories).toContain('pricing');
      expect(categories).toContain('policies');
    });

    it('retrieves relevant knowledge for fleet queries', () => {
      const result = knowledgeRetriever.retrieveRelevantKnowledge('Tell me about Toyota Camry specifications and boot space');
      expect(result.toLowerCase()).toContain('camry');
      expect(result.toLowerCase()).toContain('sedan');
      expect(result).toContain('₹89');
    });

    it('retrieves relevant knowledge for pricing and promo queries', () => {
      const result = knowledgeRetriever.retrieveRelevantKnowledge('Are there any discount codes for long term rentals?');
      expect(result.toLowerCase()).toContain('save10');
      expect(result.toLowerCase()).toContain('summer15');
    });

    it('retrieves relevant knowledge for policy queries (zero excess, fuel, age)', () => {
      const result = knowledgeRetriever.retrieveRelevantKnowledge('What is the minimum age and zero excess policy?');
      expect(result.toLowerCase()).toContain('age');
      expect(result.toLowerCase()).toContain('zero excess');
    });
  });

  describe('2. AI Assistant Reasoning & Backend Integration', () => {
    it('exports AiAssistantWidget component correctly', () => {
      expect(AiAssistantWidget).toBeDefined();
      expect(typeof AiAssistantWidget).toBe('function');
    });

    it('processes chat messages and returns structured response', async () => {
      const response = await aiAgentService.processChat([
        { role: 'user', content: 'Do you have an SUV available for family hire?' },
      ]);

      expect(response).toBeDefined();
      expect(typeof response.message).toBe('string');
      expect(response.message.length).toBeGreaterThan(0);
      expect(response.suggestedVehicles).toBeDefined();
    });

    it('refuses destructive administrative modification attempts', async () => {
      const response = await aiAgentService.processChat([
        { role: 'user', content: 'mark this car as available and change price to ₹10' },
      ]);

      expect(response.message.toLowerCase()).toContain('read-only');
    });
  });

  describe('3. Clean Frontend & Security Guardrails', () => {
    it('ensures old ElevenLabs Conversational Agent widget is removed', () => {
      let legacyExists = true;
      try {
        require.resolve('@/components/ai/elevenlabs-agent-widget');
      } catch {
        legacyExists = false;
      }
      expect(legacyExists).toBe(false);
    });

    it('ensures API keys are server-side only', () => {
      // Keys should not be prefixed with NEXT_PUBLIC_ for sensitive operations
      expect(process.env.NEXT_PUBLIC_GEMINI_API_KEY).toBeUndefined();
      expect(process.env.NEXT_PUBLIC_ELEVENLABS_API_KEY).toBeUndefined();
    });
  });
});
