// Vercel Serverless Function — Gemini 2.0 Flash Neural AI Voice Generator
export default async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || req.query?.apiKey || req.body?.apiKey;
  const text = req.method === 'POST' ? req.body?.text : req.query?.text;
  const opId = (req.method === 'POST' ? req.body?.opId : req.query?.opId) || 'op1';

  if (!text) {
    return res.status(400).json({ error: 'Text parameter is required' });
  }

  // Map 3 AI Operators to Gemini 2.0 Prebuilt Neural AI Voices
  // Malika (op1) -> Puck (Dynamic Female AI Voice)
  // Jasur (op2)  -> Charon (Deep Male AI Voice)
  // Nigora (op3) -> Kore (Warm Gentle Female AI Voice)
  const voiceMap = {
    op1: 'Puck',
    op2: 'Charon',
    op3: 'Kore'
  };
  const voiceName = voiceMap[opId] || 'Puck';

  // Clean markdown symbols for speech synthesis
  const cleanText = text
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/#+/g, '')
    .replace(/https?:\/\/\S+/g, '')
    .replace(/[\n\r]+/g, '. ')
    .replace(/\s+/g, ' ')
    .trim();

  // Mode 1: Gemini 2.0 Flash Multimodal Neural Voice Synthesis
  if (apiKey) {
    try {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

      const payload = {
        contents: [
          {
            role: 'user',
            parts: [{ text: `Say the following Uzbek text naturally with exact human pronunciation and warmth. Do not add intro text, only pronounce: ${cleanText}` }]
          }
        ],
        generationConfig: {
          responseModalities: ["AUDIO", "TEXT"],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: {
                voiceName: voiceName
              }
            }
          }
        }
      };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        const data = await response.json();
        const parts = data.candidates?.[0]?.content?.parts || [];

        // Search for inline audio data part
        const audioPart = parts.find(p => p.inlineData && p.inlineData.data);
        if (audioPart) {
          const mimeType = audioPart.inlineData.mimeType || 'audio/pcm;rate=24000';
          const base64Data = audioPart.inlineData.data;
          const pcmBuffer = Buffer.from(base64Data, 'base64');

          if (mimeType.includes('pcm')) {
            const wavBuffer = pcmToWav(pcmBuffer, 24000);
            res.setHeader('Content-Type', 'audio/wav');
            res.setHeader('Content-Length', wavBuffer.length);
            res.setHeader('Cache-Control', 'public, max-age=86400');
            return res.status(200).send(wavBuffer);
          } else {
            res.setHeader('Content-Type', mimeType);
            res.setHeader('Content-Length', pcmBuffer.length);
            res.setHeader('Cache-Control', 'public, max-age=86400');
            return res.status(200).send(pcmBuffer);
          }
        }
      }
    } catch (err) {
      console.warn("Gemini 2.0 Audio generation warning, switching to HD audio fallback:", err);
    }
  }

  // Mode 2: High-Definition Fallback Audio Stream
  try {
    const googleTtsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(cleanText)}&tl=uz&client=tw-ob`;

    const audioRes = await fetch(googleTtsUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Referer': 'https://translate.google.com/'
      }
    });

    if (!audioRes.ok) {
      throw new Error(`TTS API returned status ${audioRes.status}`);
    }

    const arrayBuffer = await audioRes.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Content-Length', buffer.length);
    res.setHeader('Cache-Control', 'public, max-age=86400');
    return res.status(200).send(buffer);

  } catch (error) {
    console.error("TTS Fallback error:", error);
    return res.status(500).json({ error: error.message });
  }
}

// Convert Raw PCM 16-bit Mono Buffer to standard WAV format with 44-byte Header
function pcmToWav(pcmBuffer, sampleRate = 24000) {
  const numChannels = 1;
  const bitsPerSample = 16;
  const byteRate = sampleRate * numChannels * (bitsPerSample / 8);
  const blockAlign = numChannels * (bitsPerSample / 8);
  const dataSize = pcmBuffer.length;
  const header = Buffer.alloc(44);

  header.write('RIFF', 0);
  header.writeUInt32LE(36 + dataSize, 4);
  header.write('WAVE', 8);
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(numChannels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(byteRate, 28);
  header.writeUInt16LE(blockAlign, 32);
  header.writeUInt16LE(bitsPerSample, 34);
  header.write('data', 36);
  header.writeUInt32LE(dataSize, 40);

  return Buffer.concat([header, pcmBuffer]);
}
