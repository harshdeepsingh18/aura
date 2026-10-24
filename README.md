# Aura Voice Assistant

Aura is a local website with a Python backend and a Grok-powered chat. Python's standard library is used for the local server; no Python packages are required. Aura saves the most recent 50 chat turns in `data/history.json`.

## Run Aura

1. Install Python 3 if it is not already installed.
2. Create an xAI API key in the [xAI Console](https://console.x.ai/team/default/api-keys).
3. Open the `.env` file in a text editor and put your key after `XAI_API_KEY=`. Save the file. Keep the key private; this file is excluded from Git.
4. Open a terminal in this folder and start Aura:
   - Windows: `py server.py`
   - Or: `python server.py`
5. Open `http://127.0.0.1:3000` in Chrome or Edge and allow microphone access to use voice chat.

If the key is blank, Aura runs without AI chat. A key already set in the environment takes precedence over `.env`.

Aura uses xAI's API over HTTPS. The default model is `grok-4.7`; set `XAI_MODEL` before starting the server if you want to choose another available model. If Grok reports an API error, Aura displays xAI's response details without displaying your key.

Keep the terminal running while you use Aura. Do not open `index.html` directly: the website needs the backend server, and the microphone/browser behavior works best from the local server URL.

Aura does not open a blank tab when listening starts. Ask Aura to open a website or launch Notepad/Calculator, then approve or cancel the proposed action. Websites are only opened after your approval; desktop actions are limited to Notepad and Calculator. Aura cannot control every app or do literally everything on your computer.

The xAI API key stays on the local Python server and is never sent to the webpage. Conversation history is stored locally in `data/history.json`; use **Clear** in the page to delete it. The backend binds only to `127.0.0.1` and never runs arbitrary shell commands.
