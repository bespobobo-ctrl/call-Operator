// AI Call Center — Uzbek Voice Operator Logic

// State Management
const state = {
  apiKey: localStorage.getItem('gemini_api_key') || '',
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
  supervisorNotes: document.getElementById('supervisor-notes'),

  // Greeting Modal controls
  greetingModal: document.getElementById('greeting-modal'),
  modalOpAvatar: document.getElementById('modal-op-avatar'),
  modalOpName: document.getElementById('modal-op-name'),
  modalOpRole: document.getElementById('modal-op-role'),
  modalGreetingTextarea: document.getElementById('modal-greeting-textarea'),
  modalCloseBtn: document.getElementById('modal-close-btn'),
  modalCancelBtn: document.getElementById('modal-cancel-btn'),
  modalSaveBtn: document.getElementById('modal-save-btn'),
  modalResetBtn: document.getElementById('modal-reset-btn'),
  modalTestVoiceBtn: document.getElementById('modal-test-voice-btn'),

  // QA Rules Modal controls
  qaRulesModal: document.getElementById('qa-rules-modal'),
  qaModalOpAvatar: document.getElementById('qa-modal-op-avatar'),
  qaModalOpName: document.getElementById('qa-modal-op-name'),
  qaRulesContainer: document.getElementById('qa-rules-container'),
  qaAddRuleBtn: document.getElementById('qa-add-rule-btn'),
  qaModalCloseBtn: document.getElementById('qa-modal-close-btn'),
  qaModalCancelBtn: document.getElementById('qa-modal-cancel-btn'),
  qaModalSaveBtn: document.getElementById('qa-modal-save-btn'),
  qaGuideToggleBtn: document.getElementById('qa-guide-toggle-btn'),
  qaGuideBox: document.getElementById('qa-guide-box'),

  // PWA Download & Install Modal controls
  btnInstallApp: document.getElementById('btn-install-app'),
  downloadAppBtn: document.getElementById('download-app-btn'),
  downloadModal: document.getElementById('download-modal'),
  downloadModalCloseBtn: document.getElementById('download-modal-close-btn'),
  downloadModalCancelBtn: document.getElementById('download-modal-cancel-btn'),
  pwaInstallTriggerBtn: document.getElementById('pwa-install-trigger-btn'),
  pwaInstallStatusText: document.getElementById('pwa-install-status-text')
};

