// Vercel Serverless Function — Telegram Bot Order Dispatcher
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

  const { clientName, clientPhone, clientAddress, orderDetails, operatorName, linePhone, telegramToken, telegramChatId } = req.body || {};

  const botToken = telegramToken || process.env.TELEGRAM_BOT_TOKEN || "7849201842:AAH9391039129039120391203912";
  const chatId = telegramChatId || process.env.TELEGRAM_CHAT_ID || "-1001234567890";

  // Build clean Markdown Telegram message
  const now = new Date();
  const timeStr = now.toLocaleString('uz-UZ', { timeZone: 'Asia/Tashkent' });

  const messageText = `🛒 *YANGI BUYURTMA QABUL QILINDI!*
━━━━━━━━━━━━━━━━━━━━━━
👤 *Mijoz Ismi:* ${clientName || 'Kiritilmagan'}
📞 *Telefon:* ${clientPhone || 'Kiritilmagan'}
📍 *Shahar va Manzil:* ${clientAddress || 'Kiritilmagan'}
📦 *Buyurtma Tafsiloti:* ${orderDetails || 'Admiral Group Mahsuloti'}
━━━━━━━━━━━━━━━━━━━━━━
☎️ *Operator:* ${operatorName || 'Malika'} (${linePhone || '+998 71 200-01-01'})
⏰ *Vaqt:* ${timeStr}
🚀 *Manba:* AI Call Center (Admiral Group Official)`;

  try {
    if (!botToken || botToken.includes('YOUR_BOT_TOKEN')) {
      console.log("Simulated Telegram Order Dispatch:\n", messageText);
      return res.status(200).json({ status: 'simulated', message: 'Telegram Token sozlanmagan, buyurtma simulyatsiya qilindi', data: req.body });
    }

    const tgEndpoint = `https://api.telegram.org/bot${botToken}/sendMessage`;
    const response = await fetch(tgEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: messageText,
        parse_mode: 'Markdown'
      })
    });

    const data = await response.json();
    return res.status(200).json({ status: 'success', data });

  } catch (error) {
    console.error("Telegram Dispatch Error:", error);
    return res.status(500).json({ error: error.message || 'Telegram yuborishda xatolik' });
  }
}
