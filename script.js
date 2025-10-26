/* AURORA OS — script.js
   Full client-side. No APIs required.
   Features:
   - Boot progress + boot sound trigger
   - Three.js particle core (audio-reactive if mic allowed)
   - Voice recognition and speech synthesis
   - Chart.js simulated charts
   - Terminal logs, export logs, clear logs
   - Node map simulated & hover effects
   - Easter eggs (matrix, core overload, abhi)
   - Settings modal + saved preferences (localStorage)
   - Keyboard shortcuts (Alt+V voice, Alt+R reboot)
*/

/* ---------- DOM refs ---------- */
const refs = {
  bootScreen: document.getElementById('boot-screen'),
  bootProgress: document.getElementById('boot-progress'),
  app: document.getElementById('app'),
  voiceBtn: document.getElementById('voice-btn'),
  themeSelect: document.getElementById('theme-select'),
  settingsBtn: document.getElementById('settings-btn'),
  settingsModal: document.getElementById('settings-modal'),
  settingName: document.getElementById('setting-name'),
  settingIntensity: document.getElementById('setting-intensity'),
  saveSettings: document.getElementById('save-settings'),
  closeSettings: document.getElementById('close-settings'),
  coreMode: document.getElementById('core-mode'),
  voiceLevel: document.querySelector('#voice-level span'),
  cpuValue: document.getElementById('cpu-value'),
  ramValue: document.getElementById('ram-value'),
  aiValue: document.getElementById('ai-value'),
  cpuBar: document.getElementById('cpu-bar'),
  ramBar: document.getElementById('ram-bar'),
  aiBar: document.getElementById('ai-bar'),
  cpuChartEl: document.getElementById('cpuChart'),
  ramChartEl: document.getElementById('ramChart'),
  logEl: document.getElementById('log'),
  cmdInput: document.getElementById('cmd-input'),
  cmdSend: document.getElementById('cmd-send'),
  rebootBtn: document.getElementById('reboot-btn'),
  matrixBtn: document.getElementById('matrix-btn'),
  exportLogs: document.getElementById('export-logs'),
  clearLogs: document.getElementById('clear-logs'),
  nodeSvg: document.getElementById('node-svg'),
  bootSound: document.getElementById('boot-sound'),
  glitchSound: document.getElementById('glitch-sound'),
  ambientSound: document.getElementById('ambient-sound'),
  clock: document.getElementById('clock'),
  overlay: document.getElementById('visual-overlay'),
  settingsModalDialog: document.getElementById('settings-modal')
};

/* ---------- Utilities ---------- */
function savePref(key,val){ localStorage.setItem(key, JSON.stringify(val)); }
function loadPref(key,def){ try{ const v = JSON.parse(localStorage.getItem(key)); return v===null||v===undefined?def:v }catch(e){return def} }

/* ---------- Theme & Settings ---------- */
const defaultTheme = loadPref('aurora-theme', 'aurora');
document.body.classList.add('theme-'+defaultTheme);
refs.themeSelect.value = defaultTheme;
refs.themeSelect.addEventListener('change', e=>{
  const t = e.target.value; document.body.classList.remove('theme-aurora','theme-glass','theme-midnight','theme-ocean');
  document.body.classList.add('theme-'+t); savePref('aurora-theme', t);
});

const savedName = loadPref('aurora-name','');
refs.settingName.value = savedName;
refs.settingIntensity.value = loadPref('aurora-intensity',60);

refs.settingsBtn.addEventListener('click', ()=> openSettings());
refs.closeSettings.addEventListener('click', ()=> closeSettings());
refs.saveSettings && refs.saveSettings.addEventListener('click', ()=>{
  savePref('aurora-name', refs.settingName.value || '');
  savePref('aurora-intensity', Number(refs.settingIntensity.value || 60));
  transient('Settings saved');
  closeSettings();
});

function openSettings(){
  refs.settingsModal.setAttribute('aria-hidden','false');
  refs.settingsModal.style.display='flex';
}
function closeSettings(){
  refs.settingsModal.setAttribute('aria-hidden','true');
  refs.settingsModal.style.display='none';
}

/* ---------- Clock ---------- */
function tickClock(){ refs.clock.textContent = new Date().toLocaleString(); }
tickClock(); setInterval(tickClock,1000);

