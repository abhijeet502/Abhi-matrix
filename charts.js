// charts.js — create charts for cpu, net, mem, throughput
let cpuChart, netChart, memChart, throughChart;
(function(){
  function makeChart(ctx, color){
    return new Chart(ctx, {
      type:'line',
      data:{ labels: Array.from({length:40}, (_,i)=>i), datasets:[{data: Array.from({length:40},()=>Math.random()*40+20), borderColor:color, backgroundColor: color+'22', fill:true, tension:0.35, pointRadius:0}]},
      options:{ responsive:true, maintainAspectRatio:false, plugins:{legend:{display:false}}, scales:{x:{display:false}, y:{display:false}}}
    });
  }

  window.initCharts = function(){
    const cpuCtx = document.getElementById('cpuChart').getContext('2d');
    const netCtx = document.getElementById('netChart').getContext('2d');
    const memCtx = document.getElementById('memChart').getContext('2d');
    const thrCtx = document.getElementById('throughChart').getContext('2d');

    cpuChart = makeChart(cpuCtx, '#7dd3fc');
    netChart = makeChart(netCtx, '#60a5fa');
    memChart = makeChart(memCtx, '#a78bfa');
    throughChart = makeChart(thrCtx, '#34d399');

    setInterval(()=>{
      function pushRandom(chart, variance){
        const arr = chart.data.datasets[0].data;
        arr.push(Math.max(1, Math.min(99, arr[arr.length-1] + (Math.random()-0.5)*variance)));
        arr.shift(); chart.update('none');
      }
      pushRandom(cpuChart, 16); pushRandom(netChart, 40); pushRandom(memChart, 8); pushRandom(throughChart, 24);
    }, 1200);
  }
})();
