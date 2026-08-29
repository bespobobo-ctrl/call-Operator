// Vercel Serverless Function — High-Definition Uzbek Neural Voice Generator (Azure / Edge Neural Engine)
export default async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const text = req.method === 'POST' ? req.body?.text : req.query?.text;
  const opId = (req.method === 'POST' ? req.body?.opId : req.query?.opId) || 'op1';

  if (!text) {
    return res.status(400).json({ error: 'Text parameter is required' });
  }

  // Clean text for optimal speech synthesis
  const cleanText = text
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/#+/g, '')
    .replace(/https?:\/\/\S+/g, '')
    .replace(/[\n\r]+/g, '. ')
    .replace(/\s+/g, ' ')
    .trim();

  // Microsoft Uzbek Neural Voice Profiles:
  // op1 (Malika) -> uz-UZ-MadinaNeural (Female Uzbek Neural)
  // op2 (Jasur)  -> uz-UZ-SardorNeural (Male Uzbek Neural Voice!)
  // op3 (Nigora) -> uz-UZ-MadinaNeural (Soft Female Uzbek Neural)
  let voiceName = 'uz-UZ-MadinaNeural';
  let rate = '+0%';
  let pitch = '+0Hz';

  if (opId === 'op2') {
    voiceName = 'uz-UZ-SardorNeural'; // Male Uzbek Neural Voice!
    rate = '-3%';
    pitch = '-2Hz';
  } else if (opId === 'op3') {
    voiceName = 'uz-UZ-MadinaNeural';
    rate = '-6%';
    pitch = '-4Hz';
  } else {
    voiceName = 'uz-UZ-MadinaNeural';
    rate = '+2%';
    pitch = '+2Hz';
  }

  try {
    // Generate Uzbek Neural Audio via Edge Speech Endpoint
    const ssml = `<speak version='1.0' xmlns='http://www.w3.org/2001/10/synthesis' xml:lang='uz-UZ'>
      <voice name='${voiceName}'>
        <prosody rate='${rate}' pitch='${pitch}'>
          ${escapeXml(cleanText)}
        </prosody>
      </voice>
    </speak>`;

    const ttsUrl = `https://speech.platform.bing.com/consumer/speech/synthesize/readaloud/single/tts?api-key=6A5AA1D4EA6349499216C73808555020`;

    const audioRes = await fetch(ttsUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/ssml+xml',
        'X-Microsoft-OutputFormat': 'audio-24khz-96kbitrate-mono-mp3',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36 Edge/122.0.0.0'
      },
      body: ssml
    });

    if (audioRes.ok) {
      const arrayBuffer = await audioRes.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      res.setHeader('Content-Type', 'audio/mpeg');
      res.setHeader('Content-Length', buffer.length);
      res.setHeader('Cache-Control', 'public, max-age=86400');
      return res.status(200).send(buffer);
    }
  } catch (err) {
    console.warn("Edge Uzbek Neural TTS failed, using fallback:", err);
  }

  // Fallback Google Uzbek Audio
  try {
    const googleTtsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(cleanText)}&tl=uz&client=tw-ob`;
    const audioRes = await fetch(googleTtsUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    const arrayBuffer = await audioRes.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Content-Length', buffer.length);
    return res.status(200).send(buffer);
  } catch (error) {
    console.error("TTS Fallback error:", error);
    return res.status(500).json({ error: error.message });
  }
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
