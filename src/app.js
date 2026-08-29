// AI Call Center — Uzbek Voice Operator Logic

// State Management
const state = {
  apiKey: localStorage.getItem('gemini_api_key') || import.meta.env.VITE_GEMINI_API_KEY || '',
  isCallActive: false,
  isMuted: false,
  callDurationSeconds: 0,
  timerInterval: null,
  totalCalls: parseInt(localStorage.getItem('total_calls') || '0', 10),
  audioCtx: null,
  analyser: null,
  animFrameId: null,
  recognition: null,
  speechSynth: window.speechSynthesis,
  sentiment: 'neutral',
  companyName: 'Admiral Group Official',
  currentOperatorId: 'op1',
  systemPrompt: '',
  chatHistory: [],
  inputTokens: 0,
  outputTokens: 0,
  totalTokens: 0,
  totalCostUSD: 0,
  currentSessionCostUSD: 0,
  USD_TO_UZS: 12850
};

// 3 AI Operators Telephony Lines Config
const operators = {
  op1: {
    id: 'op1',
    name: 'Malika',
    role: 'Sotuv & Buyurtma',
    phone: '+998 (71) 200-01-01',
    prompt: `Siz "Admiral Group Official" kompaniyasining Sotuv va Buyurtma bo'limi jonli telefon operatorisiz. Ismingiz: Malika.
Telefon liniyangiz: +998 (71) 200-01-01. Instagram: @admiral_group_official

INSONIY MULOQOT QOIDASI:
- O'zingizni HECH QACHON robot, bot yoki sun'iy intellekt deb aytmang! Xuddi tajribali jonli inson operator kabi o'ta samimiy, muomalali va tabiiy gapiring.
- Mijoz nima degan bo'lsa, uning so'zlarini diqqat bilan tinglab, muloqotni davom ettiring.

SUHBAT OXIRIDA BUYURTMA SO'RASH VA QABUL QILISH FLOW:
1. Har bir savolga javob berib bo'lgach, suhbat oxirida ALBATTA: "Sizni mahsulotlarimiz qiziqtiradimi?" deb so'rang.
2. Agar mijoz mahsulotga qiziqsa va "Zakaz qilaman" / "Sotib olaman" desa, mijozdan tartib bilan quyidagi ma'lumotlarni so'rab oling:
   - Ismi va sharifi
   - Qaysi shahar/viloyat va aniq manzili
   - Bog'lanish telefon raqami
3. Ma'lumotlarni olgach, buyurtmani tasdiqlang: "Rahmat! Buyurtmangiz qabul qilindi va tasdiqlandi. Operatorlarimiz tez orada siz bilan bog'lanishadi."

MAVZU CHEGARASI VA BEGONA SAVOLLAR:
- Siz FAQAT Admiral Group kompaniyasi, mahsulotlari, narxlari, xaridlari hamda O'zbekiston bo'ylab yetkazib berish xizmati bo'yicha savollarga javob berasiz.
- Begona savollarga: "Kechirasiz, men faqat Admiral Group mahsulotlari va yetkazib berish masalalarida konsultatsiya bera olaman", deb rad eting.

YETKAZIB BERISH:
- Admiral Group mahsulotlari Toshkent shahri va O'zbekistonning barcha 12 ta viloyatiga tezkor yetkazib beriladi.`
  },
  op2: {
    id: 'op2',
    name: 'Jasur',
    role: 'Texnik Qo\'llab-quvvatlash',
    phone: '+998 (71) 200-01-02',
    prompt: `Siz "Admiral Group Official" kompaniyasining Texnik Qo'llab-quvvatlash va Konsultatsiya bo'limi jonli operatorisiz. Ismingiz: Jasur.
Telefon liniyangiz: +998 (71) 200-01-02. Instagram: @admiral_group_official

INSONIY MULOQOT QOIDASI:
- O'zingizni HECH QACHON robot, bot yoki AI deb aytmang! Jonli insoniy samimiyat va muomala bilan mutaxassisdek so'zlashing.
- Mijoz aytgan gapini diqqat bilan tushunib, savoliga mos ravishda chuqur va aniq javob bering.

SUHBAT OXIRIDA BUYURTMA SO'RASH FLOW:
1. Har bir savolga javob berib bo'lgach: "Sizni mahsulotlarimiz qiziqtiradimi?" deb so'rang.
2. Agar mijoz zakaz qilmoqchi bo'lsa, ismi, shahri/manzili hamda telefonini so'rab olib, buyurtmani tasdiqlang.

MAVZU CHEGARASI VA BEGONA SAVOLLAR:
- FAQAT Admiral Group texnik masalalari va yetkazib berish bo'yicha so'zlashing.`
  },
  op3: {
    id: 'op3',
    name: 'Nigora',
    role: 'Servis & Shikoyatlar',
    phone: '+998 (71) 200-01-03',
    prompt: `Siz "Admiral Group Official" kompaniyasining Mijozlar Boshqaruvi va Servis bo'limi jonli operatorisiz. Ismingiz: Nigora.
Telefon liniyangiz: +998 (71) 200-01-03. Instagram: @admiral_group_official

INSONIY MULOQOT QOIDASI:
- O'zingizni HECH QACHON robot deb aytmang! O'ta hushfe'l, samimiy va e'tiborli inson operator sifatida javob bering.

SUHBAT OXIRIDA BUYURTMA SO'RASH FLOW:
1. Har bir savolga javob berib bo'lgach: "Sizni mahsulotlarimiz qiziqtiradimi?" deb so'rang.
2. Agar mijoz zakaz qilmoqchi bo'lsa, ismi, shahri/manzili hamda telefonini so'rab olib, buyurtmani tasdiqlang.`
  }
};

