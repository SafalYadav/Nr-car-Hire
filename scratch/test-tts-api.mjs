import 'dotenv/config';

async function testTTS() {
  const response = await fetch('http://localhost:3000/api/tts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: 'Welcome to NR Car Hire.' }),
  });
  console.log('Status:', response.status);
  console.log('Content-Type:', response.headers.get('content-type'));

  if (!response.ok) {
    console.log('Error:', await response.text());
  } else {
    const buffer = await response.arrayBuffer();
    console.log(`Success! Received audio stream. Size: ${buffer.byteLength} bytes`);
  }
}
testTTS();
