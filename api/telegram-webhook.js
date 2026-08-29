// Vercel Serverless Function — 24/7 Telegram Bot Webhook & Password Auth Handler
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admiral4044";

// Memory cache for authenticated admin chat IDs
const authenticatedChats = new Set();

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const botToken = process.env.TELEGRAM_BOT_TOKEN;

  if (req.method === 'GET') {
    return res.status(200).json({ status: 'active', message: '24/7 Protected Telegram Bot Webhook Backend active' });
  }

  if (req.method === 'POST') {
    try {
      const update = req.body || {};
      const message = update.message;

      if (message && message.text) {
        const chatId = message.chat.id;
        const text = message.text.trim();
        const firstName = message.from.first_name || 'Foydalanuvchi';

        // Check if user is entering the secret password
        if (text === ADMIN_PASSWORD) {
          authenticatedChats.add(chatId);

          const successMsg = `✅ *MAXFIY KOD TO'G'RI!*

Assalomu alaykum, *${firstName}*! 👋
Siz Admiral Group AI Call Center admin botiga muvaffaqiyatli avtorizatsiyadan o'tdingiz.

🔒 *Xavfsizlik statusi:* Ruxsat berildi
⚡ *24/7 Status:* Faol
📦 Endi barcha yangi buyurtmalar ushbu chatga kelib tushadi!`;

          await sendTelegramMessage(botToken, chatId, successMsg);
          return res.status(200).json({ status: 'authenticated' });
        }

        // Command /start or any unauthenticated message
        if (!authenticatedChats.has(chatId)) {
          const authPromptMsg = `🔒 *DIQQAT: MAXFIY BOT!*

Assalomu alaykum, *${firstName}*!
Ushbu bot *Admiral Group Official* AI Call Center administratorlari uchun maxfiy hisoblanadi.

🔑 Botdan foydalanish va buyurtmalarni qabul qilish uchun iltimos *Maxfiy Parol (Password)*ni yozib yuboring:`;

          await sendTelegramMessage(botToken, chatId, authPromptMsg);
          return res.status(200).json({ status: 'auth_required' });
        }

        // Authenticated user options
        if (text === '/status') {
          await sendTelegramMessage(botToken, chatId, `📊 *TIZIM STATUSI:*\n\n✅ AI Call Center 24/7 Faol\n✅ 3 ta Operator Ulangan (Malika, Jasur, Nigora)\n🔐 Parol Xavfsizligi: Faol`);
        }
      }

      return res.status(200).json({ status: 'ok' });
    } catch (err) {
      console.error("Telegram Webhook Auth Error:", err);
      return res.status(500).json({ error: err.message });
    }
  }
}

async function sendTelegramMessage(botToken, chatId, text) {
  if (!botToken) return;
  await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: 'Markdown'
    })
  });
}
