// logs.js — logs generator + export
(function(){
  const logBox = document.getElementById('logBox');
  if(!logBox) return;
  const samples = [
    "deploy: build #"+(200+Math.floor(Math.random()*200))+" succeeded",
    "io: disk write "+(20+Math.floor(Math.random()*400))+"MB/s",
    "cache: eviction triggered "+(1+Math.floor(Math.random()*10))+" keys",
    "service: heartbeat OK",
    "db: compaction complete",
    "ingress: new connections",
    "auth: session refreshed",
    "scheduler: job queued",
    "analyzer: corpus scanned"
  ];

  function addLog(msg){
    const d = new Date().toLocaleTimeString();
    const el = document.createElement('div');
    el.className = 'log-line';
    el.textContent = `[${d}] ${msg}`;
    logBox.appendChild(el);
    logBox.scrollTop = logBox.scrollHeight;
    while(logBox.children.length > 250) logBox.removeChild(logBox.firstChild);
  }

  window.addLog = addLog;

  let sim = true;
  window.toggleLogSim = function(){ sim = !sim; return sim; };
  setInterval(()=>{ if(sim) addLog(samples[Math.floor(Math.random()*samples.length)]) }, 1600);

  document.addEventListener('DOMContentLoaded', ()=>{
    const manual = document.getElementById('manualRefresh');
    const toggle = document.getElementById('toggleSim');
    const clearBtn = document.getElementById('clearLogs');
    const exportBtn = document.getElementById('exportLogs');

    if(manual) manual.addEventListener('click', ()=> addLog('manual: refresh requested'));
    if(toggle) toggle.addEventListener('click', ()=> {
      const state = window.toggleLogSim();
      toggle.textContent = state ? 'Pause' : 'Resume';
      addLog('simulation ' + (state ? 'resumed' : 'paused'));
    });
    if(clearBtn) clearBtn.addEventListener('click', ()=> { logBox.innerHTML = ''; addLog('logs cleared'); });
    if(exportBtn) exportBtn.addEventListener('click', ()=> {
      const txt = Array.from(logBox.children).map(el=>el.textContent).join('\n');
      const blob = new Blob([txt], {type:'text/plain'}); const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = 'pulsematrix-logs.txt'; a.click(); URL.revokeObjectURL(url);
      addLog('export: logs downloaded');
    });
  });
})();
