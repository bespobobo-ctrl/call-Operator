// Vercel Serverless Function — Secure Gemini API Proxy
export default async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Get secret API key from server environment (never exposed to client browser)
  const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;

  const { userQuery, systemPrompt } = req.body || {};

  if (!userQuery) {
    return res.status(400).json({ error: 'userQuery kiritilmagan' });
  }

  try {
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

    const contents = [
      {
        role: 'user',
        parts: [{ text: `System Instruction:\n${systemPrompt || ''}\n\nMijoz savoli: ${userQuery}` }]
      }
    ];

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents })
    });

    if (!response.ok) {
      const errText = await response.text();
      return res.status(response.status).json({ error: errText });
    }

    const data = await response.json();
    return res.status(200).json(data);

  } catch (error) {
    console.error("Serverless Gemini Proxy Error:", error);
    return res.status(500).json({ error: error.message || 'Server xatoligi' });
  }
}
