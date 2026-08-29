// Vercel Serverless Function — High-Definition Uzbek Neural Voice TTS Proxy
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

  try {
    // Clean text for optimal speech synthesis
    const cleanText = text
      .replace(/\*\*([^*]+)\*\*/g, '$1')
      .replace(/\*([^*]+)\*/g, '$1')
      .replace(/#+/g, '')
      .replace(/https?:\/\/\S+/g, '')
      .replace(/[\n\r]+/g, '. ')
      .replace(/\s+/g, ' ')
      .trim();

    // Fetch Native Uzbek HD Audio Stream from Google Speech Engine with server-side User-Agent
    const googleTtsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(cleanText)}&tl=uz&client=tw-ob`;

    const audioRes = await fetch(googleTtsUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Referer': 'https://translate.google.com/'
      }
    });

    if (!audioRes.ok) {
      throw new Error(`Google TTS API returned status ${audioRes.status}`);
    }

    const arrayBuffer = await audioRes.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Content-Length', buffer.length);
    res.setHeader('Cache-Control', 'public, max-age=86400');
    return res.status(200).send(buffer);

  } catch (error) {
    console.error("TTS Generation error:", error);
    return res.status(500).json({ error: error.message });
  }
}