/* ---------- Boot sequence ---------- */
function startBoot(){
  refs.bootScreen.setAttribute('aria-hidden','false');
  refs.app.setAttribute('aria-hidden','true');
  let p=0;
  const id = setInterval(()=>{
    p += Math.random()*12;
    if(p>100) p=100;
    refs.bootProgress.style.width = p + '%';
    if(p>=100){
      clearInterval(id);
      setTimeout(()=> {
        refs.bootScreen.style.display='none';
        refs.bootScreen.setAttribute('aria-hidden','true');
        refs.app.style.display='block';
        refs.app.setAttribute('aria-hidden','false');
        transient('Aurora OS ready — Say "help" or press Alt+V for voice');
        speak('Aurora online. Welcome back.');
      }, 700);
    }
  }, 600);
}
// auto start boot
startBoot();

/* ---------- Logs ---------- */
let logs = [];
function pushLog(msg, level='info'){
  const time = new Date().toLocaleTimeString();
  logs.push({time,msg,level});
  const p = document.createElement('div'); p.className='log-line';
  p.textContent = `[${time}] ${msg}`;
  refs.logEl.appendChild(p);
  refs.logEl.scrollTop = refs.logEl.scrollHeight;
}
function exportLogs(){
  const blob = new Blob([JSON.stringify(logs, null, 2)], {type:'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = 'lucid-logs.json'; document.body.appendChild(a); a.click(); a.remove();
  URL.revokeObjectURL(url);
}
refs.exportLogs.addEventListener('click', ()=> { exportLogs(); transient('Logs exported'); });
refs.clearLogs.addEventListener('click', ()=> { logs=[]; refs.logEl.innerHTML=''; transient('Logs cleared'); });

/* ---------- Simulated metrics + charts ---------- */
const CHART_OPTS = { responsive:true, maintainAspectRatio:false, scales:{x:{display:false}, y:{min:0,max:100,ticks:{color:'#bcd'}}}, plugins:{legend:{display:false}} };
function mkChart(ctx,color){
  return new Chart(ctx, { type:'line', data:{labels:Array.from({length:40},(_,i)=>i), datasets:[{data:Array.from({length:40},()=>Math.random()*20+10), borderColor:color, backgroundColor:color+'22', fill:true, tension:0.35}] }, options:CHART_OPTS });
}
const accent = getComputedStyle(document.body).getPropertyValue('--accent1') || '#7b61ff';
const accent2 = getComputedStyle(document.body).getPropertyValue('--accent2') || '#5be0a8';
const cpuChart = mkChart(refs.cpuChartEl, accent.trim());
const ramChart = mkChart(refs.ramChartEl, accent2.trim());

function pushMetric(chart, val){
  chart.data.datasets[0].data.push(val);
  if(chart.data.datasets[0].data.length>80) chart.data.datasets[0].data.shift();
  chart.update('none');
}
function simulateMetrics(){
  const t = Date.now()/1000;
  const cpu = Math.round(10 + Math.abs(Math.sin(t*0.6))*80 * (0.6 + Math.random()*0.9));
  const ram = Math.round(15 + Math.abs(Math.cos(t*0.45))*75 * (0.6 + Math.random()*0.8));
  const ai = Math.round((cpu*0.55 + ram*0.45) * (0.75 + Math.random()*0.6));
  refs.cpuValue.textContent = cpu + '%';
  refs.ramValue.textContent = ram + '%';
  refs.aiValue.textContent = ai + '%';
  refs.cpuBar.style.width = cpu + '%';
  refs.ramBar.style.width = ram + '%';
  refs.aiBar.style.width = Math.min(100, ai) + '%';
  pushMetric(cpuChart, cpu); pushMetric(ramChart, ram);
}
simulateMetrics(); setInterval(simulateMetrics, 1200);

/* ---------- Node map (svg) ---------- */
const nodes = [
  {id:'us-east', x:60, y:40, status:'online'},
  {id:'eu-west', x:200, y:50, status:'online'},
  {id:'asia',   x:320, y:36, status:'online'},
  {id:'db-1',   x:180, y:100, status:'syncing'},
  {id:'cache',  x:80, y:110, status:'online'}
];
function renderNodeMap(){
  const s = refs.nodeSvg; s.innerHTML='';
  nodes.forEach(n=>{
    const g = document.createElementNS('http://www.w3.org/2000/svg','g');
    g.setAttribute('transform', `translate(${n.x},${n.y})`);
    g.style.cursor = 'pointer';
    const circle = document.createElementNS('http://www.w3.org/2000/svg','circle');
    circle.setAttribute('r','10');
    circle.setAttribute('fill', n.status==='online'? 'url(#grad1)' : n.status==='syncing'? '#f59e0b' : '#7f1d1d');
    const text = document.createElementNS('http://www.w3.org/2000/svg','text');
    text.setAttribute('x','18'); text.setAttribute('y','6'); text.setAttribute('font-size','11'); text.setAttribute('fill','#cfe6ff');
    text.textContent = n.id;
    g.appendChild(circle); g.appendChild(text);
    g.addEventListener('mouseenter', ()=> transient(`${n.id} — ${n.status}`));
    s.appendChild(g);
  });
  // defs gradient
  const defs = document.createElementNS('http://www.w3.org/2000/svg','defs');
  const grad = document.createElementNS('http://www.w3.org/2000/svg','linearGradient');
  grad.setAttribute('id','grad1'); grad.setAttribute('x1','0%'); grad.setAttribute('x2','100%');
  const stop1 = document.createElementNS('http://www.w3.org/2000/svg','stop'); stop1.setAttribute('offset','0%'); stop1.setAttribute('stop-color','#7b61ff');
  const stop2 = document.createElementNS('http://www.w3.org/2000/svg','stop'); stop2.setAttribute('offset','100%'); stop2.setAttribute('stop-color','#5be0a8');
  grad.appendChild(stop1); grad.appendChild(stop2); defs.appendChild(grad); s.prepend(defs);
}
renderNodeMap();

/* ---------- Terminal & Commands ---------- */
const initialMsgs = [
  "AURORA OS bootlog: OK",
  "Holo-UI ready",
  "Neural mesh synchronized",
  "Welcome, Abhi"
];
initialMsgs.forEach(m => pushLog(m));

function handleCommand(raw){
  const cmd = (raw||'').trim();
  if(!cmd) return;
  pushLog('> ' + cmd);
  const lc = cmd.toLowerCase();
  if(lc === 'help'){
    speak('Try: status, matrix, core, reboot, theme <name>, export logs, clear logs');
    pushLog('Commands: help, status, matrix, core, reboot, theme <name>, export logs, clear logs');
  } else if(lc === 'status' || lc === 'show status'){
    simulateMetrics();
    speak(`Status: CPU ${refs.cpuValue.textContent}, RAM ${refs.ramValue.textContent}`);
    pushLog('Status snapshot displayed');
  } else if(lc === 'matrix'){
    activateMatrix();
  } else if(lc === 'core'){
    activateCoreOverload();
  } else if(lc === 'reboot'){
    doRebootSequence();
  } else if(lc.startsWith('theme ')){
    const t = lc.split(' ')[1];
    refs.themeSelect.value = t; refs.themeSelect.dispatchEvent(new Event('change'));
    pushLog('Theme set to ' + t); speak('Theme changed to ' + t);
  } else if(lc === 'export logs'){
    exportLogs(); pushLog('Logs exported');
  } else if(lc === 'clear logs'){
    logs = []; refs.logEl.innerHTML=''; pushLog('Logs cleared');
  } else if(lc === 'abhi'){
    pushLog('Welcome back, creator Abhi.'); speak('Welcome back, creator Abhi.');
  } else {
    // creative reply
    const msg = procedural[Math.floor(Math.random()*procedural.length)];
    pushLog(msg); speak(msg);
  }
}
refs.cmdSend.addEventListener('click', ()=> { handleCommand(refs.cmdInput.value); refs.cmdInput.value=''; });
refs.cmdInput.addEventListener('keydown', (e)=> { if(e.key === 'Enter'){ handleCommand(refs.cmdInput.value); refs.cmdInput.value=''; }});
refs.rebootBtn.addEventListener('click', ()=> doRebootSequence());
refs.matrixBtn.addEventListener('click', ()=> activateMatrix());

/* simple procedural lines */
const procedural = [
  "Rebalancing visual queues…",
  "Smoothing gradients for display",
  "Updating holographic assets",
  "Optimizing particle field",
  "Clearing temp caches"
];

/* ---------- Export logs button wired above ---------- */
refs.exportLogs && refs.exportLogs.addEventListener('click', exportLogs);

/* ---------- Voice (recognition + synthesis) ---------- */
let recognition = null, listening = false;
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition || null;
if(SpeechRecognition){
  recognition = new SpeechRecognition();
  recognition.lang = 'en-US';
  recognition.interimResults = false;
  recognition.onstart = () => { listening=true; refs.voiceBtn.textContent='🎙️ Listening...'; refs.voiceBtn.setAttribute('aria-pressed','true'); refs.coreMode.textContent='Listening'; };
  recognition.onend = () => { listening=false; refs.voiceBtn.textContent='🎙️ Talk'; refs.voiceBtn.setAttribute('aria-pressed','false'); refs.coreMode.textContent='Idle'; };
  recognition.onerror = (e)=> { console.warn('speech err', e); listening=false; refs.voiceBtn.textContent='🎙️ Talk'; };
  recognition.onresult = (e) => {
    const txt = Array.from(e.results).map(r=>r[0].transcript).join(' ');
    pushLog('(voice) ' + txt);
    handleCommand(txt);
  };
}
refs.voiceBtn.addEventListener('click', ()=>{
  if(!recognition){ speak('Speech recognition not available in this browser.'); transient('Voice unsupported'); return; }
  if(listening) recognition.stop(); else recognition.start();
});
function speak(text, opts={}){
  if(!('speechSynthesis' in window)) return;
  const u = new SpeechSynthesisUtterance(text);
  u.rate = opts.rate || 1;
  u.pitch = opts.pitch || 1;
  u.lang = opts.lang || 'en-US';
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(u);
}

/* ---------- Reboot & special actions ---------- */
function doRebootSequence(){
  pushLog('Rebooting system...');
  speak('Rebooting Aurora. Stand by.');
  // visual: overlay flash + hide and re-show
  showGlitch(2400);
  setTimeout(()=> {
    transient('System rebooted');
    pushLog('Reboot complete');
    speak('System online');
  },2600);
}

/* ---------- Matrix mode ---------- */
let matrixInterval = null;
function activateMatrix(duration=7000){
  if(matrixInterval) return;
  const overlay = document.createElement('div'); overlay.className = 'matrix-rain';
  document.body.appendChild(overlay);
  matrixInterval = setInterval(()=> {
    const col = document.createElement('div'); col.style.left = Math.random()*100 + 'vw'; col.style.top='-20vh';
    col.style.position='absolute';
    col.style.fontSize = (8 + Math.random()*20) + 'px';
    const len = 10 + Math.floor(Math.random()*40);
    for(let i=0;i<len;i++){
      const s = document.createElement('div'); s.className='matrix-char'; s.style.top = (i*18)+'px';
      s.textContent = Math.random()>0.5? '01' : '10';
      col.appendChild(s);
    }
    overlay.appendChild(col);
    setTimeout(()=> col.remove(), 6500);
  }, 80);
  pushLog('Matrix mode engaged'); speak('Matrix mode engaged');
  setTimeout(()=> {
    clearInterval(matrixInterval); matrixInterval = null; overlay.remove();
    pushLog('Matrix mode disabled'); speak('Matrix disengaged');
  }, duration);
}

/* ---------- core overload ---------- */
function activateCoreOverload(){
  pushLog('CORE OVERLOAD!');
  speak('Warning. Core overload.');
  document.body.style.transition='background 0.6s';
  document.body.style.background = 'linear-gradient(180deg,#2b0000,#0b0710)';
  const o = document.createElement('div'); o.style.position='fixed'; o.style.inset=0; o.style.zIndex=99999; o.style.background='rgba(255,0,0,0.06)';
  document.body.appendChild(o);
  setTimeout(()=> { o.remove(); document.body.style.background=''; pushLog('Core stabilized'); speak('Core stabilized'); }, 3000);
}

/* glitch */
function showGlitch(ms=1200){
  const g = document.createElement('div'); g.style.position='fixed'; g.style.inset=0; g.style.zIndex=99999; g.style.background='linear-gradient(90deg, rgba(255,255,255,0.03), rgba(255,0,80,0.02))'; g.style.mixBlendMode='screen';
  document.body.appendChild(g);
  setTimeout(()=> g.remove(), ms);
}

/* ---------- Transient messages ---------- */
function transient(text, duration=2800){
  const el = document.createElement('div'); el.className='transient-message glass'; el.textContent=text;
  document.body.appendChild(el);
  gsap.fromTo(el, {y:-6, opacity:0},{y:0, opacity:1, duration:0.25});
  setTimeout(()=> gsap.to(el,{opacity:0, duration:0.45, onComplete:()=>el.remove()}), duration);
}

/* ---------- Audio input for visuals ---------- */
let audioAnalyser = null, audioData = null;
async function initAudioReactive(){
  try{
    const stream = await navigator.mediaDevices.getUserMedia({audio:true});
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const src = ctx.createMediaStreamSource(stream);
    audioAnalyser = ctx.createAnalyser(); audioAnalyser.fftSize = 128;
    src.connect(audioAnalyser);
    audioData = new Uint8Array(audioAnalyser.frequencyBinCount);
    pushLog('Audio reactive enabled');
  }catch(e){
    pushLog('Audio capture not available (permission denied or unsupported)');
  }
}
// try to connect but silent failure allowed
initAudioReactive();

/* ---------- Three.js core (particle sphere) ---------- */
const canvas = document.getElementById('three-canvas');
const renderer = new THREE.WebGLRenderer({canvas, antialias:true, alpha:true});
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
function resizeRenderer(){
  const parent = canvas.parentElement;
  const w = parent.clientWidth, h = parent.clientHeight;
  renderer.setSize(w, h, false);
}
resizeRenderer();
window.addEventListener('resize', resizeRenderer);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(50, canvas.clientWidth / canvas.clientHeight, 0.1, 2000);
camera.position.z = 120;

const ambient = new THREE.AmbientLight(0xffffff, 0.6); scene.add(ambient);
const dir = new THREE.DirectionalLight(0xffffff, 0.7); dir.position.set(0,1,1); scene.add(dir);

// particles
const particleCount = 2400;
const positions = new Float32Array(particleCount*3);
const colors = new Float32Array(particleCount*3);
for(let i=0;i<particleCount;i++){
  const theta = Math.acos(2*Math.random()-1), phi = 2*Math.PI*Math.random();
  const r = 20 + Math.random()*20;
  positions[i*3] = r * Math.sin(theta)*Math.cos(phi);
  positions[i*3+1] = r * Math.sin(theta)*Math.sin(phi);
  positions[i*3+2] = r * Math.cos(theta);
  const c = new THREE.Color().setHSL(0.6 + Math.random()*0.15, 0.6, 0.5);
  colors[i*3] = c.r; colors[i*3+1] = c.g; colors[i*3+2] = c.b;
}
const geometry = new THREE.BufferGeometry();
geometry.setAttribute('position', new THREE.BufferAttribute(positions,3));
geometry.setAttribute('color', new THREE.BufferAttribute(colors,3));
const material = new THREE.PointsMaterial({ size:1.5, vertexColors:true, transparent:true, opacity:0.95, depthWrite:false });
const particles = new THREE.Points(geometry, material);
scene.add(particles);

// halo
const sprite = new THREE.TextureLoader().load('https://cdn.jsdelivr.net/gh/elibom/ci@main/glow.png');
const spriteMat = new THREE.SpriteMaterial({ map: sprite, color: 0xffffff, transparent:true, opacity:0.03 });
const halo = new THREE.Sprite(spriteMat); halo.scale.set(700,700,1); scene.add(halo);

// animate
let t = 0;
function animate(){
  t += 0.01;
  particles.rotation.y += 0.0025;
  particles.rotation.x = Math.sin(t*0.12) * 0.02;
  // audio-reactive amplitude
  let amp = 0.3;
  if(audioAnalyser){
    audioAnalyser.getByteFrequencyData(audioData);
    const sum = audioData.reduce((a,b)=>a+b,0);
    amp = Math.min(1.8, (sum/(audioData.length*255))*3 + 0.2);
    refs.voiceLevel.style.width = Math.min(100, amp*60) + '%';
  }
  const pos = geometry.attributes.position.array;
  for(let i=0;i<particleCount;i++){
    const idx = i*3;
    const s = 1 + Math.sin(t + i*0.01) * 0.04 * amp;
    pos[idx] *= s; pos[idx+1] *= s; pos[idx+2] *= s;
  }
  geometry.attributes.position.needsUpdate = true;
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}
animate();

/* ---------- keyboard shortcuts ---------- */
window.addEventListener('keydown', (e)=>{
  if(e.altKey && e.key.toLowerCase()==='v'){ // Alt+V
    refs.voiceBtn.click();
  }
  if(e.altKey && e.key.toLowerCase()==='r'){ // Alt+R
    doRebootSequence();
  }
});

/* ---------- small helpers & expose ---------- */
window.aurora = { speak, pushLog, activateMatrix, activateCoreOverload, doRebootSequence };

/* ---------- final tweaks: set uptime + name personalization ---------- */
function updateUptime(){
  const start = loadPref('aurora-start', Date.now());
  savePref('aurora-start', start);
  const elapsed = Date.now() - start;
  const hrs = Math.floor(elapsed / 3600000);
  document.getElementById('uptime').textContent = `Uptime: ${hrs} hrs`;
}
updateUptime(); setInterval(updateUptime, 60000);

/* ---------- initial info ---------- */
pushLog('Aurora interface booted — no external API required');
pushLog('Voice: press Alt+V or click talk');
