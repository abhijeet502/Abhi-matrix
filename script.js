// ==== Utilities ====
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

// ====== Particle background (canvas) ======
(() => {
  const canvas = document.getElementById('particles-canvas');
  const ctx = canvas.getContext('2d');
  let w = canvas.width = innerWidth;
  let h = canvas.height = innerHeight;
  const particles = [];
  const particleCount = Math.max(20, Math.floor((w*h)/80000));

  function rand(min,max){return Math.random()*(max-min)+min}

  function resize(){ w = canvas.width = innerWidth; h = canvas.height = innerHeight; }
  addEventListener('resize',resize);

  class P {
    constructor(){
      this.x = Math.random()*w;
      this.y = Math.random()*h;
      this.vx = rand(-0.15,0.15);
      this.vy = rand(-0.35,0.35);
      this.r = rand(0.6,2.2);
      this.life = rand(60,240);
      this.h = Math.floor(rand(170,300));
    }
    step(){
      this.x += this.vx;
      this.y += this.vy;
      this.life--;
      if(this.x< -20) this.x = w+20;
      if(this.x> w+20) this.x = -20;
      if(this.y< -20) this.y = h+20;
      if(this.y> h+20) this.y = -20;
      if(this.life<=0){ this.x = Math.random()*w; this.y = h+20; this.life = rand(60,240); }
    }
    draw(){
      ctx.beginPath();
      ctx.fillStyle = `hsla(${this.h},80%,60%,${0.06+this.r/6})`;
      ctx.arc(this.x,this.y,this.r,0,Math.PI*2);
      ctx.fill();
    }
  }

  for(let i=0;i<particleCount;i++) particles.push(new P());

  function loop(){
    ctx.clearRect(0,0,w,h);
    const g = ctx.createLinearGradient(0,0,w,h);
    g.addColorStop(0,'rgba(20,28,41,0.05)');
    g.addColorStop(1,'rgba(8,12,18,0.08)');
    ctx.fillStyle = g;
    ctx.fillRect(0,0,w,h);

    ctx.strokeStyle = 'rgba(60,180,220,0.03)';
    ctx.lineWidth = 1;
    for(let x=0;x<w;x+=80){
      ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,h); ctx.stroke();
    }
    for(let y=0;y<h;y+=80){
      ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(w,y); ctx.stroke();
    }

    particles.forEach(p => { p.step(); p.draw(); });

    requestAnimationFrame(loop);
  }
  loop();
})();

// ====== UI: clock + uptime + simulated load ======
let startTime = Date.now();
const clockEl = $('#sys-clock');
const uptimeEl = $('#uptime');
const loadEl = $('#load');

function formatUptime(ms){
  const s = Math.floor(ms/1000);
  const days = Math.floor(s/86400); const hrs = Math.floor((s%86400)/3600); const mins = Math.floor((s%3600)/60);
  return `${days}d ${hrs}h ${mins}m`;
}
function tickClock(){
  const now = new Date();
  clockEl.textContent = now.toLocaleTimeString();
  uptimeEl.textContent = formatUptime(Date.now()-startTime);
  const load = (Math.random()*2.2).toFixed(2);
  loadEl.textContent = load;
}
setInterval(tickClock,1000);
tickClock();

// ====== Fake metrics (Chart.js) ======
const ctx = document.getElementById('cpuChart').getContext('2d');
const labels = Array.from({length:30},(_,i)=>`-${30-i}s`);
const data = {
  labels,
  datasets: [
    {
      label: 'CPU %',
      data: labels.map(()=>Math.random()*40+10),
      borderWidth: 2,
      tension: 0.35,
      borderColor: 'rgba(56,189,248,0.95)',
      backgroundColor: 'rgba(56,189,248,0.07)',
      pointRadius:0
    },
    {
      label: 'Network kb/s',
      data: labels.map(()=>Math.random()*200+10),
      borderColor: 'rgba(167,139,250,0.9)',
      backgroundColor: 'rgba(167,139,250,0.04)',
      tension:0.35,
      pointRadius:0
    }
  ]
};
const chart = new Chart(ctx, {
  type: 'line',
  data,
  options: {
    animation:false,
    responsive:true,
    plugins:{ legend:{ display:true, labels:{color:'#cfeeff'} } },
    scales: {
      x:{ ticks:{ color:'#9fbfd6' }, grid:{ display:false } },
      y:{ ticks:{ color:'#9fbfd6' }, grid:{ color:'rgba(255,255,255,0.02)' } }
    }
  }
});

setInterval(()=>{
  chart.data.labels.push(new Date().toLocaleTimeString().split(' ')[0].replace(/:d+$/,''));
  chart.data.labels.shift();
  chart.data.datasets[0].data.push(Math.max(5, Math.min(95, (chart.data.datasets[0].data.at(-1) || 30) + (Math.random()-0.5)*12)));
  chart.data.datasets[0].data.shift();
  chart.data.datasets[1].data.push(Math.max(2, Math.abs((chart.data.datasets[1].data.at(-1) || 40) + (Math.random()-0.5)*120)));
  chart.data.datasets[1].data.shift();
  chart.update('none');
  $('#mem-value').textContent = `${Math.floor(Math.random()*70+15)}%`;
  $('#net-value').textContent = `${Math.floor(Math.random()*900)} kb/s`;
  $('#db-value').textContent = `${Math.floor(Math.random()*200)} i/s`;
}, 1200);