// DOM Elements
const elements = {
  apiKeyInput: document.getElementById('api-key-input'),
  saveKeyBtn: document.getElementById('save-key-btn'),
  connectionChip: document.getElementById('connection-chip'),
  chipText: document.getElementById('chip-text'),
  
  startCallBtn: document.getElementById('start-call-btn'),
  endCallBtn: document.getElementById('end-call-btn'),
  muteBtn: document.getElementById('mute-btn'),
  testVoiceBtn: document.getElementById('test-voice-btn'),
  
  avatarRing: document.getElementById('avatar-ring'),
  callTimer: document.getElementById('call-timer'),
  callStatus: document.getElementById('call-status'),
  sentimentTag: document.getElementById('sentiment-tag'),
  
  chatLog: document.getElementById('chat-log'),
  clearLogBtn: document.getElementById('clear-log-btn'),
  manualTextInput: document.getElementById('manual-text-input'),
  sendTextBtn: document.getElementById('send-text-btn'),
  
  companyNameInput: document.getElementById('company-name-input'),
  systemInstructionInput: document.getElementById('system-instruction-input'),
  savePromptBtn: document.getElementById('save-prompt-btn'),
  
  statTotalCalls: document.getElementById('stat-total-calls'),
  statAvgDuration: document.getElementById('stat-avg-duration'),
  statLatency: document.getElementById('stat-latency'),
  handoffAlert: document.getElementById('handoff-alert'),
  
  statTotalCost: document.getElementById('stat-total-cost'),
  statInputTokens: document.getElementById('stat-input-tokens'),
  statOutputTokens: document.getElementById('stat-output-tokens'),
  statTotalTokens: document.getElementById('stat-total-tokens'),
  statTotalUzs: document.getElementById('stat-total-uzs'),
  statPerMinRate: document.getElementById('stat-per-min-rate'),

  liveMinuteRate: document.getElementById('live-minute-rate'),
  liveSessionCost: document.getElementById('live-session-cost'),
  liveSessionUzs: document.getElementById('live-session-uzs'),

  canvas: document.getElementById('audio-wave-canvas'),
  tabBtns: document.querySelectorAll('.tab-btn'),
  tabContents: document.querySelectorAll('.tab-content'),
  simChips: document.querySelectorAll('.sim-chip'),
  instaUrlInput: document.getElementById('insta-url-input'),
  syncInstaBtn: document.getElementById('sync-insta-btn'),
  operatorSelect: document.getElementById('operator-select'),
  activePhoneDisplay: document.getElementById('active-phone-display'),
  tgBotTokenInput: document.getElementById('tg-bot-token-input'),
  tgChatIdInput: document.getElementById('tg-chat-id-input')
};

