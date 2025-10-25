// particles.js — subtle moving particles + soft grid
(() => {
  const c = document.getElementById('particles-canvas');
  if(!c) return;
  const ctx = c.getContext('2d');
  let W = c.width = innerWidth;
  let H = c.height = innerHeight;
  const N = Math.max(30, Math.floor((W*H)/120000));
  const pts = [];
  function rand(a,b){return Math.random()*(b-a)+a}

  class P {
    constructor(){
      this.x = rand(0,W);
      this.y = rand(0,H);
      this.r = rand(0.6,2.6);
      this.vx = rand(-0.18,0.18);
      this.vy = rand(-0.25,0.25);
      this.h = rand(190,230);
    }
    step(){
      this.x += this.vx; this.y += this.vy;
      if(this.x < -20) this.x = W+20;
      if(this.x > W+20) this.x = -20;
      if(this.y < -20) this.y = H+20;
      if(this.y > H+20) this.y = -20;
    }
    draw(){
      ctx.beginPath();
      ctx.fillStyle = `hsla(${this.h},70%,60%,${0.06+this.r/5})`;
      ctx.arc(this.x,this.y,this.r,0,Math.PI*2);
      ctx.fill();
    }
  }

  for(let i=0;i<N;i++) pts.push(new P());

  function resize(){ W = c.width = innerWidth; H = c.height = innerHeight; }
  addEventListener('resize', resize);

  function loop(){
    ctx.clearRect(0,0,W,H);
    const g = ctx.createLinearGradient(0,0,W,H);
    g.addColorStop(0,'rgba(6,12,20,0.04)');
    g.addColorStop(1,'rgba(6,12,20,0.06)');
    ctx.fillStyle = g; ctx.fillRect(0,0,W,H);

    // subtle grid lines with parallax effect
    ctx.strokeStyle = 'rgba(120,190,255,0.02)';
    ctx.lineWidth = 1;
    const offset = (Date.now()/2000)%100;
    for(let x = -100 + offset; x < W+200; x+=120){ ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,H); ctx.stroke(); }
    for(let y = -100 + offset; y < H+200; y+=120){ ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(W,y); ctx.stroke(); }

    pts.forEach(p => { p.step(); p.draw(); });
    requestAnimationFrame(loop);
  }
  loop();
})();