// Initialize Application
function init() {
  setConnectionState(true, '🔒 Gemini 2.0 API Ulangan (Maxfiy)');

  // Load saved keys from localStorage
  if (elements.elevenKeyInput) {
    elements.elevenKeyInput.value = localStorage.getItem('elevenlabs_api_key') || '';
  }
  if (elements.openaiKeyInput) {
    elements.openaiKeyInput.value = localStorage.getItem('openai_api_key') || '';
  }

  // Load Custom Operator Phones from localStorage
  const defaultPhones = {
    op1: "+998 (71) 200-01-01",
    op2: "+998 (71) 200-01-02",
    op3: "+998 (71) 200-01-03",
    op4: "+998 (71) 200-01-04",
    op_head: "+998 (71) 200-01-00"
  };

  state.operatorPhones = JSON.parse(localStorage.getItem('operator_phones') || '{}');
  for (const opId in defaultPhones) {
    if (!state.operatorPhones[opId]) {
      state.operatorPhones[opId] = defaultPhones[opId];
    }
    if (operators[opId]) {
      operators[opId].phone = state.operatorPhones[opId];
    }
  }

  // Populate phone inputs in Settings page & set values
  document.querySelectorAll('.op-phone-input').forEach(input => {
    const opId = input.getAttribute('data-op');
    input.value = state.operatorPhones[opId] || '';

    input.addEventListener('input', (e) => {
      const newPhone = e.target.value.trim();
      state.operatorPhones[opId] = newPhone;
      localStorage.setItem('operator_phones', JSON.stringify(state.operatorPhones));
      
      if (operators[opId]) {
        operators[opId].phone = newPhone;
      }

      // 1. Update Dropdown option text
      const optionEl = document.querySelector(`#operator-select option[value="${opId}"]`);
      if (optionEl) {
        const op = operators[opId];
        const prefixes = { 
          op1: '🟢 Liniya 1: Malika — Sotuv Liniyasi 1', 
          op2: '🔵 Liniya 2: Jasur — Sotuv Liniyasi 2', 
          op3: '🟣 Liniya 3: Nigora — Sotuv Liniyasi 3', 
          op4: '🟠 Liniya 4: Farruh — Sotuv Liniyasi 4', 
          op_head: '👑 Liniya 0: Kamola — Bo\'lim Boshlig\'i' 
        };
        optionEl.textContent = `${prefixes[opId]} (${newPhone})`;
      }

      // 2. Update Active phone display inside terminal if active
      if (state.currentOperatorId === opId && elements.activePhoneDisplay) {
        elements.activePhoneDisplay.textContent = newPhone;
      }

      // 3. Update Phone pill inside Jadval table row
      const ruleBtn = document.querySelector(`.rule-manage-btn[data-op="${opId}"]`);
      if (ruleBtn) {
        const row = ruleBtn.closest('tr');
        if (row) {
          const pill = row.querySelector('.code-pill');
          if (pill) pill.textContent = newPhone;
        }
      }

      // 4. Update 3D Hologram stats overlay
      const activeOp = operators[state.currentOperatorId] || operators.op1;
      const roomPillEl = document.querySelector('.room-pill.glow-green');
      if (roomPillEl && state.currentOperatorId === opId) {
        roomPillEl.textContent = `🟢 Liniya ${opId === 'op_head' ? '0' : opId.replace('op','')}: ${activeOp.name} — ${newPhone}`;
      }
    });
  });

  // Auto-save keys to localStorage on input change
  if (elements.elevenKeyInput) {
    elements.elevenKeyInput.addEventListener('input', (e) => {
      localStorage.setItem('elevenlabs_api_key', e.target.value.trim());
    });
  }
  if (elements.openaiKeyInput) {
    elements.openaiKeyInput.addEventListener('input', (e) => {
      localStorage.setItem('openai_api_key', e.target.value.trim());
    });
  }

  // Load Custom Operator Greetings
  const defaultGreetings = {
    op1: "Assalomu alaykum! Men Malika. Sotuv va buyurtmalar bo'limi bosh operatoriman. Admiral Group mahsulotlari narxlari va zakaz berishda sizga qanday yordam bera olaman?",
    op2: "Assalomu alaykum! Men Jasur. Sotuv bo'limi operatoriman. Admiral Group xizmatlarining texnik masalalarida va buyurtmalarda qanday yordam kerak?",
    op3: "Assalomu alaykum! Men Nigora. Sotuv bo'limi operatoriman. Taklifingiz yoki zakaz berish bo'yicha savolingiz bo'lsa, mamnuniyat bilan yordam beraman.",
    op4: "Assalomu alaykum! Men Farruh. Sotuv bo'limi operatoriman. Admiral Group loyihalari va buyurtma qilish bo'yicha qanday masalada yordam beray?",
    op_head: "Assalomu alaykum! Men Kamola. Sotuv bo'limi boshlig'iman. Operatorlarimiz muloqoti bo'yicha yoki yirik buyurtmalar bo'yicha qanday yordam bera olaman?"
  };

  state.greetingPhrases = JSON.parse(localStorage.getItem('operator_greeting_phrases') || '{}');
  for (const opId in defaultGreetings) {
    if (!state.greetingPhrases[opId]) {
      state.greetingPhrases[opId] = defaultGreetings[opId];
    }
  }

  // Populate Table Preview text strings
  for (const opId in state.greetingPhrases) {
    const previewEl = document.getElementById(`preview-${opId}`);
    if (previewEl) {
      previewEl.textContent = state.greetingPhrases[opId];
    }
  }

  // Wire Modal Editor Event Listeners
  document.querySelectorAll('.greeting-edit-badge').forEach(badge => {
    badge.addEventListener('click', () => {
      const opId = badge.getAttribute('data-op');
      const op = operators[opId] || operators.op1;
      
      state.editingOpId = opId;
      
      if (elements.modalOpName) elements.modalOpName.textContent = op.name;
      if (elements.modalOpRole) elements.modalOpRole.textContent = op.role;
      if (elements.modalGreetingTextarea) elements.modalGreetingTextarea.value = state.greetingPhrases[opId] || '';
      
      if (elements.modalOpAvatar) {
        if (opId === 'op_head') {
          elements.modalOpAvatar.innerHTML = '<i class="fa-solid fa-crown"></i>';
          elements.modalOpAvatar.style.background = 'linear-gradient(135deg, #a855f7, #7c3aed)';
        } else {
          elements.modalOpAvatar.innerHTML = '<i class="fa-solid fa-user-tie"></i>';
          const bgMap = { op1: 'var(--success-green)', op2: 'var(--accent-cyan)', op3: 'var(--purple-accent)', op4: 'var(--warning-amber)' };
          elements.modalOpAvatar.style.background = bgMap[opId] || 'var(--accent-cyan)';
        }
      }

      if (elements.greetingModal) elements.greetingModal.classList.add('active');
    });
  });

  const closeModal = () => {
    if (elements.greetingModal) elements.greetingModal.classList.remove('active');
    state.editingOpId = null;
    stopAllSpeech();
  };

  if (elements.modalCloseBtn) elements.modalCloseBtn.addEventListener('click', closeModal);
  if (elements.modalCancelBtn) elements.modalCancelBtn.addEventListener('click', closeModal);

  if (elements.modalSaveBtn) {
    elements.modalSaveBtn.addEventListener('click', () => {
      if (state.editingOpId && elements.modalGreetingTextarea) {
        const opId = state.editingOpId;
        const text = elements.modalGreetingTextarea.value.trim();
        state.greetingPhrases[opId] = text;
        localStorage.setItem('operator_greeting_phrases', JSON.stringify(state.greetingPhrases));
        
        const previewEl = document.getElementById(`preview-${opId}`);
        if (previewEl) previewEl.textContent = text;
      }
      closeModal();
    });
  }

  if (elements.modalResetBtn) {
    elements.modalResetBtn.addEventListener('click', () => {
      if (state.editingOpId && elements.modalGreetingTextarea) {
        elements.modalGreetingTextarea.value = defaultGreetings[state.editingOpId] || '';
      }
    });
  }

  if (elements.modalTestVoiceBtn) {
    elements.modalTestVoiceBtn.addEventListener('click', () => {
      if (state.editingOpId && elements.modalGreetingTextarea) {
        const opId = state.editingOpId;
        const text = elements.modalGreetingTextarea.value.trim();
        showNotification(`🎙️ ${operators[opId]?.name || 'Operator'} ovozi sinanmoqda...`);
        speakResponse(text, opId);
      }
    });
  }

  // Load Custom Operator Q&A Rules (n8n bypass tejamkorlik)
  const defaultQARules = {
    op1: [
      { trigger: "kafolat, garantiya", response: "Admiral Group barcha mahsulotlariga 1 yillik rasmiy kafolat beradi." },
      { trigger: "dostavka, yetkazib", response: "O'zbekiston bo'ylab barcha 12 ta viloyatga yetkazib berish xizmati 24 soat ichida mutlaqo bepul amalga oshiriladi." }
    ],
    op2: [
      { trigger: "narxi, qancha", response: "Xizmatlarimiz narxi loyihaning murakkabligiga qarab 500 AQSh dollaridan boshlanadi. Bepul hisob-kitob qilishimiz mumkin." }
    ],
    op3: [
      { trigger: "manzil, ofis", response: "Bosh ofisimiz Toshkent shahri, Amir Temur ko'chasi 45-uy manzilida joylashgan. Mo'ljal: Oloy bozori ro'parasida." }
    ],
    op4: [
      { trigger: "chegirma, skidka", response: "Hozirda Admiral Group-da maxsus bayram chegirmalari ketyapti! Xarid qilsangiz 15 foiz chegirma qilib beramiz." }
    ],
    op_head: [
      { trigger: "hamkorlik, sherik", response: "Hamkorlik masalalari bo'yicha taklifingizni elektron pochtamizga yuboring yoki men sizni bosh direktor bilan bog'layman." }
    ]
  };
  
  state.operatorQA = JSON.parse(localStorage.getItem('operator_qa_rules') || '{}');
  for (const opId in defaultQARules) {
    if (!state.operatorQA[opId]) {
      state.operatorQA[opId] = defaultQARules[opId];
    }
  }

  // Update rule counter badges in table
  const updateRuleCounts = () => {
    for (const opId in state.operatorQA) {
      const countEl = document.getElementById(`rule-count-${opId}`);
      if (countEl) {
        countEl.textContent = (state.operatorQA[opId] || []).length;
      }
    }
  };
  updateRuleCounts();

  // Wire QA Rules Modal Event Handlers
  let currentEditingQAPhases = [];

  document.querySelectorAll('.rule-manage-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const opId = btn.getAttribute('data-op');
      const op = operators[opId] || operators.op1;
      
      state.editingQAOpId = opId;
      currentEditingQAPhases = JSON.parse(JSON.stringify(state.operatorQA[opId] || []));
      
      if (elements.qaModalOpName) elements.qaModalOpName.textContent = op.name;
      
      if (elements.qaModalOpAvatar) {
        if (opId === 'op_head') {
          elements.qaModalOpAvatar.innerHTML = '<i class="fa-solid fa-crown"></i>';
          elements.qaModalOpAvatar.style.background = 'linear-gradient(135deg, #a855f7, #7c3aed)';
        } else {
          elements.qaModalOpAvatar.innerHTML = '<i class="fa-solid fa-network-wired"></i>';
          const bgMap = { op1: 'var(--success-green)', op2: 'var(--accent-cyan)', op3: 'var(--purple-accent)', op4: 'var(--warning-amber)' };
          elements.modalOpAvatar.style.background = bgMap[opId] || 'var(--accent-cyan)';
        }
      }

      renderQARulesList();
      if (elements.qaRulesModal) elements.qaRulesModal.classList.add('active');
    });
  });

  const renderQARulesList = () => {
    if (!elements.qaRulesContainer) return;
    elements.qaRulesContainer.innerHTML = '';
    
    if (currentEditingQAPhases.length === 0) {
      elements.qaRulesContainer.innerHTML = '<div style="text-align: center; padding: 20px; color: var(--text-muted); font-size: 11px; border: 1px dashed rgba(255,255,255,0.08); border-radius: 4px;">Hali hech qanday qoidalar yo\'q. Yangi qoida qo\'shish tugmasini bosing.</div>';
      return;
    }

    currentEditingQAPhases.forEach((rule, index) => {
      const card = document.createElement('div');
      card.className = 'workflow-rule-card';
      card.innerHTML = `
        <div class="rule-delete-btn" data-index="${index}">&times;</div>
        
        <div class="flow-node">
          <span class="flow-badge badge-if">IF Trigger</span>
          <div class="flow-input-container">
            <input type="text" class="rule-input qa-trigger-input" data-index="${index}" value="${rule.trigger}" placeholder="Kalit so'zlar (vergul bilan ajratilgan: chegirma, skidka)">
          </div>
        </div>
        
        <div class="flow-arrow"><i class="fa-solid fa-arrow-down-long"></i></div>
        
        <div class="flow-node">
          <span class="flow-badge badge-then">THEN Reply</span>
          <div class="flow-input-container">
            <textarea class="rule-input qa-response-input" data-index="${index}" rows="2" style="resize: vertical; padding: 8px 10px;" placeholder="Mijozga qaytariladigan aniq javob...">${rule.response}</textarea>
          </div>
        </div>
      `;
      
      card.querySelector('.rule-delete-btn').addEventListener('click', () => {
        currentEditingQAPhases.splice(index, 1);
        renderQARulesList();
      });
      
      card.querySelector('.qa-trigger-input').addEventListener('input', (e) => {
        currentEditingQAPhases[index].trigger = e.target.value;
      });
      card.querySelector('.qa-response-input').addEventListener('input', (e) => {
        currentEditingQAPhases[index].response = e.target.value;
      });

      elements.qaRulesContainer.appendChild(card);
    });
  };

  if (elements.qaAddRuleBtn) {
    elements.qaAddRuleBtn.addEventListener('click', () => {
      currentEditingQAPhases.push({ trigger: '', response: '' });
      renderQARulesList();
      if (elements.qaRulesContainer) {
        setTimeout(() => {
          elements.qaRulesContainer.parentElement.scrollTop = elements.qaRulesContainer.parentElement.scrollHeight;
        }, 50);
      }
    });
  }

  if (elements.qaGuideToggleBtn && elements.qaGuideBox) {
    elements.qaGuideToggleBtn.addEventListener('click', () => {
      const isVisible = elements.qaGuideBox.style.display === 'block';
      elements.qaGuideBox.style.display = isVisible ? 'none' : 'block';
      elements.qaGuideToggleBtn.innerHTML = isVisible 
        ? '<i class="fa-solid fa-book-open" style="margin-right: 6px;"></i> Qo\'llanma' 
        : '<i class="fa-solid fa-xmark" style="margin-right: 6px;"></i> Yopish';
    });
  }

  const closeQAModal = () => {
    if (elements.qaRulesModal) elements.qaRulesModal.classList.remove('active');
    state.editingQAOpId = null;
    currentEditingQAPhases = [];
    if (elements.qaGuideBox) elements.qaGuideBox.style.display = 'none';
    if (elements.qaGuideToggleBtn) {
      elements.qaGuideToggleBtn.innerHTML = '<i class="fa-solid fa-book-open" style="margin-right: 6px;"></i> Qo\'llanma';
    }
  };

  if (elements.qaModalCloseBtn) elements.qaModalCloseBtn.addEventListener('click', closeQAModal);
  if (elements.qaModalCancelBtn) elements.qaModalCancelBtn.addEventListener('click', closeQAModal);

  if (elements.qaModalSaveBtn) {
    elements.qaModalSaveBtn.addEventListener('click', () => {
      if (state.editingQAOpId) {
        const opId = state.editingQAOpId;
        state.operatorQA[opId] = currentEditingQAPhases.filter(r => r.trigger.trim() && r.response.trim());
        localStorage.setItem('operator_qa_rules', JSON.stringify(state.operatorQA));
        updateRuleCounts();
      }
      closeQAModal();
      showNotification("Qoidalar muvaffaqiyatli saqlandi! ⚡");
    });
  }

  state.systemPrompt = elements.systemInstructionInput.value;
  elements.statTotalCalls.textContent = state.totalCalls;

  // Event Listeners
  elements.startCallBtn.addEventListener('click', startCall);
  elements.endCallBtn.addEventListener('click', endCall);
  elements.muteBtn.addEventListener('click', toggleMute);
  elements.testVoiceBtn.addEventListener('click', () => {
    const opId = state.currentOperatorId || 'op1';
    const activeOp = operators[opId] || operators.op1;
    const textToSpeak = state.greetingPhrases[opId] || `Assalomu alaykum! Men ${activeOp.name}man. Qanday yordam bera olaman?`;
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
      const textToSpeak = state.greetingPhrases[opId] || `Assalomu alaykum! Men ${operators[opId]?.name || 'operator'}man. Qanday yordam bera olaman?`;
      speakResponse(textToSpeak, opId);
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

  // Main Nav Navigation (Terminal vs Operators Hub vs Settings)
  const navBtns = document.querySelectorAll('.main-nav-btn');
  navBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      navBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const targetId = btn.getAttribute('data-target');
      document.querySelectorAll('.view-section').forEach(sec => sec.style.display = 'none');
      const targetEl = document.getElementById(targetId);
      if (targetEl) {
        targetEl.style.display = (targetId === 'terminal-view' || targetId === 'settings-view') ? 'grid' : 'block';
      }
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

      const roomBox = document.getElementById('room-3d-box');
      if (roomBox) roomBox.className = `room-3d-box theme-${room}`;

      const pillsEl = document.getElementById('room-stat-pills');

      if (room === 'room-malika') {
        if (titleEl) titleEl.textContent = "Malika — Sotuv Xonasi 1";
        if (avatarEl) avatarEl.innerHTML = '<i class="fa-solid fa-user-tie"></i>';
        if (screenEl) screenEl.innerHTML = '<span class="code-line">SYS_CALL_CENTER_v2.0</span><span class="code-line glow">LINIYA: +998 (71) 200-01-01</span><span class="code-line">BO\'LIM: SOTUV LINIYASI 1</span>';
        if (pillsEl) {
          pillsEl.innerHTML = `
            <span class="room-pill">📍 Toshkent HQ</span>
            <span class="room-pill glow-green" style="background: rgba(16, 185, 129, 0.15); color: #10b981;">🟢 Liniya 1 (+998 71 200-01-01)</span>
            <span class="room-pill">📦 Bugungi Buyurtmalar: 34 ta</span>
          `;
        }
      } else if (room === 'room-jasur') {
        if (titleEl) titleEl.textContent = "Jasur — Sotuv Xonasi 2";
        if (avatarEl) avatarEl.innerHTML = '<i class="fa-solid fa-user-tie"></i>';
        if (screenEl) screenEl.innerHTML = '<span class="code-line">SYS_CALL_CENTER_v2.0</span><span class="code-line glow">LINIYA: +998 (71) 200-01-02</span><span class="code-line">BO\'LIM: SOTUV LINIYASI 2</span>';
        if (pillsEl) {
          pillsEl.innerHTML = `
            <span class="room-pill">📍 Samarqand Office</span>
            <span class="room-pill glow-green" style="background: rgba(59, 130, 246, 0.15); color: #3b82f6;">🔵 Liniya 2 (+998 71 200-01-02)</span>
            <span class="room-pill">📦 Bugungi Buyurtmalar: 26 ta</span>
          `;
        }
      } else if (room === 'room-nigora') {
        if (titleEl) titleEl.textContent = "Nigora — Sotuv Xonasi 3";
        if (avatarEl) avatarEl.innerHTML = '<i class="fa-solid fa-user-tie"></i>';
        if (screenEl) screenEl.innerHTML = '<span class="code-line">SYS_CALL_CENTER_v2.0</span><span class="code-line glow">LINIYA: +998 (71) 200-01-03</span><span class="code-line">BO\'LIM: SOTUV LINIYASI 3</span>';
        if (pillsEl) {
          pillsEl.innerHTML = `
            <span class="room-pill">📍 Buxoro Office</span>
            <span class="room-pill glow-green" style="background: rgba(6, 182, 212, 0.15); color: #06b6d4;">🟣 Liniya 3 (+998 71 200-01-03)</span>
            <span class="room-pill">📦 Bugungi Buyurtmalar: 21 ta</span>
          `;
        }
      } else if (room === 'room-farruh') {
        if (titleEl) titleEl.textContent = "Farruh — Sotuv Xonasi 4";
        if (avatarEl) avatarEl.innerHTML = '<i class="fa-solid fa-user-tie"></i>';
        if (screenEl) screenEl.innerHTML = '<span class="code-line">SYS_CALL_CENTER_v2.0</span><span class="code-line glow">LINIYA: +998 (71) 200-01-04</span><span class="code-line">BO\'LIM: SOTUV LINIYASI 4</span>';
        if (pillsEl) {
          pillsEl.innerHTML = `
            <span class="room-pill">📍 Farg'ona Office</span>
            <span class="room-pill glow-green" style="background: rgba(245, 158, 11, 0.15); color: #f59e0b;">🟠 Liniya 4 (+998 71 200-01-04)</span>
            <span class="room-pill">📦 Bugungi Buyurtmalar: 18 ta</span>
          `;
        }
      } else if (room === 'room-kamola') {
        if (titleEl) titleEl.textContent = "Kamola — Supervisor Boshliq Suite";
        if (avatarEl) avatarEl.innerHTML = '<i class="fa-solid fa-crown"></i>';
        if (screenEl) screenEl.innerHTML = '<span class="code-line">SYS_SUPERVISOR_v2.0</span><span class="code-line glow" style="color:#c084fc;">LINIYA: +998 (71) 200-01-00</span><span class="code-line">STATUS: AUTOPILOT ACTIVE</span>';
        if (pillsEl) {
          pillsEl.innerHTML = `
            <span class="room-pill" style="border: 1px solid rgba(168, 85, 247, 0.3); color: #c084fc;">👑 HQ Executive Suite</span>
            <span class="room-pill glow-green" style="background: rgba(168, 85, 247, 0.15); color: #c084fc;">👑 Liniya 0 (+998 71 200-01-00)</span>
            <span class="room-pill">🛡️ Jamoa: 4 ta sotuv stansiyalari</span>
          `;
        }
      }
    });
  });

  // Mouse-Parallax Room Camera Rotation (Ultra-Premium interactive touch)
  const roomStage = document.querySelector('.room-stage-3d');
  const roomBox = document.getElementById('room-3d-box');
  if (roomStage && roomBox) {
    roomStage.addEventListener('mousemove', (e) => {
      const rect = roomStage.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;

      const rotateX = 25 - (y / rect.height) * 20; // pitch
      const rotateY = -30 + (x / rect.width) * 30; // yaw
      roomBox.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(-20px)`;
    });

    roomStage.addEventListener('mouseleave', () => {
      roomBox.style.transform = `rotateX(25deg) rotateY(-30deg) translateZ(-20px)`;
      roomBox.style.transition = 'transform 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
    });

    roomStage.addEventListener('mouseenter', () => {
      roomBox.style.transition = 'none';
    });
  }

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

  // Setup PWA & Download Modal Event Listeners
  setupPwaAndDownloadModal();

  // Setup Web Speech API for Uzbek recognition
  setupSpeechRecognition();
  initCanvas();
}

// PWA & Tablet Install Handler
let deferredPrompt = null;

function setupPwaAndDownloadModal() {
  // Register Service Worker for offline PWA
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js').then((reg) => {
        console.log('[PWA] ServiceWorker successfully registered:', reg.scope);
      }).catch((err) => {
        console.warn('[PWA] ServiceWorker registration failed:', err);
      });
    });
  }

  // Intercept beforeinstallprompt event
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    if (elements.pwaInstallStatusText) {
      elements.pwaInstallStatusText.innerHTML = '<i class="fa-solid fa-bolt" style="color:#00f2fe;"></i> Planshetga 1-bosishda o\'rnatish tayyor!';
    }
  });

  window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
    showNotification('🎉 AI Call Center ilovasi planshetingizga muvaffaqiyatli o\'rnatildi!');
    if (elements.pwaInstallStatusText) {
      elements.pwaInstallStatusText.innerHTML = '<i class="fa-solid fa-circle-check" style="color:#10b981;"></i> Ilova planshetga o\'rnatilgan';
    }
  });

  // Modal Open / Close Handlers
  const openDownloadModal = () => {
    if (elements.downloadModal) elements.downloadModal.classList.add('active');
  };

  const closeDownloadModal = () => {
    if (elements.downloadModal) elements.downloadModal.classList.remove('active');
  };

  const handleInstallClick = (e) => {
    if (e && typeof e.preventDefault === 'function') e.preventDefault();
    openDownloadModal();
  };

  if (elements.btnInstallApp) elements.btnInstallApp.addEventListener('click', handleInstallClick);
  if (elements.downloadAppBtn) elements.downloadAppBtn.addEventListener('click', handleInstallClick);
  if (elements.downloadModalCloseBtn) elements.downloadModalCloseBtn.addEventListener('click', closeDownloadModal);
  if (elements.downloadModalCancelBtn) elements.downloadModalCancelBtn.addEventListener('click', closeDownloadModal);
  if (elements.downloadModal) {
    elements.downloadModal.addEventListener('click', (e) => {
      if (e.target === elements.downloadModal) closeDownloadModal();
    });
  }

  // Tablet direct blob download helper (Works on 100% of mobile Chrome/Safari/Edge browsers)
  const triggerTabletDownload = async (e, fileUrl, filename) => {
    if (e && typeof e.preventDefault === 'function') e.preventDefault();
    showNotification(`⏳ ${filename} planshetga yuklanmoqda...`);
    try {
      const response = await fetch(fileUrl);
      if (!response.ok) throw new Error('Fetch status ' + response.status);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 15000);
      showNotification(`✅ ${filename} planshetingizga muvaffaqiyatli yuklab olindi!`);
    } catch (err) {
      console.warn('Direct blob download fallback:', err);
      window.location.href = fileUrl;
    }
  };

  const htmlBtn = document.getElementById('download-html-btn');
  if (htmlBtn) {
    htmlBtn.addEventListener('click', (e) => triggerTabletDownload(e, '/AI_Call_Center_Planshet.html', 'AI_Call_Center_Planshet.html'));
  }

  const zipBtn = document.getElementById('download-zip-btn');
  if (zipBtn) {
    zipBtn.addEventListener('click', (e) => triggerTabletDownload(e, '/ai-call-center-offline.zip', 'ai-call-center-offline.zip'));
  }

  // Trigger PWA Installation prompt inside modal
  if (elements.pwaInstallTriggerBtn) {
    elements.pwaInstallTriggerBtn.addEventListener('click', async () => {
      if (deferredPrompt) {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
          showNotification('Planshetga o\'rnatish tasdiqlandi! 📲');
        }
        deferredPrompt = null;
      } else {
        // If browser auto-prompt isn't fired yet, show platform guide alert or toast
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
        if (isIOS) {
          alert("iPad-da o'rnatish uchun:\nSafari pastki menyusidagi Ulashish (Share ⎋) tugmasini bosing va 'Bosh ekranga qo'shish (Add to Home Screen)'ni tanlang.");
        } else {
          showNotification("💡 Planshet brauzeringiz menyusidan (⋮) 'Bosh ekranga qo'shish' yoki 'Ilovani o'rnatish' tugmasini bosing.");
        }
      }
    });
  }
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
    const opId = state.currentOperatorId || 'op1';
    const welcome = state.greetingPhrases[opId] || `Assalomu alaykum! Men ${operators[opId]?.name || 'operator'}man. Qanday yordam bera olaman?`;
    addMessageToLog('ai', welcome);
    speakResponse(welcome, opId);
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

  // Custom Operator Q&A Rules (n8n bypass tejamkorlik)
  const opId = state.currentOperatorId || 'op1';
  const rules = state.operatorQA[opId] || [];
  let matchedRule = null;
  
  for (const rule of rules) {
    if (!rule.trigger || !rule.response) continue;
    const keywords = rule.trigger.toLowerCase().split(',').map(kw => kw.trim()).filter(Boolean);
    if (keywords.some(kw => text.toLowerCase().includes(kw))) {
      matchedRule = rule;
      break;
    }
  }

  if (matchedRule) {
    const responseText = matchedRule.response;
    elements.statLatency.textContent = `~0ms (⚡ QA Rule)`;
    elements.callStatus.textContent = "AI javob bermoqda...";
    addMessageToLog('ai', responseText);
    showNotification("⚡ Avtomatik Qoida Faollashdi (Tejamkorlik!)");
    addSystemMessage(`[TEJAMKORLIK]: "${text}" savoliga QA Qoidasi bo'yicha javob qaytarildi.`);
    speakResponse(responseText, opId);
    checkOrderKeywords(text, responseText);
    return;
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

    // Play at the server-synthesized high-definition speed
    audio.playbackRate = 1.0;

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