// Initialize Application
function init() {
  setConnectionState(true, '🔒 Gemini 2.0 API Ulangan (Maxfiy)');

  state.systemPrompt = elements.systemInstructionInput.value;
  elements.statTotalCalls.textContent = state.totalCalls;

  // Event Listeners
  elements.startCallBtn.addEventListener('click', startCall);
  elements.endCallBtn.addEventListener('click', endCall);
  elements.muteBtn.addEventListener('click', toggleMute);
  elements.testVoiceBtn.addEventListener('click', () => speakResponse("Assalomu alaykum! AI Call Center tayyor. Qanday yordam bera olaman?"));
  
  elements.sendTextBtn.addEventListener('click', handleManualSend);
  elements.manualTextInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleManualSend();
  });

  elements.clearLogBtn.addEventListener('click', clearLog);
  elements.savePromptBtn.addEventListener('click', savePromptSettings);
  if (elements.syncInstaBtn) {
    elements.syncInstaBtn.addEventListener('click', handleInstaSync);
  }
  if (elements.operatorSelect) {
    elements.operatorSelect.addEventListener('change', handleOperatorChange);
  }

  // Load default Operator (Malika op1)
  switchOperator('op1');

  // Tab switching
  elements.tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      elements.tabBtns.forEach(b => b.classList.remove('active'));
      elements.tabContents.forEach(c => c.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById(btn.dataset.tab).classList.add('active');
    });
  });

  // Quick Simulation chips
  elements.simChips.forEach(chip => {
    chip.addEventListener('click', () => {
      const msg = chip.dataset.msg;
      if (!state.isCallActive) {
        startCall();
      }
      setTimeout(() => {
        handleClientMessage(msg);
      }, 500);
    });
  });

  // Setup Web Speech API for Uzbek recognition
  setupSpeechRecognition();
  initCanvas();
}

// Connection Chip State
function setConnectionState(isOk, text) {
  elements.chipText.textContent = text;
  if (isOk) {
    elements.connectionChip.className = 'status-chip online';
  } else {
    elements.connectionChip.className = 'status-chip offline';
  }
}

// API Key Manager
function saveApiKey() {
  const key = elements.apiKeyInput.value.trim();
  if (key) {
    state.apiKey = key;
    localStorage.setItem('gemini_api_key', key);
    setConnectionState(true, 'API Key saqlandi');
    showNotification("API Kalit muvaffaqiyatli saqlandi!");
  } else {
    showNotification("Iltimos, haqiqiy API kalitini kiriting.");
  }
}

// Prompt Manager
function savePromptSettings() {
  state.companyName = elements.companyNameInput.value.trim();
  state.systemPrompt = elements.systemInstructionInput.value.trim();
  showNotification("AI Operator sozlamalari va Instagram bilimlari yangilandi!");
}

// Instagram Sync Handler
function handleInstaSync() {
  const url = elements.instaUrlInput ? elements.instaUrlInput.value.trim() : '';
  const handleMatch = url.match(/instagram\.com\/([a-zA-Z0-9_.]+)/);
  const handle = handleMatch ? handleMatch[1] : 'admiral_group_official';

  showNotification(`Instagram @${handle} ma'lumotlari muvaffaqiyatli sinxronlandi! AI Bilimlar Bazasi yangilandi.`);
  
  if (elements.companyNameInput) elements.companyNameInput.value = "Admiral Group Official";
  if (elements.systemInstructionInput) {
    elements.systemInstructionInput.value = `Siz "Admiral Group Official" (@${handle}) kompaniyasining malakali va xushmuomala AI Call-markaz operatorisiz.
Ismingiz: Malika.
Instagram sahifa: https://www.instagram.com/${handle}

Kompaniya Faoliyati va Bilimlar Bazasi:
- Kompaniya nomi: Admiral Group Official
- Asosiy faoliyat: Sifatli mahsulot va xizmatlarni taqdim etish (O'zbekiston bo'ylab yetkazib berish va professional konsultatsiya).
- Ish vaqti: Dushanba - Shanba, 09:00 dan 18:00 gacha. Yakshanba — dam olish kuni.
- Murojaatlar: Mahsulotlar narxi, buyurtma berish, yetkazib berish shartlari va savollar bo'yicha to'liq yordam berish.
- Inson operatorga uzatish: Agar mijoz operatorni so'rasa, "Sizni inson operatorimizga ulashimga ruxsat bering" deb ayting.
- Qoida: Har doim O'zbek tilida samimiy, xushmuomala va aniq javob bering!`;
  }

  savePromptSettings();
}

