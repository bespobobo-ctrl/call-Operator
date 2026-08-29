# 📞 O'zbekcha AI Call Center Operator (Google Gemini Voice AI)

Ushbu loyiha **Google AI Studio (Gemini 2.0 Flash)** modeli negizida ishlaydigan va **Vercel** platformasiga moslashtirilgan O'zbekcha AI Call-Center operatori va boshqaruv paneli prototipidir.

---

## 🚀 Xususiyatlari:

* **Jonli O'zbekcha Ovozli Muloqot:** Brauzer mikrofoni orqali real-vaqt rejimida O'zbek tilida AI operator bilan gaplashish.
* **Smart Prompt & Knowledge Base:** Kompaniya nomi, ish vaqti, narxlar va manzil haqida bilimlar bazasini oson sozlash.
* **Transkript va Analitika:** Muloqot stenogrammasi, mijoz kayfiyati (Ijobiy, Neytral, Salbiy) va qo'ng'iroq davomiyligi statistikasi.
* **Human Handoff:** Mijoz inson-operatorni so'rasa, avtomatik ravishda ogohlantirish berish.
* **Vercel-Ready:** Bitta buyruq bilan Vercel-ga bepul joylash imkoniyati.

---

## 🛠️ Mahalliy kompyuterda ishga tushirish (Local Setup):

1. Loyiha papkasiga o'ting:
   ```bash
   cd C:\Users\PRESTIGE\.gemini\antigravity-ide\scratch\ai-call-center
   ```

2. Bog'liqliklarni o'rnating (Install dependencies):
   ```bash
   npm install
   ```

3. Mahalliy serverni ishga tushiring:
   ```bash
   npm run dev
   ```
   Brauzeringiz avtomatik ravishda `http://localhost:3000` manzilida ochiladi.

---

## 🌐 Vercel-ga joylash ko'rsatmasi (Deploy to Vercel):

### 1-usul: Vercel CLI orqali (Tavsiya etiladi)
```bash
npx vercel
```
Vercel barcha sozlamalarni o'zi avtomatik aniqlaydi va sizga tayyor `https://uzbek-ai-callcenter.vercel.app` silkasini beradi!

### 2-usul: GitHub + Vercel Dashboard orqali
1. Ushbu loyihani GitHub omboringizga yuklang (Push).
2. [Vercel Dashboard](https://vercel.com/new) ga kiring va omborni tanlang.
3. **Environment Variables** bo'limida quyidagilarni kiriting:
   * **Key:** `VITE_GEMINI_API_KEY`
   * **Value:** `[Sizning Google AI Studio API kalitingiz]`
4. **Deploy** tugmasini bosing!

---

## 📞 Keyingi bosqich: +998 Telefon Raqamga ulash (Production SIP Trunk):

Haqiqiy O'zbekiston raqamidan (+998 71/90/99...) kelgan qo'ng'iroqlarni AI Operatorga ulash uchun:
1. Uztelecom, Beeline yoki Ucell provayderidan **SIP Trunk** olinadi.
2. Node.js backend serverida `ws` (WebSocket) va Google Gemini Live API audio stream ulagichi ishga tushiriladi.
3. Telemetriya audio oqimi (PCM 16kHz) Gemini bilan real-vaqt rejimida almashinadi.
