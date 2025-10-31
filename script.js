/* script.js - MindMirror X frontend behavior
   - Replace API_BASE with your deployed FastAPI URL (Render)
   - Double-click anywhere to start voice recording (SpeechRecognition)
*/

const API_BASE = "https://REPLACE_WITH_YOUR_BACKEND_URL"; // <-- PUT your backend URL here, e.g. https://mindmirrorx.onrender.com

/* ---------- Simple DOM refs ---------- */
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

/* ---------- Local memories (localStorage) ---------- */
let memories = JSON.parse(localStorage.getItem('mmx_memories') || '[]');
function saveLocalMemories(){ localStorage.setItem('mmx_memories', JSON.stringify(memories)); renderMemories(); }
function renderMemories(){
  memNum.textContent = memories.length;
  if(!memories.length){ memList.innerHTML = '<div class="mem-item">No memories yet — reflect and save.</div>'; return; }
  memList.innerHTML = '';
  memories.slice().reverse().forEach(m=>{
    const el = document.createElement('div'); el.className='mem-item';
    el.innerHTML = `<div class="mem-text">${escapeHtml(m.text)}</div><div class="mem-info">${new Date(m.ts*1000).toLocaleString()} · score ${m.score}</div>`;
    memList.appendChild(el);
  });
}
function addMemoryLocal(text,score){
  memories.push({text,score,ts:Math.floor(Date.now()/1000)});
  saveLocalMemories();
}