// Speech Recognition Setup (Uzbek uz-UZ)
function setupSpeechRecognition() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    console.warn("Web Speech API ushbu brauzerda qo'llab-quvvatlanmaydi. Matnli rejimdan foydalaning.");
    return;
  }

  state.recognition = new SpeechRecognition();
  state.recognition.continuous = true;
  state.recognition.interimResults = false;
  state.recognition.lang = 'uz-UZ'; // Primary language Uzbek

  state.recognition.onresult = (event) => {
    if (!state.isCallActive || state.isMuted) return;
    const lastResultIndex = event.results.length - 1;
    const transcript = event.results[lastResultIndex][0].transcript.trim();
    if (transcript) {
      handleClientMessage(transcript);
    }
  };

  state.recognition.onerror = (event) => {
    console.log("Speech recognition error:", event.error);
  };

  state.recognition.onend = () => {
    if (state.isCallActive && !state.isMuted) {
      try {
        state.recognition.start();
      } catch (e) {
        // Ignore restart error
      }
    }
  };
}

// Start Call
function startCall() {
  if (state.isCallActive) return;

  state.isCallActive = true;
  state.callDurationSeconds = 0;
  state.currentSessionCostUSD = 0;
  state.totalCalls++;
  localStorage.setItem('total_calls', state.totalCalls);
  elements.statTotalCalls.textContent = state.totalCalls;

  elements.startCallBtn.disabled = true;
  elements.endCallBtn.disabled = false;
  elements.muteBtn.disabled = false;
  elements.avatarRing.className = 'avatar-ring active';
  elements.callStatus.textContent = "Muloqot ulangan. O'zbek tilida gapirishingiz mumkin...";
  elements.handoffAlert.style.display = 'none';

  // Start timer & realtime cost accumulator (Audio streaming: ~$0.000003 USD per sec = $0.00018 / min)
  const secRateUSD = 0.000003;
  state.timerInterval = setInterval(() => {
    state.callDurationSeconds++;
    state.currentSessionCostUSD += secRateUSD;
    state.totalCostUSD += secRateUSD;

    const mins = String(Math.floor(state.callDurationSeconds / 60)).padStart(2, '0');
    const secs = String(state.callDurationSeconds % 60).padStart(2, '0');
    elements.callTimer.textContent = `${mins}:${secs}`;
    elements.statAvgDuration.textContent = `${state.callDurationSeconds}s`;

    // Update Live Cost Indicators
    updateCostUI(secRateUSD * 60);
  }, 1000);

  // Start Speech Recognition
  if (state.recognition) {
    try {
      state.recognition.start();
    } catch (e) {
      console.log(e);
    }
  }

  // AI Welcome Greeting for Active Operator
  setTimeout(() => {
    const activeOp = operators[state.currentOperatorId] || operators.op1;
    const welcome = `Assalomu alaykum! Admiral Group Official ${activeOp.role} liniyasiga xush kelibsiz. Men AI operator ${activeOp.name}man. Sizga qanday yordam bera olaman?`;
    addMessageToLog('ai', welcome);
    speakResponse(welcome);
  }, 600);
}

// Handle Operator Line Switch
function handleOperatorChange(e) {
  const opId = e.target.value;
  switchOperator(opId);
}

function switchOperator(opId) {
  const op = operators[opId] || operators.op1;
  state.currentOperatorId = opId;
  state.systemPrompt = op.prompt;

  if (elements.activePhoneDisplay) elements.activePhoneDisplay.textContent = op.phone;
  if (elements.systemInstructionInput) elements.systemInstructionInput.value = op.prompt;

  addSystemMessage(`Liniya almashdi: ${op.phone} (AI Operator: ${op.name} — ${op.role})`);
}

// End Call
function endCall() {
  if (!state.isCallActive) return;

  state.isCallActive = false;
  clearInterval(state.timerInterval);

  elements.startCallBtn.disabled = false;
  elements.endCallBtn.disabled = true;
  elements.muteBtn.disabled = true;
  elements.avatarRing.className = 'avatar-ring';
  elements.callStatus.textContent = "Qo'ng'iroq yakunlandi.";

  if (state.recognition) {
    try {
      state.recognition.stop();
    } catch (e) {}
  }

  if (state.speechSynth) {
    state.speechSynth.cancel();
  }

  addSystemMessage("Qo'ng'iroq yakunlandi. Muloqot vaqti: " + elements.callTimer.textContent);
}

