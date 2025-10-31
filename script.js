const BACKEND_URL = "https://mindmirrorx-backend.onrender.com";

const txtInput = document.getElementById("txtInput");
const btnSend = document.getElementById("btnSend");
const btnVoice = document.getElementById("btnVoice");
const reply = document.getElementById("reply");
const memList = document.getElementById("mem-list");
const memNum = document.getElementById("memnum");
const statusEl = document.getElementById("status");

let recognition;
let memories = [];

// --- Speech Recognition ---
if ("webkitSpeechRecognition" in window) {
  recognition = new webkitSpeechRecognition();
  recognition.continuous = false;
  recognition.lang = "en-US";
  recognition.onstart = () => (statusEl.textContent = "🎤 listening...");
  recognition.onend = () => (statusEl.textContent = "idle");
  recognition.onresult = (e) => {
    const text = e.results[0][0].transcript;
    txtInput.value = text;
    processInput(text);
  };
} else {
  btnVoice.disabled = true;
  btnVoice.textContent = "Voice N/A";
}

// --- Process Input ---
async function processInput(text) {
  if (!text.trim()) return;
  reply.textContent = "Reflecting...";
  statusEl.textContent = "processing...";

  try {
    const res = await fetch(`${BACKEND_URL}/analyze`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });

    const data = await res.json();
    const { mood, advice } = data;

    updateSpectrum(mood);
    reply.textContent = advice || "I couldn’t interpret that.";

    memories.push({ mood, text, advice });
    memNum.textContent = memories.length;
    renderMemories();

    // Voice reply
    const utter = new SpeechSynthesisUtterance(advice);
    utter.lang = "en-US";
    utter.rate = 1;
    utter.pitch = 1;
    speechSynthesis.speak(utter);

  } catch {
    reply.textContent = "⚠️ Connection error — check backend.";
  } finally {
    statusEl.textContent = "idle";
  }
}

// --- Visual Spectrum Update ---
function updateSpectrum(mood) {
  const positive = document.querySelector("#bar-positive .bar-fill");
  const neutral = document.querySelector("#bar-neutral .bar-fill");
  const negative = document.querySelector("#bar-negative .bar-fill");

  positive.style.width = mood === "positive" ? "100%" : "10%";
  neutral.style.width = mood === "neutral" ? "100%" : "10%";
  negative.style.width = mood === "negative" ? "100%" : "10%";

  document.getElementById("pulse").style.background =
    mood === "positive"
      ? "radial-gradient(circle, #00ffcc, #003333)"
      : mood === "negative"
      ? "radial-gradient(circle, #ff6666, #330000)"
      : "radial-gradient(circle, #3399ff, #001133)";
}

// --- Memories ---
function renderMemories() {
  memList.innerHTML = memories
    .map(
      (m) => `
      <div class="mem-item">
        <strong>[${m.mood}]</strong> ${m.text}<br/>
        <em>${m.advice}</em>
      </div>`
    )
    .join("");
}

// --- Events ---
btnSend.addEventListener("click", () => processInput(txtInput.value));
btnVoice.addEventListener("click", () => recognition?.start());
document.querySelectorAll(".quick-btn").forEach((btn) =>
  btn.addEventListener("click", () => processInput(btn.dataset.sample))
);

// --- Particle Background ---
const canvas = document.getElementById("bg-canvas");
const ctx = canvas.getContext("2d");
let w, h, particles;
function init() {
  w = canvas.width = window.innerWidth;
  h = canvas.height = window.innerHeight;
  particles = Array.from({ length: 90 }, () => ({
    x: Math.random() * w,
    y: Math.random() * h,
    r: Math.random() * 2 + 1,
    dx: Math.random() * 0.5 - 0.25,
    dy: Math.random() * 0.5 - 0.25,
  }));
}
function draw() {
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = "rgba(0, 255, 150, 0.7)";
  particles.forEach((p) => {
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    ctx.fill();
    p.x += p.dx;
    p.y += p.dy;
    if (p.x < 0 || p.x > w) p.dx *= -1;
    if (p.y < 0 || p.y > h) p.dy *= -1;
  });
  requestAnimationFrame(draw);
}
window.addEventListener("resize", init);
init();
draw();
