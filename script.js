// script.js — MindMirror X (fixed & improved)
// Backend (Render)
const API_BASE = "https://mindmirrorx-backend.onrender.com"; // <- your Render URL

/* ---------- DOM refs ---------- */
const txt = document.getElementById('txtInput');
const btnSend = document.getElementById('btnSend');
const btnVoice = document.getElementById('btnVoice');
const statusEl = document.getElementById('status');
const replyEl = document.getElementById('reply');
const memList = document.getElementById('mem-list');
const memNum = document.getElementById('memnum');
const barPos = document.querySelector('#bar-positive .bar-fill');
const barNeu = document.querySelector('#bar-neutral .bar-fill');
const barNeg = document.querySelector('#bar-negative .bar-fill');

/* ---------- Local memories ---------- */
let memories = JSON.parse(localStorage.getItem('mmx_memories') || '[]');
function saveLocalMemories(){ localStorage.setItem('mmx_memories', JSON.stringify(memories)); renderMemories(); }
function renderMemories(){
  memNum.textContent = memories.length;
  if(!memories.length){
    memList.innerHTML = '<div class="mem-item">No memories yet — reflect and save.</div>';
    return;
  }
  memList.innerHTML = '';
  memories.slice().reverse().forEach(m=>{
    const el = document.createElement('div'); el.className='mem-item';
    el.innerHTML = `<div class="mem-text">${escapeHtml(m.text)}</div>
                    <div class="mem-info">${new Date(m.ts*1000).toLocaleString()} · score ${m.score}</div>`;
    memList.appendChild(el);
  });
}
function addMemoryLocal(text,score){
  memories.push({text,score,ts:Math.floor(Date.now()/1000)});
  saveLocalMemories();
}

/* ---------- small utils ---------- */
function escapeHtml(s){ return String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;') }
function setStatus(t){ statusEl.textContent = t }

/* ---------- Speech Recognition (robust) ---------- */
window.SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
let recog = null;
let isListening = false;

function initRecognition(){
  if(!window.SpeechRecognition) {
    btnVoice.style.display = 'none';
    setStatus('Voice not supported');
    return;
  }

  try {
    recog = new window.SpeechRecognition();
    recog.lang = 'en-US';
    recog.continuous = false;
    recog.interimResults = false;

    recog.onstart = () => {
      isListening = true;
      setStatus('🎤 listening...');
      btnVoice.classList?.add('listening');
    };

    recog.onend = () => {
      isListening = false;
      setStatus('idle');
      btnVoice.classList?.remove('listening');
    };

    recog.onerror = (e) => {
      // common errors: 'not-allowed' (permission), 'no-speech'
      console.warn('recognition error', e);
      if(e && e.error === 'not-allowed') setStatus('Microphone permission denied');
      else setStatus('Voice error');
      isListening = false;
      btnVoice.classList?.remove('listening');
    };

    recog.onresult = (ev) => {
      try {
        const text = ev.results[0][0].transcript;
        txt.value = text;
        setStatus('Heard: ' + text);
        // slight delay to ensure UI update before heavy processing
        setTimeout(()=> handleSend(text), 150);
      } catch (err) {
        console.error('onresult parse error', err);
        setStatus('Voice parse error');
      }
    };

  } catch(err){
    console.error('initRecognition error', err);
    btnVoice.style.display = 'none';
    setStatus('Voice init failed');
  }
}
initRecognition();

/* Start recognition safely */
async function startListening(){
  if(!recog) { setStatus('No voice support'); return; }
  if(isListening) {
    // already listening — do nothing or restart
    try { recog.stop(); } catch(e){}
    return;
  }
  try {
    // user gesture is needed on some mobile/desktop; ensure focus
    await new Promise((resolve) => setTimeout(resolve, 0));
    recog.start();
  } catch(err) {
    console.warn('recog.start error', err);
    setStatus('Cannot start microphone');
  }
}

/* Start on double-click anywhere */
document.body.addEventListener('dblclick', ()=> startListening());
btnVoice.addEventListener('click', ()=> startListening());

/* ---------- Button handlers ---------- */
btnSend.addEventListener('click', ()=> handleSend(txt.value.trim()));
document.querySelectorAll('.quick-btn').forEach(b=>{
  b.addEventListener('click', ()=> { txt.value = b.dataset.sample; handleSend(b.dataset.sample); });
});

/* ---------- Fallback local scoring ---------- */
function simpleLocalScore(t){
  const pos = ['happy','good','love','great','ok','fine','excited','hope','calm','optimistic','joy'];
  const neg = ['sad','tired','angry','anxious','lonely','hate','depressed','down'];
  let s=50;
  const w = (t||'').toLowerCase();
  pos.forEach(p=>{ if(w.includes(p)) s+=8 });
  neg.forEach(n=>{ if(w.includes(n)) s-=8 });
  return Math.max(0,Math.min(100,s));
}

/* ---------- Handle send / call backend ---------- */
let pendingRequest = null;
async function handleSend(text){
  if(!text){ setStatus('Type or speak something.'); return; }
  setStatus('analyzing...');
  replyEl.textContent = 'Reflecting...';

  // abort previous request if still pending
  if(pendingRequest && pendingRequest.abort) pendingRequest.abort();

  // create abort controller
  const ac = new AbortController();
  pendingRequest = ac;

  try {
    const res = await fetch(API_BASE + '/analyze', {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({text}),
      signal: ac.signal,
    });

    if(!res.ok){
      const txtErr = await res.text().catch(()=>null);
      console.error('Server responded non-OK', res.status, txtErr);
      setStatus('Server error');
      // fallback local behavior
      const fallbackScore = simpleLocalScore(text);
      const fallbackReply = fallbackScore>60 ? "Nice energy." : (fallbackScore>40 ? "Thanks for sharing." : "I'm here for you.");
      updateUIFromAnalysis({score:fallbackScore, color:'#8AD0FF', reply: fallbackReply});
      addMemoryLocal(text, fallbackScore);
      return;
    }

    const data = await res.json();
    // expected { score: number, color: '#hex', reply: '...' } or compatible
    updateUIFromAnalysis(data);
    // fire-and-forget memory save
    fetch(API_BASE + '/memories', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({text, score: data.score})
    }).catch(()=>{});
    addMemoryLocal(text, data.score);

  } catch(err) {
    console.error('Network/fetch error', err);
    setStatus('Network error — using local analysis');
    // fallback local analysis
    const fallbackScore = simpleLocalScore(text);
    const fallbackReply = fallbackScore>60 ? "Nice energy." : (fallbackScore>40 ? "Thanks for sharing." : "I'm here for you.");
    updateUIFromAnalysis({score:fallbackScore, color:'#8AD0FF', reply: fallbackReply});
    addMemoryLocal(text, fallbackScore);
  } finally {
    pendingRequest = null;
  }
}

