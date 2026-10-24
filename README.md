# Aura Voice Assistant

Aura is a local website with a Python backend and a Gemini-powered chat. Python's standard library is used for the local server; no Python packages are required. Aura saves the most recent 50 chat turns in `data/history.json`.

## Run Aura

1. Install Python 3 if it is not already installed.
2. Create a Gemini API key at [Google AI Studio](https://aistudio.google.com/apikey). Check Google's current API terms and pricing for your account.
3. Open a terminal in this folder and start Aura:
   - Windows: `py server.py`
   - Or: `python server.py`
4. When prompted, paste your API key. The input is hidden and Aura keeps the key in memory only; it is not saved in the project files. Press Enter without a key to run the local website without Gemini chat.
5. Open `http://127.0.0.1:3000` in Chrome or Edge and allow microphone access to use voice chat.

Aura uses Google's Gemini API over HTTPS. The default model is `gemini-3.8-flash`; set `GEMINI_MODEL` before starting the server if you want to choose another available model.
If Gemini reports an API error, Aura displays Google's response details without displaying your key. Check the key in Google AI Studio and the model name if the message says either is invalid.

Keep the terminal running while you use Aura. Do not open `index.html` directly: the website needs the backend server, and the microphone/browser behavior works best from the local server URL.

Aura does not open a blank tab when listening starts. Ask Aura to open a website or launch Notepad/Calculator, then approve or cancel the proposed action. Websites are only opened after your approval; desktop actions are limited to Notepad and Calculator. Aura cannot control every app or do literally everything on your computer.

The Gemini API key stays on the local Python server and is never sent to the webpage. Conversation history is stored locally in `data/history.json`; use **Clear** in the page to delete it. The backend binds only to `127.0.0.1` and never runs arbitrary shell commands.
