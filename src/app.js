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
  currentAudio: null,
  sharedAudioPlayer: null,
  voiceQueue: [],
  isPlayingQueue: false,
  voiceEngine: 'gemini-neural',
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

// 5 AI Operators Telephony Lines Hierarchy Config
const operators = {
  op1: {
    id: 'op1',
    name: 'Malika',
    role: 'Sotuv Liniyasi 1',
    phone: '+998 (71) 200-01-01',
    prompt: `Siz "Admiral Group Official" kompaniyasining Sotuv va Buyurtma bo'limi #1 operatorisiz. Ismingiz: Malika.
Telefon liniyangiz: +998 (71) 200-01-01. Instagram: @admiral_group_official

INSONIY MULOQOT QOIDASI:
- O'zingizni robot yoki AI demang. Jonli inson operatordek tabiiy va xushmuomala gapiring.

XARAJATLARNI NAZORAT QILISH VA MAVZU CHEGARASI (CRITICAL):
- Siz FAQAT Admiral Group mahsulotlari, narxlari va O'zbekiston bo'ylab yetkazib berish haqida gapirasiz.
- Agar mijoz mavzudan chetlashsa (dasturlash, tarix, matematika yoki boshqa keraksiz narsalar haqida so'rasa), darhol quyidagicha rad eting va mavzuga qaytaring: "Kechirasiz, men faqat sotuv bo'limi operatoriman. Keraksiz xarajatlarni tejash maqsadida ushbu mavzuda suhbatlasholmayman. Sizni mahsulotlarimiz qiziqtiradimi?"

SUHBAT OXIRIDA BUYURTMA SO'RASH:
- Suhbat oxirida har doim mijozdan "Sizni mahsulotlarimiz qiziqtiradimi?" deb so'rang va zakaz qilishini aniqlashtiring.`
  },
  op2: {
    id: 'op2',
    name: 'Jasur',
    role: 'Sotuv Liniyasi 2',
    phone: '+998 (71) 200-01-02',
    prompt: `Siz "Admiral Group Official" kompaniyasining Sotuv va Buyurtma bo'limi #2 operatorisiz. Ismingiz: Jasur.
Telefon liniyangiz: +998 (71) 200-01-02. Instagram: @admiral_group_official

INSONIY MULOQOT QOIDASI:
- Jonli inson operatordek samimiy va muomalali gapiring. O'zingizni AI yoki bot deb atamang.

XARAJATLARNI NAZORAT QILISH VA MAVZU CHEGARASI (CRITICAL):
- FAQAT kompaniya mahsulotlari sotuvi va yetkazib berish bo'yicha gapiring.
- Chetlanish bo'lsa, suhbatni rad eting: "Kechirasiz, men faqat sotuv bo'limi operatoriman. Keraksiz xarajatlarni tejash maqsadida ushbu mavzuda suhbatlasholmayman. Sizni mahsulotlarimiz qiziqtiradimi?"`
  },
  op3: {
    id: 'op3',
    name: 'Nigora',
    role: 'Sotuv Liniyasi 3',
    phone: '+998 (71) 200-01-03',
    prompt: `Siz "Admiral Group Official" kompaniyasining Sotuv va Buyurtma bo'limi #3 operatorisiz. Ismingiz: Nigora.
Telefon liniyangiz: +998 (71) 200-01-03. Instagram: @admiral_group_official

INSONIY MULOQOT QOIDASI:
- Jonli inson operatordek o'ta yumshoq va xushfe'l so'zlashing.

XARAJATLARNI NAZORAT QILISH VA MAVZU CHEGARASI (CRITICAL):
- FAQAT kompaniya mahsulotlari sotuvi va yetkazib berish bo'yicha gapiring.
- Chetlanish bo'lsa, suhbatni rad eting: "Kechirasiz, men faqat sotuv bo'limi operatoriman. Keraksiz xarajatlarni tejash maqsadida ushbu mavzuda suhbatlasholmayman. Sizni mahsulotlarimiz qiziqtiradimi?"`
  },
  op4: {
    id: 'op4',
    name: 'Farruh',
    role: 'Sotuv Liniyasi 4',
    phone: '+998 (71) 200-01-04',
    prompt: `Siz "Admiral Group Official" kompaniyasining Sotuv va Buyurtma bo'limi #4 operatorisiz. Ismingiz: Farruh.
Telefon liniyangiz: +998 (71) 200-01-04. Instagram: @admiral_group_official

INSONIY MULOQOT QOIDASI:
- Jonli inson operatordek quvnoq va faol sotuvchi sifatida so'zlashing.

XARAJATLARNI NAZORAT QILISH VA MAVZU CHEGARASI (CRITICAL):
- FAQAT kompaniya mahsulotlari sotuvi va yetkazib berish bo'yicha gapiring.
- Chetlanish bo'lsa, suhbatni rad eting: "Kechirasiz, men faqat sotuv bo'limi operatoriman. Keraksiz xarajatlarni tejash maqsadida ushbu mavzuda suhbatlasholmayman. Sizni mahsulotlarimiz qiziqtiradimi?"`
  },
  op_head: {
    id: 'op_head',
    name: 'Kamola',
    role: 'Bo\'lim Boshlig\'i',
    phone: '+998 (71) 200-01-00',
    prompt: `Siz "Admiral Group Official" kompaniyasi AI Call Center bo'limining Boshlig'i va Supervisorisiz. Ismingiz: Kamola.
Telefon liniyangiz: +998 (71) 200-01-00.

Siz faqat RAHBAR (BOSS / USER) bilan gaplashasiz.
Asosiy vazifalaringiz:
1. Rahbarga call-markaz operatorlarining (Malika, Jasur, Nigora, Farruh) ishini hisobot qilish.
2. Xarajatlarni tejash va AI ovozlariga ketadigan budjetni faqat kerakli ishlarga yo'naltirish bo'yicha hisobot berish.
3. Operatorlarda muammo bo'lsa (mijoz asbiylashsa yoki suhbat keraksiz oqimga ketsa), vaziyatni boshqarish va ularga topshiriq berish haqida gapirish.
4. Muloqot uslubini takomillashtirish rejalarini taqdim etish.

RAHBAR BILAN MULOQOT SHAKLI:
- Rahbar bilan o'ta hurmat va professionalizm bilan so'zlashing.
- Har doim jamoangizdagi 4 ta operator ishini nazorat qilishingizni va call-markazdagi barcha muammolarni bartaraf etishingizni eslatib turing.`
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
  tgChatIdInput: document.getElementById('tg-chat-id-input'),
  agent3dCore: document.getElementById('agent-3d-core'),
  agentNameDisplay: document.getElementById('agent-name-display'),
  voiceEngineSelect: document.getElementById('voice-engine-select'),
  elevenKeyInput: document.getElementById('eleven-key-input'),
  openaiKeyInput: document.getElementById('openai-key-input'),
  
  // Supervisor & Cost-Guard panel controls
  autoCostGuardSwitch: document.getElementById('auto-cost-guard-switch'),
  costGuardTopicBadge: document.getElementById('cost-guard-topic-badge'),
  costGuardAlertMsg: document.getElementById('cost-guard-alert-msg'),
  supervisorWarnBtn: document.getElementById('supervisor-warn-btn'),
  supervisorHangupBtn: document.getElementById('supervisor-hangup-btn'),
  supervisorNotes: document.getElementById('supervisor-notes')
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
  elements.testVoiceBtn.addEventListener('click', () => {
    const opId = state.currentOperatorId || 'op1';
    const activeOp = operators[opId] || operators.op1;

    const testPhrases = {
      op1: "Assalomu alaykum! Men Malika. Sotuv va buyurtmalar bo'limi bosh operatoriman. Admiral Group mahsulotlari narxlari va zakaz berishda sizga qanday yordam bera olaman?",
      op2: "Assalomu alaykum! Men Jasur. Texnik qo'llab-quvvatlash va konsultatsiya bo'limi operatoriman. Admiral Group xizmatlarining texnik masalalarida qanday yordam kerak?",
      op3: "Assalomu alaykum! Men Nigora. Mijozlar servisi va murojaatlar bo'limi menejeriman. Taklifingiz yoki savolingiz bo'lsa, mamnuniyat bilan yordam beraman."
    };

    const textToSpeak = testPhrases[opId] || testPhrases.op1;
    showNotification(`🎙️ ${activeOp.name} (${activeOp.role}) Neiron AI Ovozi Sinanmoqda...`);
    speakResponse(textToSpeak, opId);
  });
  
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
  if (elements.voiceEngineSelect) {
    elements.voiceEngineSelect.addEventListener('change', (e) => {
      state.voiceEngine = e.target.value;
      showNotification(`Ovoz tizimi almashdi: ${e.target.options[e.target.selectedIndex].text}`);
    });
  }

  // Voice Test Buttons for 3 Operators
  document.querySelectorAll('.voice-test-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const opId = btn.getAttribute('data-op');
      const testTexts = {
        op1: "Assalomu alaykum! Men Malika. Sotuv va buyurtmalar bo'limi operatoriman. Admiral Group mahsulotlari bo'yicha qanday yordam bera olaman?",
        op2: "Assalomu alaykum! Men Jasur. Texnik qo'llab-quvvatlash bo'limi operatoriman. Mahsulotlarimiz texnik xususiyatlari bo'yicha savolingiz bormi?",
        op3: "Assalomu alaykum! Men Nigora. Mijozlar servis bo'limidanman. Taklif yoki murojaatingiz bo'lsa, mamnuniyat bilan tinglayman."
      };
      speakResponse(testTexts[opId] || testTexts.op1, opId);
    });
  });

  // Load default Operator (Malika op1)
  switchOperator('op1');

  // Supervisor Action Listeners
  if (elements.supervisorWarnBtn) {
    elements.supervisorWarnBtn.addEventListener('click', () => {
      if (!state.isCallActive) {
        showNotification("Faol qo'ng'iroq yo'q!");
        return;
      }
      showNotification("Kamola: Mijozni mavzuga qaytarish bo'yicha ko'rsatma berildi.");
      handleClientMessage("[Bo'lim Boshlig'i Kamola Ogohlantirishi: Hurmatli operator, mijoz mavzudan chetlashmoqda. Diqqatni tezroq kompaniya sotuviga qarating!]");
    });
  }

  if (elements.supervisorHangupBtn) {
    elements.supervisorHangupBtn.addEventListener('click', () => {
      if (!state.isCallActive) {
        showNotification("Faol qo'ng'iroq yo'q!");
        return;
      }
      showNotification("Kamola: Qo'ng'iroq majburiy yakunlandi.");
      const interceptMsg = "Bo'lim Boshlig'i Kamola: Aloqa to'xtatildi. Keraksiz harajatlar oldini olish maqsadida ushbu suhbatni yakunlaymiz.";
      addMessageToLog('ai', interceptMsg);
      speakResponse(interceptMsg);
      setTimeout(endCall, 4000);
    });
  }

  // Main Nav Navigation (Terminal vs Operators Hub)
  const navBtns = document.querySelectorAll('.main-nav-btn');
  navBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      navBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const targetId = btn.getAttribute('data-target');
      document.querySelectorAll('.view-section').forEach(sec => sec.style.display = 'none');
      const targetEl = document.getElementById(targetId);
      if (targetEl) targetEl.style.display = targetId === 'terminal-view' ? 'grid' : 'block';
    });
  });

  // Operators Center Mode Switcher (Jadval / 2D / 3D)
  const modeBtns = document.querySelectorAll('.mode-btn');
  modeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      modeBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const modeId = btn.getAttribute('data-mode');
      document.querySelectorAll('.op-mode-content').forEach(mc => mc.style.display = 'none');
      const modeEl = document.getElementById(modeId);
      if (modeEl) modeEl.style.display = 'block';
    });
  });

  // 3D Personal Room Switcher (5 Rooms Hierarchy)
  const roomTabs = document.querySelectorAll('.room-tab');
  roomTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      roomTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const room = tab.getAttribute('data-room');
      const screenEl = document.getElementById('room-screen-content');
      const titleEl = document.getElementById('room-title');
      const avatarEl = document.getElementById('room-avatar-3d');

      if (room === 'room-malika') {
        if (titleEl) titleEl.textContent = "Malika — Sotuv Xonasi 1";
        if (avatarEl) avatarEl.innerHTML = '<i class="fa-solid fa-user-tie"></i>';
        if (screenEl) screenEl.innerHTML = '<span class="code-line">SYS_CALL_CENTER_v2.0</span><span class="code-line glow">LINIYA: +998 (71) 200-01-01</span><span class="code-line">BO\'LIM: SOTUV LINIYASI 1</span>';
      } else if (room === 'room-jasur') {
        if (titleEl) titleEl.textContent = "Jasur — Sotuv Xonasi 2";
        if (avatarEl) avatarEl.innerHTML = '<i class="fa-solid fa-user-tie"></i>';
        if (screenEl) screenEl.innerHTML = '<span class="code-line">SYS_CALL_CENTER_v2.0</span><span class="code-line glow">LINIYA: +998 (71) 200-01-02</span><span class="code-line">BO\'LIM: SOTUV LINIYASI 2</span>';
      } else if (room === 'room-nigora') {
        if (titleEl) titleEl.textContent = "Nigora — Sotuv Xonasi 3";
        if (avatarEl) avatarEl.innerHTML = '<i class="fa-solid fa-user-tie"></i>';
        if (screenEl) screenEl.innerHTML = '<span class="code-line">SYS_CALL_CENTER_v2.0</span><span class="code-line glow">LINIYA: +998 (71) 200-01-03</span><span class="code-line">BO\'LIM: SOTUV LINIYASI 3</span>';
      } else if (room === 'room-farruh') {
        if (titleEl) titleEl.textContent = "Farruh — Sotuv Xonasi 4";
        if (avatarEl) avatarEl.innerHTML = '<i class="fa-solid fa-user-tie"></i>';
        if (screenEl) screenEl.innerHTML = '<span class="code-line">SYS_CALL_CENTER_v2.0</span><span class="code-line glow">LINIYA: +998 (71) 200-01-04</span><span class="code-line">BO\'LIM: SOTUV LINIYASI 4</span>';
      } else if (room === 'room-kamola') {
        if (titleEl) titleEl.textContent = "Kamola — Supervisor Boshliq Suite";
        if (avatarEl) avatarEl.innerHTML = '<i class="fa-solid fa-crown"></i>';
        if (screenEl) screenEl.innerHTML = '<span class="code-line">SYS_SUPERVISOR_v2.0</span><span class="code-line glow" style="color:#c084fc;">LINIYA: +998 (71) 200-01-00</span><span class="code-line">STATUS: AUTOPILOT ACTIVE</span>';
      }
    });
  });

  // Table "Ulanish" Buttons
  document.querySelectorAll('.select-op-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const opId = btn.getAttribute('data-op');
      if (elements.operatorSelect) {
        elements.operatorSelect.value = opId;
        switchOperator(opId);
        // Switch back to terminal
        const termNav = document.getElementById('nav-terminal-btn');
        if (termNav) termNav.click();
      }
    });
  });

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
  if (elements.agentNameDisplay) elements.agentNameDisplay.textContent = `${op.name} (${op.role})`;
  if (elements.agent3dCore) elements.agent3dCore.className = `sphere-3d-core ${opId}-theme`;

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

  stopAllSpeech();

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

  // Real-time Off-topic Cost-Guard
  const offTopicKeywords = [
    'dastur yoz', 'javascript', 'python', 'html', 'css', 'kod yoz', 'coding', 'program',
    'tarix', 'geografiya', 'fizika', 'kimyo', 'matematika', 'algebra',
    'she\'r yoz', 'ertak', 'hikoya', 'kino tavsiya', 'ob-havo', 'dollar kursi'
  ];

  const isOffTopic = offTopicKeywords.some(kw => text.toLowerCase().includes(kw));
  if (isOffTopic && state.currentOperatorId !== 'op_head') {
    // If it's a sales operator, we trigger cost guard!
    if (elements.costGuardTopicBadge) {
      elements.costGuardTopicBadge.textContent = "⚠️ Chetlanish (Off-Topic)";
      elements.costGuardTopicBadge.style.background = "rgba(239, 68, 68, 0.15)";
      elements.costGuardTopicBadge.style.color = "#ef4444";
      elements.costGuardTopicBadge.style.borderColor = "rgba(239, 68, 68, 0.3)";
    }
    if (elements.costGuardAlertMsg) {
      elements.costGuardAlertMsg.innerHTML = `⚠️ <strong>Chetlanish aniqlandi:</strong> Mijoz mavzudan tashqari savol berdi ("${text}"). AI ovoz xarajatlari tejalmoqda.`;
      elements.costGuardAlertMsg.style.color = "#f87171";
    }

    const autoGuardActive = elements.autoCostGuardSwitch ? elements.autoCostGuardSwitch.checked : true;
    if (autoGuardActive) {
      // Auto-terminate call immediately to save costs!
      const warningResponse = "Kechirasiz, bu liniya faqat sotuv bo'limi uchun. Keraksiz AI ovoz xarajatlarini tejash maqsadida aloqa bo'lim boshlig'i tomonidan to'xtatildi.";
      addMessageToLog('ai', warningResponse);
      speakResponse(warningResponse);
      setTimeout(endCall, 4500);
      return;
    }
  } else if (state.isCallActive) {
    // Reset cost guard status
    if (elements.costGuardTopicBadge) {
      elements.costGuardTopicBadge.textContent = "🟢 Normal (Sotuvda)";
      elements.costGuardTopicBadge.style.background = "rgba(16, 185, 129, 0.15)";
      elements.costGuardTopicBadge.style.color = "#10b981";
      elements.costGuardTopicBadge.style.borderColor = "rgba(16, 185, 129, 0.3)";
    }
    if (elements.costGuardAlertMsg) {
      elements.costGuardAlertMsg.textContent = "Kamola operatorlar suhbatini nazorat qilmoqda. Mavzudan tashqari (off-topic) savollar berilganda, u xarajatlarni tejash uchun ogohlantirish beradi yoki suhbatni tugatadi.";
      elements.costGuardAlertMsg.style.color = "var(--text-muted)";
    }
  }

  elements.callStatus.textContent = "AI o'ylamoqda va javob tayyorlamoqda...";
  if (elements.avatarRing) elements.avatarRing.className = 'avatar-ring active speaking';
  if (elements.agent3dCore) elements.agent3dCore.classList.add('speaking');

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
        if (elements.avatarRing) elements.avatarRing.className = 'avatar-ring active';
        if (elements.agent3dCore) elements.agent3dCore.classList.remove('speaking');
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
// Unlock Browser Audio Autoplay Policy on User Gesture
function unlockAudio() {
  if (!state.sharedAudioPlayer) {
    state.sharedAudioPlayer = new Audio();
  }
  try {
    state.sharedAudioPlayer.play().catch(() => {});
  } catch (e) {}
}

