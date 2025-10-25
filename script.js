// script.js — main app logic: time, commands, voice, easter eggs, worker
document.addEventListener('DOMContentLoaded', ()=> {
  // small helper sounds (WebAudio)
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  const audio = AudioCtx ? new AudioCtx() : null;
  function ping(freq=880, t=0.06){
    if(!audio) return;
    const o = audio.createOscillator(); const g = audio.createGain();
    o.type='sine'; o.frequency.value=freq; g.gain.value=0.0001;
    o.connect(g); g.connect(audio.destination);
    o.start();
    g.gain.exponentialRampToValueAtTime(0.12, audio.currentTime + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, audio.currentTime + t + 0.01);
    setTimeout(()=>{ o.stop(); }, (t+0.02)*1000);
  }

  // year
  document.getElementById('year').textContent = new Date().getFullYear();

  // clock, uptime, load
  const clock = document.getElementById('clock'), uptime = document.getElementById('uptime'), loadEl = document.getElementById('load');
  const start = Date.now();
  function formatUptime(ms){
    const s = Math.floor(ms/1000); const d = Math.floor(s/86400); const h = Math.floor((s%86400)/3600); const m = Math.floor((s%3600)/60);
    return `${d}d ${h}h ${m}m`;
  }
  setInterval(()=>{ const now=new Date(); clock.textContent = now.toLocaleTimeString(); uptime.textContent = formatUptime(Date.now()-start); loadEl.textContent = (Math.random()*2.8).toFixed(2); }, 1000);

  // init charts
  if(window.initCharts) window.initCharts();
  if(window.addLog) window.addLog('system: PulseMatrix X advanced online');

  // elements
  const cmdInput = document.getElementById('cmdInput'), cmdRun = document.getElementById('cmdRun');
  const matrixOverlay = document.getElementById('matrixOverlay'), coreOverlay = document.getElementById('coreOverlay'), abhiToast = document.getElementById('abhiToast');
  const voiceBtn = document.getElementById('voiceStart'), voiceStatus = document.getElementById('voiceStatus');
  const btnWorker = document.getElementById('btnWorker');

  // voice recognition (Web Speech API)
  let recognition = null, listening=false;
  if('webkitSpeechRecognition' in window || 'SpeechRecognition' in window){
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognition = new SR();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.onstart = ()=>{ listening=true; voiceStatus.textContent='Voice: listening...'; ping(1200,0.05) };
    recognition.onend = ()=>{ listening=false; voiceStatus.textContent='Voice: off'; ping(600,0.04) };
    recognition.onresult = (ev)=>{ const t = ev.results[0][0].transcript; runCommand(t); };
    recognition.onerror = (ev)=>{ console.warn('voice err', ev); voiceStatus.textContent='Voice: error'; };
  } else {
    voiceStatus.textContent = 'Voice: not supported';
    voiceBtn.disabled = true;
  }

  voiceBtn.addEventListener('click', ()=>{
    if(!recognition) return alert('Voice not supported on this browser');
    if(!listening){ recognition.start(); } else { recognition.stop(); }
  });

  // easter eggs and actions
  function showMatrix(){
    matrixOverlay.classList.remove('hidden'); matrixOverlay.innerHTML='';
    const canvas = document.createElement('canvas'); matrixOverlay.appendChild(canvas);
    canvas.width = innerWidth; canvas.height = innerHeight;
    const ctx = canvas.getContext('2d'); const cols = Math.floor(canvas.width/14); const drops = Array(cols).fill(0);
    ctx.fillStyle='rgba(0,0,0,0.92)'; ctx.fillRect(0,0,canvas.width,canvas.height);
    function frame(){
      ctx.fillStyle='rgba(0,0,0,0.06)'; ctx.fillRect(0,0,canvas.width,canvas.height);
      ctx.fillStyle='#00ff41'; ctx.font='13px monospace';
      for(let i=0;i<cols;i++){ const ch = String.fromCharCode(0x30A0 + Math.random()*96); ctx.fillText(ch, i*14, drops[i]*14); if(drops[i]*14 > canvas.height && Math.random()>0.975) drops[i]=0; drops[i]++; }
      if(!matrixOverlay.classList.contains('hidden')) requestAnimationFrame(frame);
    }
    frame();
    setTimeout(()=>{ matrixOverlay.classList.add('hidden'); }, 10000);
    ping(1200, 0.06);
    if(window.addLog) window.addLog('easter: matrix shown');
  }

  function showCore(){
    coreOverlay.classList.remove('hidden'); coreOverlay.innerHTML = '<div style="padding:30px;text-align:center"><div style="font-size:28px;font-weight:800">⚠ CORE OVERLOAD</div><div style="margin-top:8px;color:#ffd6dd">Emergency cooling engaged — demo mode</div></div>';
    ping(220,0.25);
    setTimeout(()=> coreOverlay.classList.add('hidden'), 8000);
    if(window.addLog) window.addLog('easter: core overlay');
  }

  function showAbhi(){
    abhiToast.classList.remove('hidden'); abhiToast.style.display='block'; abhiToast.textContent = 'Hello — Lex-01 reports: System initialized by Abhi 🎀✨';
    if('speechSynthesis' in window){ const u = new SpeechSynthesisUtterance("Hello. System initialized by Abhijeet. Pulse Matrix online."); u.rate=1; u.pitch=1; window.speechSynthesis.cancel(); window.speechSynthesis.speak(u); }
    setTimeout(()=>{ abhiToast.classList.add('hidden'); abhiToast.style.display='none'; }, 4200);
    ping(900,0.06);
    if(window.addLog) window.addLog('easter: abhi voice');
  }

  function pulseEffect(){
    document.body.classList.add('quantum');
    setTimeout(()=> document.body.classList.remove('quantum'), 5000);
    if(window.addLog) window.addLog('easter: pulse effect');
    ping(1600,0.08);
  }

  // run commands (typed or voice)
  function runCommand(raw){
    const cmd = (raw||'').toString().trim().toLowerCase();
    if(!cmd){ if(window.addLog) window.addLog('cmd: empty'); return; }
    if(window.addLog) window.addLog('cmd: ' + cmd);
    if(cmd.includes('matrix')) showMatrix();
    else if(cmd.includes('core')) showCore();
    else if(cmd.includes('abhi')) showAbhi();
    else if(cmd.includes('pulse')) pulseEffect();
    else if(cmd.includes('reboot')){
      if(window.addLog) window.addLog('cmd: reboot simulated');
      // soft reboot animation
      const overlay = document.createElement('div'); overlay.style.position='fixed'; overlay.style.inset=0; overlay.style.background='#000'; overlay.style.zIndex=9999; overlay.style.display='flex'; overlay.style.alignItems='center'; overlay.style.justifyContent='center'; overlay.style.color='#fff'; overlay.style.fontSize='20px';
      overlay.textContent='Rebooting system...';
      document.body.appendChild(overlay);
      ping(200,0.8);
      setTimeout(()=>{ document.body.removeChild(overlay); if(window.addLog) window.addLog('reboot: complete'); }, 2500);
    } else {
      if(window.addLog) window.addLog('command not recognized: '+cmd);
      ping(440,0.05);
    }
  }

  // wire command UI
  cmdRun.addEventListener('click', ()=>{ runCommand(cmdInput.value); cmdInput.value=''; });
  cmdInput.addEventListener('keydown', (e)=>{ if(e.key==='Enter'){ runCommand(cmdInput.value); cmdInput.value=''; } });
  document.addEventListener('keydown', (e)=>{ if(e.key==='/' && document.activeElement !== cmdInput){ e.preventDefault(); cmdInput.focus(); } });

  // quick controls
  document.getElementById('btnRefresh').addEventListener('click', ()=>{ if(window.addLog) window.addLog('control: refresh'); ping(1200,0.05); });
  document.getElementById('btnQuantum').addEventListener('click', ()=>{ document.body.classList.toggle('quantum'); if(window.addLog) window.addLog('control: quantum toggle'); });
  if(btnWorker) btnWorker.addEventListener('click', toggleWorker);

  // snapshot
  document.getElementById('snapshot').addEventListener('click', ()=> {
    html2canvasSnapshot();
  });

  // export snapshot - simple canvas capture of charts + summary (simulation)
  function html2canvasSnapshot(){ // lightweight snapshot using canvas API: we will export the charts canvas combined
    const nodes = Array.from(document.querySelectorAll('canvas'));
    try {
      // create single canvas
      const W = 1200, H = 800;
      const c = document.createElement('canvas'); c.width=W; c.height=H; const ctx = c.getContext('2d');
      ctx.fillStyle='#07192a'; ctx.fillRect(0,0,W,H);
      let x=20,y=20;
      nodes.forEach((nc,i)=>{
        try {
          ctx.drawImage(nc, x, y, 560, 280);
          x += 580;
          if(x+560>W){ x=20; y+=300; }
        } catch(err){}
      });
      const a = document.createElement('a'); a.href = c.toDataURL('image/png'); a.download = 'pulsematrix-snapshot.png'; a.click();
      if(window.addLog) window.addLog('snapshot: downloaded');
    } catch(e){
      if(window.addLog) window.addLog('snapshot: failed');
    }
  }

  // keyboard easter buffer (typed quick)
  let buffer = '';
  addEventListener('keydown', e => {
    if(e.key.length === 1){ buffer += e.key.toLowerCase(); if(buffer.length>12) buffer = buffer.slice(-12); if(buffer.endsWith('matrix')){ showMatrix(); buffer=''; } if(buffer.endsWith('abhi')){ showAbhi(); buffer=''; } if(buffer.endsWith('core')){ showCore(); buffer=''; } if(buffer.endsWith('pulse')){ pulseEffect(); buffer=''; } }
    if(e.key === 'Escape'){ document.getElementById('matrixOverlay').classList.add('hidden'); document.getElementById('coreOverlay').classList.add('hidden'); abhiToast.classList.add('hidden'); abhiToast.style.display='none'; }
  });

  // voice command alias: accept "hey lex" prefix optionally
  // recognition.onresult already passes string to runCommand

  // WORKER: heavy simulation
  let worker = null;
  function toggleWorker(){
    if(worker){ worker.postMessage('stop'); worker = null; document.getElementById('btnWorker').textContent='Start Worker'; if(window.addLog) window.addLog('worker: stopped'); return; }
    // create blob worker from inline code (worker.js content)
    const workerCode = `self.onmessage = function(e){ if(e.data === 'start'){ let count=0; function heavyLoop(){ for(let i=0;i<200000;i++){ const n = Math.floor(Math.random()*1000000)+3; let isPrime=true; for(let k=2;k*k<=n;k++){ if(n%k===0){ isPrime=false; break; } } if(isPrime) count++; } self.postMessage({ type:'progress', count }); setTimeout(heavyLoop, 300); } else if(e.data==='stop'){ self.postMessage({ type:'stopped' }); self.close(); } };`;
    const blob = new Blob([workerCode], { type: 'application/javascript' });
    worker = new Worker(URL.createObjectURL(blob));
    worker.onmessage = (ev) => {
      if(ev.data.type === 'progress'){ if(window.addLog) window.addLog('worker: progress ' + ev.data.count); }
      if(ev.data.type === 'stopped'){ if(window.addLog) window.addLog('worker: stopped'); worker.terminate(); worker = null; document.getElementById('btnWorker').textContent='Start Worker'; }
    };
    worker.postMessage('start');
    document.getElementById('btnWorker').textContent='Stop Worker';
    if(window.addLog) window.addLog('worker: started');
  }

  // initialize voice recognition hotword: "hey lex"
  if(recognition){
    recognition.onresult = (ev) => {
      const transcript = ev.results[0][0].transcript;
      // normalization
      let t = transcript.toLowerCase();
      t = t.replace('hey lex','').replace("hey lexi","").trim();
      runCommand(t);
    };
  }

  // small UI accessibility: focus input on '/'
  // (already implemented earlier)

});
