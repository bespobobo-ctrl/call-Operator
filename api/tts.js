// Vercel Serverless Function — Multi-Provider Ultra-HD Uzbek AI Voice Engine
import { MsEdgeTTS, OUTPUT_FORMAT } from 'msedge-tts';

export default async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-ElevenLabs-Key, X-OpenAI-Key, X-Gemini-Key');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const text = req.method === 'POST' ? req.body?.text : req.query?.text;
  const opId = (req.method === 'POST' ? req.body?.opId : req.query?.opId) || 'op1';
  
  const customElevenKey = (req.headers['x-elevenlabs-key'] || req.query?.elevenKey || process.env.ELEVENLABS_API_KEY || '').trim();
  const customOpenAiKey = (req.headers['x-openai-key'] || req.query?.openaiKey || process.env.OPENAI_API_KEY || '').trim();
  const customGeminiKey = (req.headers['x-gemini-key'] || req.query?.geminiKey || process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || '').trim();

  if (!text) {
    return res.status(400).json({ error: 'Text parameter is required' });
  }

  // Clean markdown & Uzbek apostrophes (' ` ʻ ’ ") that break URL encoding and TTS endpoints
  const cleanText = text
    .replace(/['`ʻ’"]/g, '') // Remove quotes/apostrophes to ensure 100% valid URL query and SSML
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/#+/g, '')
    .replace(/https?:\/\/\S+/g, '')
    .replace(/[\n\r]+/g, '. ')
    .replace(/\s+/g, ' ')
    .trim();

  if (!cleanText) {
    return res.status(400).json({ error: 'Clean text is empty' });
  }

  // Engine 1: ElevenLabs Multilingual v2 Ultra-Realistic Voice API (If Key Provided)
  if (customElevenKey && customElevenKey.length > 10) {
    try {
      const elevenVoiceMap = {
        op1: '21m00Tcm4TlvDq8ikWAM', // Rachel (Female)
        op2: 'ErXwobaYiN019PkySvjV', // Antoni (Deep Male)
        op3: 'EXAVITQu4vr4xnSDxMaL'  // Bella (Soft Female)
      };
      const voiceId = elevenVoiceMap[opId] || elevenVoiceMap.op1;
      const elevenUrl = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`;

      const response = await fetch(elevenUrl, {
        method: 'POST',
        headers: {
          'Accept': 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': customElevenKey
        },
        body: JSON.stringify({
          text: cleanText,
          model_id: 'eleven_multilingual_v2',
          voice_settings: { stability: 0.75, similarity_boost: 0.85 }
        })
      });

      if (response.ok) {
        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        res.setHeader('Content-Type', 'audio/mpeg');
        res.setHeader('Content-Length', buffer.length);
        res.setHeader('Cache-Control', 'public, max-age=86400');
        return res.status(200).send(buffer);
      }
    } catch (e) {
      console.warn("ElevenLabs TTS Warning:", e);
    }
  }

  // Engine 2: OpenAI High-Definition Audio TTS API (If Key Provided)
  if (customOpenAiKey && customOpenAiKey.length > 10) {
    try {
      const openAiVoiceMap = {
        op1: 'nova',    // Upbeat Female
        op2: 'onyx',    // Deep Male
        op3: 'shimmer' // Soft Female
      };
      const voice = openAiVoiceMap[opId] || 'nova';

      const response = await fetch('https://api.openai.com/v1/audio/speech', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${customOpenAiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'tts-1',
          input: cleanText,
          voice: voice,
          response_format: 'mp3'
        })
      });

      if (response.ok) {
        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        res.setHeader('Content-Type', 'audio/mpeg');
        res.setHeader('Content-Length', buffer.length);
        res.setHeader('Cache-Control', 'public, max-age=86400');
        return res.status(200).send(buffer);
      }
    } catch (e) {
      console.warn("OpenAI Audio TTS Warning:", e);
    }
  }

  // Engine 3: Gemini 2.0 Flash Multimodal Audio Generation (If Key Provided)
  if (customGeminiKey && customGeminiKey.length > 10) {
    try {
      const geminiVoiceMap = { op1: 'Puck', op2: 'Charon', op3: 'Kore' };
      const voiceName = geminiVoiceMap[opId] || 'Puck';
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${customGeminiKey}`;

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: `Say this exact phrase naturally: ${cleanText}` }] }],
          generationConfig: {
            responseModalities: ["AUDIO", "TEXT"],
            speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName } } }
          }
        })
      });

      if (response.ok) {
        const data = await response.json();
        const audioPart = data.candidates?.[0]?.content?.parts?.find(p => p.inlineData?.data);
        if (audioPart) {
          const pcmBuffer = Buffer.from(audioPart.inlineData.data, 'base64');
          const wavBuffer = pcmToWav(pcmBuffer, 24000);
          res.setHeader('Content-Type', 'audio/wav');
          res.setHeader('Content-Length', wavBuffer.length);
          res.setHeader('Cache-Control', 'public, max-age=86400');
          return res.status(200).send(wavBuffer);
        }
      }
    } catch (e) {
      console.warn("Gemini 2.0 Audio Warning:", e);
    }
  }

  // Engine 4: Microsoft Edge Uzbek Neural Voice Stream (Zero API Key required, WebSockets, highly stable!)
  try {
    let voiceName = 'uz-UZ-MadinaNeural';
    let rate = 1.0;
    let pitch = '+0Hz';

    if (opId === 'op2') {
      voiceName = 'uz-UZ-SardorNeural'; // Male Uzbek Voice!
      rate = 0.96;
      pitch = '-4Hz';
    } else if (opId === 'op3') {
      voiceName = 'uz-UZ-MadinaNeural';
      rate = 0.94;
      pitch = '-3Hz';
    } else {
      voiceName = 'uz-UZ-MadinaNeural';
      rate = 1.03;
      pitch = '+3Hz';
    }

    const tts = new MsEdgeTTS();
    await tts.setMetadata(voiceName, OUTPUT_FORMAT.AUDIO_24KHZ_96KBITRATE_MONO_MP3);

    const { audioStream } = tts.toStream(cleanText, { rate, pitch });

    const chunks = [];
    await new Promise((resolve, reject) => {
      audioStream.on('data', (chunk) => chunks.push(chunk));
      audioStream.on('end', resolve);
      audioStream.on('error', reject);
    });

    const buffer = Buffer.concat(chunks);
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Content-Length', buffer.length);
    res.setHeader('Cache-Control', 'public, max-age=86400');
    return res.status(200).send(buffer);

  } catch (err) {
    console.warn("Microsoft Neural TTS Warning:", err);
  }

  // Engine 5: Fallback Google Uzbek Audio Stream with sanitized text
  try {
    const safeQuery = encodeURIComponent(cleanText);
    const googleTtsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&q=${safeQuery}&tl=uz&client=tw-ob`;
    const audioRes = await fetch(googleTtsUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
    });

    if (audioRes.ok) {
      const arrayBuffer = await audioRes.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      res.setHeader('Content-Type', 'audio/mpeg');
      res.setHeader('Content-Length', buffer.length);
      return res.status(200).send(buffer);
    } else {
      throw new Error(`Google TTS status: ${audioRes.status}`);
    }
  } catch (error) {
    console.error("TTS Fallback error:", error);
    return res.status(500).json({ error: error.message });
  }
}

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

function escapeXml(unsafe) {
  return unsafe.replace(/[<>&'"]/g, function (c) {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '\'': return '&apos;';
      case '"': return '&quot;';
    }
  });
}
