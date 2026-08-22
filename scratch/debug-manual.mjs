import 'dotenv/config';
import { aiAgentService } from '../lib/services/ai-agent-service.ts';

async function run() {
  const res = await aiAgentService.processChat([
    { role: 'user', content: 'Actually manual is okay' },
  ]);
  console.log(JSON.stringify(res, null, 2));
}
run();