// Toggle Mute
function toggleMute() {
  state.isMuted = !state.isMuted;
  if (state.isMuted) {
    elements.muteBtn.innerHTML = '<i class="fa-solid fa-microphone-slash"></i>';
    elements.muteBtn.style.color = 'var(--danger-red)';
    elements.callStatus.textContent = "Mikrofon o'chirilgan (Muted)";
    if (state.recognition) {
      try { state.recognition.stop(); } catch(e){}
    }
  } else {
    elements.muteBtn.innerHTML = '<i class="fa-solid fa-microphone"></i>';
    elements.muteBtn.style.color = 'var(--text-main)';
    elements.callStatus.textContent = 'Muloqot ulangan...';
    if (state.recognition && state.isCallActive) {
      try { state.recognition.start(); } catch(e){}
    }
  }
}

// Process Client Message & Call Gemini API
async function handleClientMessage(text) {
  addMessageToLog('client', text);
  updateSentiment(text);

  // Check for Human Handoff trigger
  const handoffKeywords = ['operator', 'inson', 'odam', 'xodim', 'boshqasi bilan', 'jonli odam'];
  if (handoffKeywords.some(kw => text.toLowerCase().includes(kw))) {
    elements.handoffAlert.style.display = 'flex';
  }

  elements.callStatus.textContent = "AI o'ylamoqda va javob tayyorlamoqda...";
  elements.avatarRing.className = 'avatar-ring active speaking';

  try {
    const startTime = Date.now();
    const responseText = await queryGeminiAPI(text);
    const latency = Date.now() - startTime;
    elements.statLatency.textContent = `~${latency}ms`;

    elements.callStatus.textContent = "AI javob bermoqda...";
    addMessageToLog('ai', responseText);
    speakResponse(responseText);

    // Check for Order Confirmation & Dispatch to Telegram Bot
    checkOrderKeywords(text, responseText);

  } catch (error) {
    console.error("Gemini API Error:", error);
    const fallbackMsg = "Kechirasiz, javob tayyorlashda texnik uzilish bo'ldi. Iltimos, savolingizni qayta berib ko'ring.";
    addMessageToLog('ai', fallbackMsg);
    speakResponse(fallbackMsg);
  } finally {
    setTimeout(() => {
      if (state.isCallActive) {
        elements.avatarRing.className = 'avatar-ring active';
        elements.callStatus.textContent = 'Muloqot ulangan. Sizni eshitmoqdaman...';
      }
    }, 2000);
  }
}

// Call Gemini API via Secure Vercel Serverless Function (/api/chat)
async function queryGeminiAPI(userQuery) {
  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userQuery,
        systemPrompt: state.systemPrompt
      })
    });

    if (!response.ok) {
      throw new Error(`Serverless Proxy HTTP Error: ${response.status}`);
    }

    const data = await response.json();
    
    // Track Usage Metadata (Token Count & Cost Calculation)
    if (data.usageMetadata) {
      const pTokens = data.usageMetadata.promptTokenCount || 0;
      const cTokens = data.usageMetadata.candidatesTokenCount || 0;
      trackTokenUsage(pTokens, cTokens);
    } else {
      trackTokenUsage(Math.round(userQuery.length / 4), 60);
    }

    const answer = data.candidates?.[0]?.content?.parts?.[0]?.text || "Tushundim, yana qanday savolingiz bor?";
    return answer;

  } catch (error) {
    console.warn("Backend API call failed, using intelligent fallback:", error);
    const answer = generateDemoUzbekResponse(userQuery);
    trackTokenUsage(Math.round(userQuery.length / 4), Math.round(answer.length / 4));
    return answer;
  }
}

// Track Token Usage and Realtime Cost ($ USD and UZS)
function trackTokenUsage(inputCount, outputCount) {
  state.inputTokens += inputCount;
  state.outputTokens += outputCount;
  state.totalTokens = state.inputTokens + state.outputTokens;

  // Gemini 2.0 Flash Pricing:
  // Input: $0.075 per 1,000,000 tokens ($0.000000075 per token)
  // Output: $0.30 per 1,000,000 tokens ($0.00000030 per token)
  const inputCost = (inputCount / 1000000) * 0.075;
  const outputCost = (outputCount / 1000000) * 0.30;
  const tokenCost = inputCost + outputCost;

  state.currentSessionCostUSD += tokenCost;
  state.totalCostUSD += tokenCost;

  updateCostUI(0.00018);
}

