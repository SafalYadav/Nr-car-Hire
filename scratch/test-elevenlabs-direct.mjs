import { config } from 'dotenv';
import { resolve } from 'path';

// Force load .env.local
config({ path: resolve(process.cwd(), '.env.local') });

async function test() {
  const VOICE_ID = process.env.ELEVENLABS_VOICE_ID;
  const API_KEY = process.env.ELEVENLABS_API_KEY;
  console.log('VOICE_ID:', VOICE_ID);
  console.log('API_KEY exists:', !!API_KEY);

  const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}/stream`, {
    method: 'POST',
    headers: {
      Accept: 'audio/mpeg',
      'xi-api-key': API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      text: 'Welcome to NR Car Hire',
      model_id: 'eleven_multilingual_v2',
    }),
  });

  console.log('Status:', response.status);
  console.log('Content-Type:', response.headers.get('content-type'));
}
test();