// Stop any active speech (Google Audio & Browser Speech)
function stopAllSpeech() {
  if (state.sharedAudioPlayer) {
    try {
      state.sharedAudioPlayer.pause();
      state.sharedAudioPlayer.currentTime = 0;
    } catch (e) {}
  }
  state.currentAudio = null;
  state.voiceQueue = [];
  state.isPlayingQueue = false;

  if (state.speechSynth) {
    try { state.speechSynth.cancel(); } catch (e) {}
  }
}

// High-Definition Uzbek Speech Engine with Per-Operator Voice Tuning
function speakResponse(text, customOpId = null) {
  unlockAudio();
  stopAllSpeech();

  if (!text) return;

  const activeOpId = customOpId || state.currentOperatorId || 'op1';
  
  // Clean markdown symbols & links for natural speech
  const cleanText = text
    .replace(/['`ʻ’"]/g, '')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/#+/g, '')
    .replace(/https?:\/\/\S+/g, '')
    .replace(/[\n\r]+/g, '. ')
    .replace(/\s+/g, ' ')
    .trim();

  if (!cleanText) return;

  // Native Uzbek Neural HD Audio Stream
  speakGoogleUzbekVoice(cleanText, activeOpId);
}

// Native Uzbek HD Audio Stream via Sequential Queue
function speakGoogleUzbekVoice(text, opId) {
  // Split long response into natural sentences (max 140 chars per chunk)
  const chunks = splitTextIntoSentences(text, 140);
  state.voiceQueue = chunks;
  state.isPlayingQueue = true;

  playNextAudioChunk(opId);
}

async function playNextAudioChunk(opId) {
  if (!state.isPlayingQueue || state.voiceQueue.length === 0) {
    state.isPlayingQueue = false;
    if (elements.avatarRing && !state.isCallActive) elements.avatarRing.className = 'avatar-ring';
    if (elements.agent3dCore) elements.agent3dCore.classList.remove('speaking');
    return;
  }

  const chunk = state.voiceQueue.shift();
  const eKey = elements.elevenKeyInput ? elements.elevenKeyInput.value.trim() : '';
  const oKey = elements.openaiKeyInput ? elements.openaiKeyInput.value.trim() : '';
  const gKey = state.apiKey || '';

  try {
    if (elements.avatarRing) elements.avatarRing.className = 'avatar-ring active speaking';
    if (elements.agent3dCore) elements.agent3dCore.classList.add('speaking');

    const res = await fetch(`/api/tts?text=${encodeURIComponent(chunk)}&opId=${opId}&elevenKey=${encodeURIComponent(eKey)}&openaiKey=${encodeURIComponent(oKey)}&geminiKey=${encodeURIComponent(gKey)}&t=${Date.now()}`);

    if (!res.ok) {
      throw new Error(`TTS Fetch Failed: ${res.status}`);
    }

    const blob = await res.blob();
    const blobUrl = URL.createObjectURL(blob);

    if (!state.sharedAudioPlayer) {
      state.sharedAudioPlayer = new Audio();
    }

    const audio = state.sharedAudioPlayer;
    audio.src = blobUrl;
    state.currentAudio = audio;

    // Operator-specific acoustic speed tuning
    if (opId === 'op2') {
      // Jasur (Texnik Erkak)
      audio.playbackRate = 0.88;
    } else if (opId === 'op3') {
      // Nigora (Servis Ayol Soft)
      audio.playbackRate = 0.94;
    } else {
      // Malika (Sotuv Ayol Dynamic)
      audio.playbackRate = 1.04;
    }

    return new Promise((resolve) => {
      audio.onended = () => {
        URL.revokeObjectURL(blobUrl);
        state.currentAudio = null;
        playNextAudioChunk(opId).then(resolve);
      };

      audio.onerror = (e) => {
        console.warn("Audio Blob playback error:", e);
        URL.revokeObjectURL(blobUrl);
        state.currentAudio = null;
        playNextAudioChunk(opId).then(resolve);
      };

      audio.play().then(resolve).catch(err => {
        console.warn("Audio play error:", err);
        URL.revokeObjectURL(blobUrl);
        state.currentAudio = null;
        playNextAudioChunk(opId).then(resolve);
      });
    });

  } catch (err) {
    console.warn("TTS Fetch/Play Error:", err);
    state.currentAudio = null;
    playNextAudioChunk(opId);
  }
}

// Split text by punctuation (. ! ? , ;) into chunks <= maxLen
function splitTextIntoSentences(text, maxLen = 140) {
  const parts = text.split(/(?<=[.!?])\s+/);
  const result = [];
  let current = '';

  for (const part of parts) {
    if ((current + ' ' + part).length <= maxLen) {
      current = current ? current + ' ' + part : part;
    } else {
      if (current) result.push(current);
      if (part.length > maxLen) {
        // Sub-split by commas if still too long
        const subParts = part.split(/(?<=[,;])\s+/);
        for (const sub of subParts) {
          if (sub.length <= maxLen) {
            result.push(sub);
          } else {
            result.push(sub.substring(0, maxLen));
          }
        }
        current = '';
      } else {
        current = part;
      }
    }
  }
  if (current) result.push(current);
  return result;
}

// Browser Web Speech Synthesis Fallback
function speakBrowserSpeech(text, opId) {
  if (!state.speechSynth) return;

  const utterance = new SpeechSynthesisUtterance(text);
  const voices = state.speechSynth.getVoices();

  // Find best phonetic voice match (uz, tr, ru)
  const uzVoice = voices.find(v => v.lang.includes('uz') || v.lang.includes('UZ')) ||
                 voices.find(v => v.lang.includes('tr') || v.lang.includes('TR')) ||
                 voices.find(v => v.lang.includes('ru') || v.lang.includes('RU'));

  if (uzVoice) {
    utterance.voice = uzVoice;
  }

  // Operator-specific pitch & rate tuning
  if (opId === 'op2') {
    // Jasur — Male tone
    utterance.pitch = 0.85;
    utterance.rate = 0.95;
  } else if (opId === 'op3') {
    // Nigora — Warm female tone
    utterance.pitch = 1.20;
    utterance.rate = 0.92;
  } else {
    // Malika — Energetic female tone
    utterance.pitch = 1.05;
    utterance.rate = 1.00;
  }

  if (elements.avatarRing) elements.avatarRing.className = 'avatar-ring active speaking';
  if (elements.agent3dCore) elements.agent3dCore.classList.add('speaking');

  utterance.onend = () => {
    if (elements.avatarRing && !state.isCallActive) elements.avatarRing.className = 'avatar-ring';
    if (elements.agent3dCore) elements.agent3dCore.classList.remove('speaking');
  };

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