/* ---------- small utils ---------- */
function escapeHtml(s){ return s.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;') }
function setStatus(t){ statusEl.textContent = t }

/* ---------- Voice recognition (double-click to start) ---------- */
window.SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
let recog;
if(window.SpeechRecognition){
  recog = new window.SpeechRecognition();
  recog.lang = 'en-US';
  recog.continuous = false;
  recog.interimResults = false;
  recog.onresult = (ev) => {
    const text = ev.results[0][0].transcript;
    txt.value = text;
    setStatus('Heard: ' + text);
    handleSend(text);
  };
  recog.onerror = (e)=> setStatus('Voice error');
  recog.onend = ()=> setStatus('idle');
} else {
  btnVoice.style.display = 'none';
  setStatus('Voice not supported');
}

/* start on double-click */
document.body.addEventListener('dblclick', ()=> {
  if(!recog){ setStatus('No voice support'); return; }
  setStatus('listening...');
  recog.start();
});

/* ---------- Button handlers ---------- */
btnSend.addEventListener('click', ()=> handleSend(txt.value.trim()));
btnVoice.addEventListener('click', ()=> { document.body.dispatchEvent(new Event('dblclick')); });

document.querySelectorAll('.quick-btn').forEach(b=>{
  b.addEventListener('click', ()=> { txt.value = b.dataset.sample; handleSend(b.dataset.sample); });
});

/* ---------- API call & UI update ---------- */
async function handleSend(text){
  if(!text){ setStatus('Type or speak something.'); return; }
  setStatus('analyzing...');
  try{
    // call backend
    const res = await fetch(API_BASE + '/analyze', {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({text})
    });
    const data = await res.json();
    if(!res.ok){ setStatus('Server error'); console.error(data); return; }
    updateUIFromAnalysis(data);
    // optionally save memory to backend (best-effort)
    fetch(API_BASE + '/memories', {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({text,score:data.score})}).catch(()=>{});
    addMemoryLocal(text, data.score);
  }catch(err){
    console.error(err);
    setStatus('Network error — saved locally');
    // fallback: very small local analysis mimic
    const fallbackScore = simpleLocalScore(text);
    const fallbackReply = fallbackScore>60 ? "Nice energy." : (fallbackScore>40 ? "Thanks for sharing." : "I'm here.");
    updateUIFromAnalysis({score:fallbackScore,color:'#8AD0FF',reply:fallbackReply});
    addMemoryLocal(text,fallbackScore);
  }
}

/* fallback local scoring (very small) */
function simpleLocalScore(t){
  const pos = ['happy','good','love','great','ok','fine','excited','hope','calm'];
  const neg = ['sad','tired','angry','anxious','lonely','hate','depressed'];
  let s=50;
  const w = t.toLowerCase();
  pos.forEach(p=>{ if(w.includes(p)) s+=8 });
  neg.forEach(n=>{ if(w.includes(n)) s-=8 });
  return Math.max(0,Math.min(100,s));
}

/* ---------- UI update after analysis ---------- */
function updateUIFromAnalysis({score,color,reply}){
  setStatus('reflected');
  replyEl.textContent = reply;
  animateBars(score);
  animatePulse(color, score);
  speakText(reply);
}

/* bars: positive/neutral/negative split */
function animateBars(score){
  // map score 0..100 => positive/neutral/negative proportions
  const pos = Math.max(0, score - 50) * 2; // 0..100
  const neg = Math.max(0, 50 - score) * 2;
  const neu = 100 - Math.max(pos,neg);
  barPos.style.width = Math.min(100,pos) + '%';
  barNeu.style.width = Math.max(0, Math.min(100,neu)) + '%';
  barNeg.style.width = Math.min(100,neg) + '%';
}

/* pulse visual */
function animatePulse(color, score){
  const pulseEl = document.getElementById('pulse');
  pulseEl.style.boxShadow = `0 0 ${Math.max(30, Math.round(score/2))}px ${color}`;
  pulseEl.animate([
    { transform: 'scale(0.98)', opacity: 0.85 },
    { transform: 'scale(1.06)', opacity: 1 }
  ], { duration: 900, easing: 'ease-in-out' });
}

/* ---------- speech reply (Web Speech API) ---------- */
function speakText(t){
  if(!('speechSynthesis' in window)) return;
  const u = new SpeechSynthesisUtterance(t);
  u.rate = 1; u.pitch = 1; u.lang = 'en-US';
  speechSynthesis.cancel();
  speechSynthesis.speak(u);
}

/* ---------- particle background & parallax (heavy but optimized) ---------- */
const canvas = document.getElementById('bg-canvas');
const ctx = canvas.getContext('2d');
let DPR = Math.max(1, window.devicePixelRatio || 1);
function resizeCanvas(){ canvas.width = innerWidth * DPR; canvas.height = innerHeight * DPR; canvas.style.width = innerWidth + 'px'; canvas.style.height = innerHeight + 'px'; ctx.scale(DPR,DPR); }
window.addEventListener('resize', ()=> { DPR = Math.max(1, window.devicePixelRatio || 1); resizeCanvas(); });
resizeCanvas();

const particles = [];
const PARTICLE_COUNT = Math.max(60, Math.min(160, Math.floor((innerWidth*innerHeight)/90000)));
for(let i=0;i<PARTICLE_COUNT;i++){
  particles.push({
    x: Math.random()*innerWidth,
    y: Math.random()*innerHeight,
    r: 0.6 + Math.random()*2.6,
    vx: (Math.random()-0.5)*0.3,
    vy: (Math.random()-0.5)*0.3,
    hue: 200 + Math.random()*120
  });
}

let mouse = {x:innerWidth/2,y:innerHeight/2};
window.addEventListener('mousemove', e => { mouse.x = e.clientX; mouse.y = e.clientY; });

function render() {
  // subtle gradient overlay
  ctx.clearRect(0,0,innerWidth,innerHeight);
  const g = ctx.createLinearGradient(0,0,innerWidth,innerHeight);
  g.addColorStop(0, 'rgba(6,12,24,0.18)');
  g.addColorStop(1, 'rgba(12,30,46,0.28)');
  ctx.fillStyle = g;
  ctx.fillRect(0,0,innerWidth,innerHeight);

  // draw connecting lines lightly
  for(let p of particles){
    // move
    p.x += p.vx + (mouse.x - p.x) * 0.0008;
    p.y += p.vy + (mouse.y - p.y) * 0.0008;
    if(p.x < -50) p.x = innerWidth + 50;
    if(p.x > innerWidth + 50) p.x = -50;
    if(p.y < -50) p.y = innerHeight + 50;
    if(p.y > innerHeight + 50) p.y = -50;

    // draw
    ctx.beginPath();
    const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r*10);
    gradient.addColorStop(0, 'rgba(167,139,250,0.14)');
    gradient.addColorStop(1, 'rgba(96,165,250,0.02)');
    ctx.fillStyle = gradient;
    ctx.arc(p.x, p.y, p.r, 0, Math.PI*2);
    ctx.fill();
  }

  // connect close particles
  for(let i=0;i<particles.length;i++){
    for(let j=i+1;j<particles.length;j++){
      const a = particles[i], b = particles[j];
      const dx = a.x-b.x, dy = a.y-b.y;
      const d = Math.sqrt(dx*dx + dy*dy);
      if(d < 120){
        ctx.beginPath();
        ctx.strokeStyle = `rgba(100,140,200,${(120-d)/220})`;
        ctx.lineWidth = 0.6;
        ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
      }
    }
  }
  requestAnimationFrame(render);
}
requestAnimationFrame(render);

/* ---------- small keyboard easter eggs ---------- */
let keyBuffer = '';
window.addEventListener('keydown', e => {
  keyBuffer += e.key.toLowerCase();
  if(keyBuffer.length > 12) keyBuffer = keyBuffer.slice(-12);

  if(keyBuffer.includes('matrix')){
    // full-screen matrix rain CRT effect (simple)
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

/* ---------- helpful: auto-demo when first time open ---------- */
if(!localStorage.getItem('mmx_seen_welcome')){
  localStorage.setItem('mmx_seen_welcome', '1');
  setTimeout(()=>{ txt.value = "Hi, I need a moment. Feeling a bit anxious."; handleSend(txt.value); }, 700);
}
