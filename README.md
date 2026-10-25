# Aura Voice Assistant

Aura is a local website with a Python backend and AI chat powered by the Gemini API. A Gemini API key and an internet connection are required. Aura saves the most recent 50 chat turns in `data/history.json`.

## Run Aura

1. Install Python 3 if it is not already installed.
2. Create an API key from the [Gemini platform](https://aistudio.google.com/app/apikey).
3. In the Aura folder, create a `.env` file and add your key:
   ```powershell
   GEMINI_API_KEY=your_key_here
   ```
   `.env` is ignored by Git; do not share or commit your API key.
4. Open PowerShell in the Aura folder and start Aura:
   - Windows: `py server.py`
   - Or: `python server.py`
5. Open `http://127.0.0.1:3000` in Chrome or Edge and allow microphone access to use voice chat.

Keep the terminal running while you use Aura. Do not open `index.html` directly: the website needs the backend server, and the microphone/browser behavior works best from the local server URL.

Aura does not open a blank tab when listening starts. Ask Aura to open a website or launch Notepad/Calculator, then approve or cancel the proposed action. Websites are only opened after your approval; desktop actions are limited to Notepad and Calculator. Aura cannot control every app or do literally everything on your computer.

Chat prompts are sent to Gemini's hosted API using the `gemini-3.1-flash-lite` model, so API usage may incur charges under your Gemini account. Conversation history is stored locally in `data/history.json`; use **Clear** in the page to delete it. The backend binds only to `127.0.0.1` and never runs arbitrary shell commands.