/* ---------- UI update after analysis ---------- */
function updateUIFromAnalysis({score=50,color='#8AD0FF',reply='Thanks for sharing.'}={}){
  setStatus('reflected');
  replyEl.textContent = reply;
  animateBars(score);
  animatePulse(color, score);
  speakText(reply);
}

/* bars: positive/neutral/negative */
function animateBars(score){
  const pos = Math.max(0, score - 50) * 2;
  const neg = Math.max(0, 50 - score) * 2;
  const neu = 100 - Math.max(pos,neg);
  barPos.style.width = Math.min(100,pos) + '%';
  barNeu.style.width = Math.max(0, Math.min(100,neu)) + '%';
  barNeg.style.width = Math.min(100,neg) + '%';
}
function animatePulse(color, score){
  const pulseEl = document.getElementById('pulse');
  pulseEl.style.boxShadow = `0 0 ${Math.max(30, Math.round(score/2))}px ${color}`;
  try {
    pulseEl.animate([{ transform: 'scale(0.98)', opacity: 0.85 }, { transform: 'scale(1.06)', opacity: 1 }], { duration: 900, easing: 'ease-in-out' });
  } catch(e){}
}

/* ---------- speech reply ---------- */
function speakText(t){
  if(!('speechSynthesis' in window)) return;
  if(!t) return;
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(String(t));
  u.rate = 1; u.pitch = 1; u.lang = 'en-US';
  // ensure utterance doesn't throw on some browsers
  try { speechSynthesis.speak(u); } catch(e){ console.warn('TTS error', e); }
}

/* ---------- Particle background (fixed DPI & resize) ---------- */
const canvas = document.getElementById('bg-canvas');
const ctx = canvas.getContext('2d');
let DPR = Math.max(1, window.devicePixelRatio || 1);
let W = innerWidth, H = innerHeight;
let particles = [];
let PARTICLE_COUNT = Math.max(60, Math.min(160, Math.floor((W*H)/90000)));

function setupCanvas(){
  DPR = Math.max(1, window.devicePixelRatio || 1);
  W = innerWidth; H = innerHeight;
  canvas.width = Math.floor(W * DPR);
  canvas.height = Math.floor(H * DPR);
  canvas.style.width = W + 'px';
  canvas.style.height = H + 'px';
  // reset any transform, then set correct scale
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
}

