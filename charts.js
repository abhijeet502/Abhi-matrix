// charts.js — Chart.js sparkline creation + updater
let cpuChart, netChart;
(function(){
  function makeSpark(ctx, color){
    return new Chart(ctx, {
      type: 'line',
      data:{ labels: Array.from({length:30}, (_,i)=>i), datasets:[{data: Array.from({length:30},()=>Math.random()*40+10), borderColor: color, backgroundColor: color+'33', fill:true, tension:0.35, pointRadius:0}]},
      options:{
        responsive:true, maintainAspectRatio:false,
        plugins:{legend:{display:false}},
        scales:{ x:{display:false}, y:{display:false} }
      }
    });
  }

  window.initCharts = function(){
    const cpuCtx = document.getElementById('cpuChart').getContext('2d');
    const netCtx = document.getElementById('netChart').getContext('2d');
    cpuChart = makeSpark(cpuCtx, '#7dd3fc');
    netChart = makeSpark(netCtx, '#60a5fa');

    setInterval(()=>{
      function pushRandom(chart, variance){
        const arr = chart.data.datasets[0].data;
        arr.push(Math.max(2, Math.min(95, arr[arr.length-1] + (Math.random()-0.5)*variance)));
        arr.shift();
        chart.update('none');
      }
      if(cpuChart) pushRandom(cpuChart, 12);
      if(netChart) pushRandom(netChart, 50);
    }, 1200);
  }
})();
