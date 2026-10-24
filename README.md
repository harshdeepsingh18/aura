# Aura Voice Assistant

Aura is a local website with a Python backend and a local AI chat powered by Ollama. No API key or Python packages are required. Aura saves the most recent 50 chat turns in `data/history.json`.

## Run Aura

1. Install Python 3 if it is not already installed.
2. Install [Ollama for Windows](https://ollama.com/download/windows) and start the Ollama app.
3. Open PowerShell and download the local chat model:
   ```powershell
   ollama pull qwen3:4b
   ```
4. Open a second PowerShell terminal in this folder and start Aura:
   - Windows: `py server.py`
   - Or: `python server.py`
5. Open `http://127.0.0.1:3000` in Chrome or Edge and allow microphone access to use voice chat.

Aura uses the local `qwen3:4b` model. To use a different Ollama model, set the `OLLAMA_MODEL` environment variable before starting Aura and download that model with `ollama pull`.

Keep the terminal running while you use Aura. Do not open `index.html` directly: the website needs the backend server, and the microphone/browser behavior works best from the local server URL.

Aura does not open a blank tab when listening starts. Ask Aura to open a website or launch Notepad/Calculator, then approve or cancel the proposed action. Websites are only opened after your approval; desktop actions are limited to Notepad and Calculator. Aura cannot control every app or do literally everything on your computer.

Chat prompts are sent only to Ollama on your own computer at `127.0.0.1:11434`; no AI provider API key, API credits, or cloud AI service are used. Conversation history is stored locally in `data/history.json`; use **Clear** in the page to delete it. The backend binds only to `127.0.0.1` and never runs arbitrary shell commands.