function createParticles(){
  PARTICLE_COUNT = Math.max(60, Math.min(160, Math.floor((W*H)/90000)));
  particles = [];
  for(let i=0;i<PARTICLE_COUNT;i++){
    particles.push({
      x: Math.random()*W,
      y: Math.random()*H,
      r: 0.6 + Math.random()*2.6,
      vx: (Math.random()-0.5)*0.35,
      vy: (Math.random()-0.5)*0.35,
      hue: 200 + Math.random()*120
    });
  }
}

function onResize(){
  setupCanvas();
  createParticles();
}
window.addEventListener('resize', ()=> { onResize(); });

setupCanvas();
createParticles();

let mouse = {x: W/2, y: H/2};
window.addEventListener('mousemove', e => { mouse.x = e.clientX; mouse.y = e.clientY; });

function render(){
  // clear with subtle gradient
  ctx.clearRect(0,0,W,H);
  const g = ctx.createLinearGradient(0,0,W,H);
  g.addColorStop(0, 'rgba(6,12,24,0.16)');
  g.addColorStop(1, 'rgba(12,30,46,0.28)');
  ctx.fillStyle = g;
  ctx.fillRect(0,0,W,H);

  // particles
  for(let p of particles){
    p.x += p.vx + (mouse.x - p.x) * 0.0009;
    p.y += p.vy + (mouse.y - p.y) * 0.0009;
    if(p.x < -50) p.x = W + 50;
    if(p.x > W + 50) p.x = -50;
    if(p.y < -50) p.y = H + 50;
    if(p.y > H + 50) p.y = -50;

    ctx.beginPath();
    const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r*10);
    grad.addColorStop(0, 'rgba(167,139,250,0.16)');
    grad.addColorStop(1, 'rgba(96,165,250,0.02)');
    ctx.fillStyle = grad;
    ctx.arc(p.x, p.y, p.r, 0, Math.PI*2);
    ctx.fill();
  }

  // simple connection lines with distance threshold
  const maxDist = 110;
  for(let i=0;i<particles.length;i++){
    const a = particles[i];
    // only check next N neighbors to reduce O(n^2) cost on big counts
    for(let j=i+1, limit = Math.min(particles.length, i+40); j<limit; j++){
      const b = particles[j];
      const dx = a.x-b.x, dy = a.y-b.y;
      const d2 = dx*dx + dy*dy;
      if(d2 < maxDist*maxDist){
        const d = Math.sqrt(d2);
        ctx.beginPath();
        ctx.strokeStyle = `rgba(100,140,200,${(maxDist - d)/maxDist * 0.45})`;
        ctx.lineWidth = 0.6;
        ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
      }
    }
  }

  requestAnimationFrame(render);
}
requestAnimationFrame(render);

/* ---------- keyboard easter eggs ---------- */
let keyBuffer = '';
window.addEventListener('keydown', e => {
  keyBuffer += e.key.toLowerCase();
  if(keyBuffer.length > 14) keyBuffer = keyBuffer.slice(-14);

  if(keyBuffer.includes('matrix')){
    triggerMatrixEffect();
    keyBuffer = '';
  } else if(keyBuffer.includes('abhi')){
    speakText('System initialized by Abhi.');
    keyBuffer = '';
  }
});

/* Matrix effect (brief) */
function triggerMatrixEffect(){
  const overlay = document.createElement('canvas');
  overlay.style.position='fixed'; overlay.style.inset=0; overlay.style.zIndex=5000;
  const ctx2 = overlay.getContext('2d');
  document.body.appendChild(overlay);
  overlay.width = innerWidth; overlay.height = innerHeight;
  const cols = Math.floor(innerWidth/14);
  const drops = Array(cols).fill(0);
  const interval = setInterval(()=>{
    ctx2.fillStyle = 'rgba(0,0,0,0.08)'; ctx2.fillRect(0,0,overlay.width,overlay.height);
    ctx2.fillStyle = '#0f0'; ctx2.font='14px monospace';
    for(let i=0;i<cols;i++){
      const text = String.fromCharCode(33+Math.random()*94);
      ctx2.fillText(text, i*14, drops[i]*14);
      if(drops[i]*14 > overlay.height && Math.random() > 0.975) drops[i] = 0;
      drops[i]++;
    }
  },50);
  setTimeout(()=>{ clearInterval(interval); overlay.remove(); }, 3500);
}

/* ---------- init ---------- */
renderMemories();
setStatus('ready');

/* ---------- auto-demo on first load ---------- */
if(!localStorage.getItem('mmx_seen_welcome')){
  localStorage.setItem('mmx_seen_welcome', '1');
  setTimeout(()=>{ txt.value = "Hi, I need a moment. Feeling a bit anxious."; handleSend(txt.value); }, 900);
}
