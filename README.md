# Aura Voice Assistant

Aura is a local Python web app with AI chat powered by Google's Gemini API. Chats are saved in `data/chats.json` on the computer running Aura. Aura does not provide sign-in, sign-up, cloud chat sync, or shared multi-user storage.

## Configure Gemini

Add your Gemini API key to `.env`:

```powershell
GEMINI_API_KEY=your_gemini_key
```

Keep `.env` and your API key private. Aura sends chat prompts and supported attachments to Gemini using the `gemini-3.1-flash-lite` model. Gemini requests time out after 45 seconds and show an error if the service does not respond. API usage may incur charges under your Gemini account. Attachments are limited to 10 MB and are not retained in chat history.

## Run locally

1. Install Python 3.
2. Start Aura from its folder:
   - Windows PowerShell: `$env:PORT = "31389"; py server.py`
   - Or: `python server.py` with `PORT=31389` set in the environment.
3. Open `http://127.0.0.1:31389` in Chrome or Edge.

Here, `127.0.0.1` is the local loopback IP address and `31389` is the port; this address works only on the computer running Aura. Aura binds to localhost only and cannot be deployed as a public/shared backend. Keep the terminal open while using Aura; closing it stops the website. Do not open `index.html` directly; Aura needs its backend server.

Use the sidebar to switch between Chat, Explore, saved Chats, web Search, and Settings. Web searches open Google results in the current tab; use the browser's Back button to return to Aura.

## Chats and privacy

Use **Your chats** to reopen conversations, **+** to start a new chat, and **×** to delete a chat after confirmation. Chats are local to this computer and are not synced between devices or accounts. Existing local chats in `data/chats.json` (or legacy `data/history.json`) remain available. Existing Supabase cloud chats are not changed, but Aura no longer connects to or syncs them.

Voice input works best in Chrome or Edge. Website and desktop app actions are available only when Aura runs locally. Chat prompts and supported attachments are sent to Google's Gemini API; do not upload sensitive information.