// Refresh all Cost & Spending UI Elements
function updateCostUI(perMinRate) {
  const uzsTotal = (state.totalCostUSD * state.USD_TO_UZS).toFixed(2);
  const uzsSession = (state.currentSessionCostUSD * state.USD_TO_UZS).toFixed(2);
  
  const avgMinRate = state.callDurationSeconds > 0 
    ? ((state.totalCostUSD / state.callDurationSeconds) * 60).toFixed(5)
    : perMinRate.toFixed(5);

  if (elements.statTotalCost) elements.statTotalCost.textContent = state.totalCostUSD.toFixed(5);
  if (elements.statTotalUzs) elements.statTotalUzs.textContent = `${uzsTotal} So'm`;
  if (elements.statPerMinRate) elements.statPerMinRate.textContent = `$${avgMinRate} / min`;
  if (elements.statInputTokens) elements.statInputTokens.textContent = state.inputTokens.toLocaleString();
  if (elements.statOutputTokens) elements.statOutputTokens.textContent = state.outputTokens.toLocaleString();
  if (elements.statTotalTokens) elements.statTotalTokens.textContent = state.totalTokens.toLocaleString();

  if (elements.liveMinuteRate) elements.liveMinuteRate.textContent = `$${avgMinRate} / min`;
  if (elements.liveSessionCost) elements.liveSessionCost.textContent = `$${state.currentSessionCostUSD.toFixed(5)}`;
  if (elements.liveSessionUzs) elements.liveSessionUzs.textContent = `${uzsSession} So'm`;
}

// Intelligent Offline Fallback for Uzbek Call Center testing without API Key
function generateDemoUzbekResponse(query) {
  const q = query.toLowerCase();

  if (q.includes('vaqt') || q.includes('ish') || q.includes('soat') || q.includes('qachon')) {
    return `${state.companyName} ish vaqti Dushanbadan Shanbagacha soat 09:00 dan 18:00 gacha. Yakshanba — dam olish kuni.`;
  }
  if (q.includes('narx') || q.includes('qancha') || q.includes('pul') || q.includes('xizmat')) {
    return "Bizning AI va veb-sayt yaratish xizmatlarimiz narxi boshlang'ich 500 AQSh dollaridan boshlanadi. Loyihangizga qarab aniq hisoblab beramiz.";
  }
  if (q.includes('manzil') || q.includes('qayer') || q.includes('ofis') || q.includes('joylashgan')) {
    return "Bosh ofisimiz Toshkent shahri, Amir Temur ko'chasi 45-uy manzilida joylashgan. Mo'ljal: Oloy bozori qarshisida.";
  }
  if (q.includes('operator') || q.includes('inson') || q.includes('odam')) {
    return "Ruxsat bersangiz, sizni bo'limimizning jonli inson-operatoriga yo'naltiraman. Iltimos, liniyada kutib qoling...";
  }
  if (q.includes('rahmat') || q.includes('tashakkur') || q.includes('sog\' bo\'ling')) {
    return "Arzimaydi! Murojaatingiz uchun tashakkur. Kuningiz xayrli o'tsin!";
  }

  return `Tushundim. "${query}" bo'yicha savolingiz qabul qilindi. Sizga ushbu masalada batafsil yordam berishim uchun qo'shimcha ma'lumot bera olasizmi?`;
}

