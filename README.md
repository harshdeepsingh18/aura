# Aura Voice Assistant

Aura is a local website with a Python backend. The backend uses Python's standard library, interprets a small set of commands, saves the most recent 50 commands in `data/history.json`, and can open the allowlisted Windows apps Notepad and Calculator.

## Run Aura

1. Install Python 3 if it is not already installed.
2. Open a terminal in this folder.
3. Start Aura:
   - Windows: `py server.py`
   - Or: `python server.py`
4. Open `http://127.0.0.1:3000` in Chrome or Edge and allow microphone access to use voice commands.

Keep the terminal running while you use Aura. Do not open `index.html` directly: the website needs the backend server, and the microphone/browser behavior works best from the local server URL.

## Commands

- `open YouTube`
- `play music`
- `search for relaxing music`
- `what time is it`
- `open Notepad`
- `open Calculator`

The backend binds only to `127.0.0.1` and only launches the two explicitly allowlisted apps. It does not run arbitrary shell commands or need third-party Python packages.
