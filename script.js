// script.js — main wiring: clock, uptime, commands, UI
document.addEventListener('DOMContentLoaded', ()=> {
  document.getElementById('year').textContent = new Date().getFullYear();

  const clock = document.getElementById('clock');
  const uptime = document.getElementById('uptime');
  const loadEl = document.getElementById('load');
  const start = Date.now();

  function formatUptime(ms){
    const s = Math.floor(ms/1000);
    const d = Math.floor(s/86400);
    const h = Math.floor((s%86400)/3600);
    const m = Math.floor((s%3600)/60);
    return `${d}d ${h}h ${m}m`;
  }

  setInterval(()=>{
    const now = new Date();
    clock.textContent = now.toLocaleTimeString();
    uptime.textContent = formatUptime(Date.now() - start);
    loadEl.textContent = (Math.random()*2.5).toFixed(2);
  }, 1000);

  if(window.initCharts) window.initCharts();
  if(window.addLog) window.addLog('system: PulseMatrix X online');

  const cmdInput = document.getElementById('cmdInput');
  const cmdRun = document.getElementById('cmdRun');
  const matrixOverlay = document.getElementById('matrixOverlay');
  const abhiToast = document.getElementById('abhiToast');
  const btnQuantum = document.getElementById('btnQuantum');

  function showMatrix(){
    matrixOverlay.classList.remove('hidden'); matrixOverlay.innerHTML = '';
    const canvas = document.createElement('canvas'); matrixOverlay.appendChild(canvas);
    canvas.width = innerWidth; canvas.height = innerHeight;
    const ctx = canvas.getContext('2d');
    const cols = Math.floor(canvas.width / 14);
    const drops = Array(cols).fill(0);
    ctx.fillStyle = 'rgba(0,0,0,0.85)'; ctx.fillRect(0,0,canvas.width,canvas.height);

    function frame(){
      ctx.fillStyle = 'rgba(0,0,0,0.06)'; ctx.fillRect(0,0,canvas.width,canvas.height);
      ctx.fillStyle = '#00ff41'; ctx.font = '13px monospace';
      for(let i=0;i<cols;i++){
        const text = String.fromCharCode(0x30A0 + Math.random()*96);
        ctx.fillText(text, i*14, drops[i]*14);
        if(drops[i]*14 > canvas.height && Math.random()>0.975) drops[i]=0;
        drops[i]++;
      }
      if(!matrixOverlay.classList.contains('hidden')) requestAnimationFrame(frame);
    }
    frame();
    setTimeout(()=> matrixOverlay.classList.add('hidden'), 9000);
  }

  function showAbhi(){
    abhiToast.classList.remove('hidden'); abhiToast.textContent = 'Hello — Lex-01 reports: System initialized by Abhi 🎀✨';
    abhiToast.style.display = 'block';
    if('speechSynthesis' in window){
      const u = new SpeechSynthesisUtterance("Hello. System initialized by Abhijeet. PulseMatrix online.");
      u.rate = 1; u.pitch = 1; window.speechSynthesis.cancel(); window.speechSynthesis.speak(u);
    }
    setTimeout(()=> { abhiToast.classList.add('hidden'); abhiToast.style.display='none'; }, 4200);
  }

  function runCommand(raw){
    const cmd = (raw||'').trim().toLowerCase();
    if(!cmd){ if(window.addLog) window.addLog('cmd: empty'); return; }
    if(window.addLog) window.addLog('cmd: '+cmd);
    if(cmd === 'quantum'){ document.body.classList.toggle('quantum'); if(window.addLog) window.addLog('quantum toggled'); }
    else if(cmd === 'abhi'){ showAbhi(); }
    else if(cmd === 'sudo'){ if(window.addLog) window.addLog('sudo: admin overlay (demo)'); alert('Admin console (demo) — close to continue'); }
    else if(cmd === 'matrix'){ showMatrix(); }
    else { if(window.addLog) window.addLog('unknown command: '+cmd); }
  }

  cmdRun.addEventListener('click', ()=>{ runCommand(cmdInput.value); cmdInput.value=''; });
  cmdInput.addEventListener('keydown', (e)=>{ if(e.key === 'Enter') { runCommand(cmdInput.value); cmdInput.value=''; } });
  document.addEventListener('keydown', (e)=>{ if(e.key === '/') { e.preventDefault(); cmdInput.focus(); } });

  document.getElementById('btnRefresh').addEventListener('click', ()=> { if(window.addLog) window.addLog('control: refresh'); });
  btnQuantum && btnQuantum.addEventListener('click', ()=> { document.body.classList.toggle('quantum'); if(window.addLog) window.addLog('control: quantum toggle'); });
  document.getElementById('btnExport').addEventListener('click', ()=> { if(window.addLog) window.addLog('export: snapshot (demo)'); alert('Exported snapshot (demo).'); });

  let buffer = '';
  addEventListener('keydown', e => {
    if(e.key.length === 1){ buffer += e.key.toLowerCase(); if(buffer.length>12) buffer=buffer.slice(-12); if(buffer.endsWith('matrix')){ showMatrix(); buffer=''; } if(buffer.endsWith('abhi')){ showAbhi(); buffer=''; } }
    if(e.key === 'Escape'){ document.getElementById('matrixOverlay').classList.add('hidden'); abhiToast.classList.add('hidden'); abhiToast.style.display='none'; }
  });
});