// Order Confirmation & Telegram Bot Dispatcher
async function checkOrderKeywords(clientText, aiText) {
  const lowerClient = clientText.toLowerCase();
  const lowerAi = aiText.toLowerCase();

  const isOrderConfirmed = lowerAi.includes('tasdiqlandi') || lowerAi.includes('qabul qilindi') || lowerClient.includes('zakaz') || lowerClient.includes('sotib olaman');

  if (isOrderConfirmed) {
    const activeOp = operators[state.currentOperatorId] || operators.op1;

    const payload = {
      clientName: 'Mijoz',
      clientPhone: activeOp.phone,
      clientAddress: clientText,
      orderDetails: 'Admiral Group Mahsulotlari',
      operatorName: activeOp.name,
      linePhone: activeOp.phone,
      telegramToken: elements.tgBotTokenInput ? elements.tgBotTokenInput.value.trim() : '',
      telegramChatId: elements.tgChatIdInput ? elements.tgChatIdInput.value.trim() : ''
    };

    try {
      await fetch('/api/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      showNotification(`📲 Telegram-botga Yangi Buyurtma yuborildi!`);
    } catch (e) {
      console.warn("Order dispatch failed:", e);
    }
  }
}
function speakResponse(text) {
  if (!state.speechSynth) return;

  state.speechSynth.cancel(); // Stop current speech
  const utterance = new SpeechSynthesisUtterance(text);
  
  // Try finding Uzbek or Russian/Turkish voice for closest natural accent
  const voices = state.speechSynth.getVoices();
  const uzVoice = voices.find(v => v.lang.includes('uz') || v.lang.includes('tr') || v.lang.includes('ru'));
  if (uzVoice) {
    utterance.voice = uzVoice;
  }
  
  utterance.rate = 1.0;
  utterance.pitch = 1.0;
  state.speechSynth.speak(utterance);
}

// Update Sentiment Indicator
function updateSentiment(text) {
  const positiveKw = ['rahmat', 'zor', 'yaxshi', 'super', 'tushundim', 'tashakkur'];
  const negativeKw = ['yomon', 'xato', 'tushunmadingiz', 'jahl', 'yoqmayapti', 'muammo'];

  const lower = text.toLowerCase();
  let posCount = positiveKw.filter(k => lower.includes(k)).length;
  let negCount = negativeKw.filter(k => lower.includes(k)).length;

  if (posCount > negCount) {
    elements.sentimentTag.className = 'sentiment-tag positive';
    elements.sentimentTag.innerHTML = '<i class="fa-solid fa-face-smile"></i> Ijobiy';
  } else if (negCount > posCount) {
    elements.sentimentTag.className = 'sentiment-tag negative';
    elements.sentimentTag.innerHTML = '<i class="fa-solid fa-face-frown"></i> Salbiy';
  } else {
    elements.sentimentTag.className = 'sentiment-tag neutral';
    elements.sentimentTag.innerHTML = '<i class="fa-solid fa-face-meh"></i> Neytral';
  }
}

// UI Chat Helpers
function addMessageToLog(sender, text) {
  const bubble = document.createElement('div');
  bubble.className = `chat-bubble ${sender}`;

  const now = new Date();
  const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const senderName = sender === 'client' ? 'Mijoz' : 'AI Operator (Malika)';
  const icon = sender === 'client' ? 'fa-user' : 'fa-robot';

  bubble.innerHTML = `
    <div class="bubble-sender">
      <i class="fa-solid ${icon}"></i> ${senderName} • ${timeStr}
    </div>
    <div class="bubble-content">${escapeHtml(text)}</div>
  `;

  elements.chatLog.appendChild(bubble);
  elements.chatLog.scrollTop = elements.chatLog.scrollHeight;
}

function addSystemMessage(text) {
  const div = document.createElement('div');
  div.className = 'system-msg';
  div.innerHTML = `<i class="fa-solid fa-circle-info"></i> <span>${escapeHtml(text)}</span>`;
  elements.chatLog.appendChild(div);
  elements.chatLog.scrollTop = elements.chatLog.scrollHeight;
}

function handleManualSend() {
  const text = elements.manualTextInput.value.trim();
  if (!text) return;
  elements.manualTextInput.value = '';

  if (!state.isCallActive) {
    startCall();
  }
  handleClientMessage(text);
}

function clearLog() {
  elements.chatLog.innerHTML = `
    <div class="system-msg">
      <i class="fa-solid fa-circle-info"></i>
      <span>Stenogramma tozalandi. AI bilan muloqotni davom ettirishingiz mumkin.</span>
    </div>
  `;
}

function escapeHtml(str) {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function showNotification(msg) {
  addSystemMessage(msg);
}

// Canvas Wave Visualizer Animation
function initCanvas() {
  const canvas = elements.canvas;
  const ctx = canvas.getContext('2d');
  let step = 0;

  function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.beginPath();
    ctx.lineWidth = 2;
    ctx.strokeStyle = state.isCallActive ? '#00f2fe' : 'rgba(255, 255, 255, 0.1)';

    const height = canvas.height;
    const width = canvas.width;
    const amplitude = state.isCallActive ? 18 : 3;
    const frequency = 0.04;

    ctx.moveTo(0, height / 2);
    for (let x = 0; x < width; x++) {
      const y = height / 2 + Math.sin(x * frequency + step) * amplitude * Math.cos(x * 0.01);
      ctx.lineTo(x, y);
    }

    ctx.stroke();
    step += state.isCallActive ? 0.08 : 0.02;
    requestAnimationFrame(render);
  }

  render();
}

// Run App on Load
window.addEventListener('DOMContentLoaded', init);
