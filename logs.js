// logs.js — simulate activity logs and expose addLog
(function(){
  const logBox = document.getElementById('logBox');
  const samples = [
    "deploy: build #" + (200 + Math.floor(Math.random()*100)) + " succeeded",
    "io: disk write " + (20 + Math.floor(Math.random()*200)) + "MB/s",
    "cache: eviction triggered " + (1 + Math.floor(Math.random()*5)) + " keys",
    "service: heartbeat OK",
    "db: compaction complete",
    "ingress: new connections"
  ];

  function addLog(msg){
    const d = new Date().toLocaleTimeString();
    const el = document.createElement('div');
    el.className = 'log-line';
    el.textContent = `[${d}] ${msg}`;
    logBox.appendChild(el);
    logBox.scrollTop = logBox.scrollHeight;
    while(logBox.children.length > 180) logBox.removeChild(logBox.firstChild);
  }

  window.addLog = addLog;

  let sim = true;
  window.toggleLogSim = function(){ sim = !sim; return sim; };
  setInterval(()=>{ if(sim) addLog(samples[Math.floor(Math.random()*samples.length)]) }, 2000);

  document.addEventListener('DOMContentLoaded', ()=>{
    const manual = document.getElementById('manualRefresh');
    const toggle = document.getElementById('toggleSim');
    const clearBtn = document.getElementById('clearLogs');
    if(manual) manual.addEventListener('click', ()=> addLog('manual: refresh requested'));
    if(toggle) toggle.addEventListener('click', ()=> {
      const state = window.toggleLogSim();
      toggle.textContent = state ? 'Pause' : 'Resume';
      addLog('simulation ' + (state ? 'resumed' : 'paused'));
    });
    if(clearBtn) clearBtn.addEventListener('click', ()=> { logBox.innerHTML = ''; addLog('logs cleared'); });
  });
})();