// ====== Activity logs (typewriter like) ======
const logsEl = $('#logs');
const sampleActions = [
  "auth: user@example.com logged in",
  "service: cache warmed (hit 92%)",
  "deploy: staging build #213 succeeded",
  "db: replica sync completed (12ms)",
  "net: new connection from 203.0.113.5",
  "scheduler: job 'backup' queued",
  "ai: inference latency 58ms",
  "cache: eviction policy triggered 3 keys",
  "io: disk write 42MB/s"
];
function appendLog(text, level='info'){
  const el = document.createElement('div');
  const t = new Date().toLocaleTimeString();
  el.textContent = `[${t}] ${text}`;
  el.style.opacity = 0;
  el.style.transition = 'opacity 0.25s';
  logsEl.prepend(el);
  setTimeout(()=>el.style.opacity=1,30);
  while(logsEl.children.length > 80) logsEl.removeChild(logsEl.lastChild);
}
setInterval(()=> appendLog(sampleActions[Math.floor(Math.random()*sampleActions.length)]), 1400);

$('#btn-refresh').addEventListener('click', () => {
  appendLog('manual: metrics refreshed by user');
  document.querySelectorAll('.panel').forEach(p => p.animate([{transform:'scale(1)'},{transform:'scale(1.01)'},{transform:'scale(1)'}], {duration:380, easing:'ease-out'}));
});

let simOn = true;
$('#btn-simulate').addEventListener('click', () => {
  simOn = !simOn;
  $('#btn-simulate').textContent = simOn ? 'Toggle simulation (on)' : 'Toggle simulation (off)';
  appendLog(`simulation ${simOn ? 'resumed' : 'paused'}`);
});

// ====== Keyboard Easter eggs ======
let keyBuffer = '';
const triggers = {
  'matrix': () => {
    showMatrix();
    appendLog('easter: matrix rain activated');
  },
  'core': () => {
    showCore();
    appendLog('easter: core overload activated');
  },
  'abhi': () => {
    showAbhi();
    appendLog('easter: abhi greeting triggered');
  }
};
addEventListener('keydown', (e) => {
  if(e.key.length === 1) {
    keyBuffer += e.key.toLowerCase();
    if(keyBuffer.length > 12) keyBuffer = keyBuffer.slice(-12);
    Object.keys(triggers).forEach(k => { if(keyBuffer.endsWith(k)) triggers[k](); });
  } else if(e.key === 'Escape') {
    hideAllEaster();
  }
});

// ====== MATRIX RAIN overlay ======
function showMatrix(){
  hideAllEaster();
  const overlay = $('#matrix-overlay');
  overlay.classList.remove('hidden');
  overlay.innerHTML = '<canvas id="matrix-canvas"></canvas>';
  const c = overlay.querySelector('canvas');
  c.width = innerWidth; c.height = innerHeight;
  const ctx = c.getContext('2d');
  const cols = Math.floor(c.width/14);
  const drops = Array(cols).fill(0);

  function draw(){
    ctx.fillStyle = 'rgba(0,0,0,0.06)';
    ctx.fillRect(0,0,c.width,c.height);
    ctx.fillStyle = '#00ff41';
    ctx.font = '13px monospace';
    for(let i=0;i<cols;i++){
      const text = String.fromCharCode(0x30A0 + Math.random()*96);
      ctx.fillText(text, i*14, drops[i]*14);
      if(drops[i]*14 > c.height && Math.random()>0.975) drops[i]=0;
      drops[i]++;
    }
    if(!overlay.classList.contains('hidden')) requestAnimationFrame(draw);
  }
  draw();
  setTimeout(()=> overlay.classList.add('hidden'),9000);
}

// ===== CORE overlay =====
function showCore(){
  hideAllEaster();
  const overlay = $('#core-overlay');
  overlay.classList.remove('hidden');
  setTimeout(()=>overlay.classList.add('hidden'), 7000);
}

// ENSURE THE CLOSE BUTTON WORKS
document.addEventListener('DOMContentLoaded', function () {
  const closeBtn = document.getElementById('close-core');
  if (closeBtn) {
    closeBtn.addEventListener('click', function () {
      document.getElementById('core-overlay').classList.add('hidden');
    });
  }
});

// ===== ABHI toast (speech) =====
function showAbhi(){
  hideAllEaster();
  const t = $('#abhi-toast');
  t.classList.remove('hidden');
  try{
    const msg = new SpeechSynthesisUtterance("Hello — system initialized by Abhi. Nice to meet you.");
    msg.pitch = 1.1; msg.rate=0.95; window.speechSynthesis.speak(msg);
  }catch(e){}
  setTimeout(()=> t.classList.add('hidden'),4500);
}

function hideAllEaster(){
  $('#matrix-overlay').classList.add('hidden');
  $('#core-overlay').classList.add('hidden');
  $('#abhi-toast').classList.add('hidden');
  const mc = $('#matrix-overlay canvas');
  if(mc) mc.remove();
}

// ====== Initialization banner ======
(function initSequence(){
  appendLog('system: initializing PulseMatrix Aurora engine');
  appendLog('system: loading telemetry modules');
  appendLog('system: initializing chart stream');
  setTimeout(()=> appendLog('system: startup complete'), 1600);
})();

$('#year').textContent = new Date().getFullYear();
addEventListener('resize', () => {
  const c = document.getElementById('particles-canvas');
  c.width = innerWidth; c.height = innerHeight;
});
