# abhi-pulsematrix-x (Advanced)

PulseMatrix X — advanced demo dashboard by Abhijeet (Abhi).

Files:
- index.html
- style.css
- particles.js
- three-aurora.js
- charts.js
- logs.js
- script.js
- worker.js (embedded inline by script.js)

Quick deploy:
1. Create GitHub repo (e.g. `abhi-pulsematrix-x`).
2. Add these files to repo root (use GitHub web UI).
3. Go to Vercel → New Project → Import repo → Framework: **Other** → Deploy.
4. Open your Vercel URL.

Notes:
- Voice commands: press 🎤 Voice Mode and speak. Supported commands: `matrix`, `abhi`, `core`, `pulse`, `reboot`.
- Easter eggs available via keyboard typing too.
- Worker simulates heavy work to show “server-like” activity.
- No API keys or billing required for demo behavior.

**C# / Blazor integration (optional):**
- To later add true C# logic in-browser, use **Blazor WebAssembly** (requires .NET SDK to build). Host compiled Blazor outputs in a subfolder and reference them from `index.html`.
- If you want, I can provide a short guide to create a small Blazor WASM module and integrate it.

Enjoy — crafted with ❤️ by Abhi
