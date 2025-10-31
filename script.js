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

// --- Initialize Speech Recognition ---
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

// --- Send text to backend + get emotion ---
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
    reply.textContent = advice || "I reflected but didn’t find anything.";

    memories.push({ mood, text, advice });
    memNum.textContent = memories.length;
    renderMemories();

    // Voice reply (TTS)
    const speech = new SpeechSynthesisUtterance(advice || "Here's my reflection.");
    speech.lang = "en-US";
    speech.pitch = 1;
    speech.rate = 1;
    window.speechSynthesis.speak(speech);

  } catch (err) {
    reply.textContent = "Error connecting to MindMirror Core.";
  } finally {
    statusEl.textContent = "idle";
  }
}

// --- Visual spectrum update ---
function updateSpectrum(mood) {
  const positive = document.querySelector("#bar-positive .bar-fill");
  const neutral = document.querySelector("#bar-neutral .bar-fill");
  const negative = document.querySelector("#bar-negative .bar-fill");

  positive.style.width = mood === "positive" ? "100%" : "20%";
  neutral.style.width = mood === "neutral" ? "100%" : "20%";
  negative.style.width = mood === "negative" ? "100%" : "20%";

  document.getElementById("pulse").style.background = 
    mood === "positive"
      ? "radial-gradient(circle, #00ff99, #006644)"
      : mood === "negative"
      ? "radial-gradient(circle, #ff4d4d, #660000)"
      : "radial-gradient(circle, #3399ff, #003366)";
}

// --- Render Memories ---
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
