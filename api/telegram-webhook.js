// Vercel Serverless Function — 24/7 Telegram Bot Webhook Handler
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const botToken = process.env.TELEGRAM_BOT_TOKEN;

  if (req.method === 'GET') {
    return res.status(200).json({ status: 'active', message: '24/7 Telegram Bot Webhook Backend ishlamoqda' });
  }

  if (req.method === 'POST') {
    try {
      const update = req.body || {};
      const message = update.message;

      if (message && message.text) {
        const chatId = message.chat.id;
        const text = message.text.trim();
        const firstName = message.from.first_name || 'Foydalanuvchi';

        if (text === '/start') {
          const welcomeMsg = `Assalomu alaykum, *${firstName}*! 👋\n\n🏢 *Admiral Group AI Call Center* rasmiy bildirishnoma boti faollashtirildi!\n\n✅ 24/7 rejimda barcha yangi buyurtmalar, mijozlar telefon raqamlari va manzillari ushbu chatga kelib tushadi.\n\nSizning Chat ID'ingiz: \`${chatId}\``;
          
          await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              chat_id: chatId,
              text: welcomeMsg,
              parse_mode: 'Markdown'
            })
          });
        }
      }

      return res.status(200).json({ status: 'ok' });
    } catch (err) {
      console.error("Telegram Webhook Error:", err);
      return res.status(500).json({ error: err.message });
    }
  }
}
