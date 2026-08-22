import { NextResponse } from 'next/server';
import { z } from 'zod';
import { aiAgentService } from '@/lib/services/ai-agent-service';
import { handleError } from '@/lib/utils/errors';
import { logger } from '@/lib/utils/logger';

const ChatRequestSchema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(['user', 'assistant', 'system']),
        content: z.string().min(1, 'Message content cannot be empty').max(3000),
      }),
    )
    .min(1, 'At least one message is required'),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const validated = ChatRequestSchema.parse(body);

    const result = await aiAgentService.processChat(validated.messages);

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    logger.error('Error processing AI chat request:', error);
    const { status, body } = handleError(error);
    return NextResponse.json(body, { status });
  }
}
