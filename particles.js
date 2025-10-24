// particles.js — subtle floating particles & faint grid background
(() => {
  const c = document.getElementById('particles-canvas');
  if(!c) return;
  const ctx = c.getContext('2d');
  let W = c.width = innerWidth;
  let H = c.height = innerHeight;
  const N = Math.max(20, Math.floor((W*H)/140000));
  const pts = [];
  function rand(a,b){return Math.random()*(b-a)+a}

  class P {
    constructor(){
      this.x = rand(0,W);
      this.y = rand(0,H);
      this.r = rand(0.5,2.2);
      this.vx = rand(-0.12,0.12);
      this.vy = rand(-0.2,0.2);
      this.h = rand(190,230);
    }
    step(){
      this.x += this.vx; this.y += this.vy;
      if(this.x < -10) this.x = W+10;
      if(this.x > W+10) this.x = -10;
      if(this.y < -10) this.y = H+10;
      if(this.y > H+10) this.y = -10;
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
    g.addColorStop(0,'rgba(10,18,28,0.03)');
    g.addColorStop(1,'rgba(6,12,20,0.06)');
    ctx.fillStyle = g;
    ctx.fillRect(0,0,W,H);

    ctx.strokeStyle = 'rgba(120,190,255,0.02)';
    ctx.lineWidth = 1;
    for(let x=0;x<W;x+=100){ ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,H); ctx.stroke(); }
    for(let y=0;y<H;y+=100){ ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(W,y); ctx.stroke(); }

    pts.forEach(p => { p.step(); p.draw(); });
    requestAnimationFrame(loop);
  }
  loop();
})();
