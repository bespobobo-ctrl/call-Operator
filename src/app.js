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
  companyName: 'TechCorp Uzbekistan',
  systemPrompt: '',
  chatHistory: []
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
  
  canvas: document.getElementById('audio-wave-canvas'),
  tabBtns: document.querySelectorAll('.tab-btn'),
  tabContents: document.querySelectorAll('.tab-content'),
  simChips: document.querySelectorAll('.sim-chip')
};

// Initialize Application
function init() {
  // Load saved values
  if (state.apiKey) {
    elements.apiKeyInput.value = state.apiKey;
    setConnectionState(true, 'Tayyor (Key ulangan)');
  } else {
    setConnectionState(false, 'API Key kiritilmagan');
  }

  state.systemPrompt = elements.systemInstructionInput.value;
  elements.statTotalCalls.textContent = state.totalCalls;

  // Event Listeners
  elements.saveKeyBtn.addEventListener('click', saveApiKey);
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
  showNotification("AI Operator sozlamalari yangilandi!");
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
  state.totalCalls++;
  localStorage.setItem('total_calls', state.totalCalls);
  elements.statTotalCalls.textContent = state.totalCalls;

  elements.startCallBtn.disabled = true;
  elements.endCallBtn.disabled = false;
  elements.muteBtn.disabled = false;
  elements.avatarRing.className = 'avatar-ring active';
  elements.callStatus.textContent = "Muloqot ulangan. O'zbek tilida gapirishingiz mumkin...";
  elements.handoffAlert.style.display = 'none';

  // Start timer
  state.timerInterval = setInterval(() => {
    state.callDurationSeconds++;
    const mins = String(Math.floor(state.callDurationSeconds / 60)).padStart(2, '0');
    const secs = String(state.callDurationSeconds % 60).padStart(2, '0');
    elements.callTimer.textContent = `${mins}:${secs}`;
    elements.statAvgDuration.textContent = `${state.callDurationSeconds}s`;
  }, 1000);

  // Start Speech Recognition
  if (state.recognition) {
    try {
      state.recognition.start();
    } catch (e) {
      console.log(e);
    }
  }

  // AI Welcome Greeting
  setTimeout(() => {
    const welcome = `Assalomu alaykum! ${state.companyName} qo'llab-quvvatlash markaziga xush kelibsiz. Men sun'iy intellektual operator Malikaman. Sizga qanday yordam bera olaman?`;
    addMessageToLog('ai', welcome);
    speakResponse(welcome);
  }, 600);
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

    elements.callStatus.textContent = 'AI javob bermoqda...';
    addMessageToLog('ai', responseText);
    speakResponse(responseText);

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

// Call Gemini API (via REST or Google AI Studio SDK fallback)
async function queryGeminiAPI(userQuery) {
  // If API key is available, use real Gemini REST endpoint
  if (state.apiKey) {
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${state.apiKey}`;
    
    // Build context
    state.chatHistory.push({ role: 'user', parts: [{ text: userQuery }] });

    const contents = [
      {
        role: 'user',
        parts: [{ text: `System Instruction:\n${state.systemPrompt}\n\nMijoz savoli: ${userQuery}` }]
      }
    ];

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    const answer = data.candidates?.[0]?.content?.parts?.[0]?.text || "Tushundim, yana qanday savolingiz bor?";
    return answer;

  } else {
    // Intelligent Offline / Demo Rules Engine for Uzbek Call Center
    return generateDemoUzbekResponse(userQuery);
  }
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

// Text to Speech (TTS) Output
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
