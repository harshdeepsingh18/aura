# Aura Voice Assistant

Aura is a Python web app with AI chat powered by the Gemini API. Google sign-in uses Supabase Auth, and each user's conversations are saved in Supabase so they can access them from supported devices.

## Configure Supabase and Google sign-in

1. Create a Supabase project.
2. In the Supabase SQL Editor, run [`supabase_schema.sql`](./supabase_schema.sql). The `chats` table uses row-level security so signed-in users can only access their own records.
3. In Supabase, open **Authentication → Providers → Google** and enable Google. Configure a Google OAuth web client in Google Cloud:
   - Add Supabase's callback URL, shown in the Google provider settings, as an authorized redirect URI in Google Cloud.
   - Put the Google client ID and client secret into the Supabase Google provider settings.
   - Add the app's local and deployed origins to **Authentication → URL Configuration → Redirect URLs** in Supabase.
4. Copy the Supabase project URL and the project's **publishable/anon key** into Aura's `.env` file. Never use a Supabase service-role key in Aura.

```powershell
GEMINI_API_KEY=your_gemini_key
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_supabase_publishable_or_anon_key
```

For a public HTTPS deployment, also configure `APP_ORIGIN` to the exact public origin, for example `https://aura.example.com`, and bind the server to the host provided by your platform (commonly `HOST=0.0.0.0`). Set `PORT` if required by the platform. Keep `.env` and all provider secrets private. Configure the same exact origin in Supabase's redirect URL allowlist.

## Run locally

1. Install Python 3.
2. Add the Gemini and Supabase values above to `.env`.
3. Start Aura from its folder:
   - Windows: `py server.py`
   - Or: `python server.py`
4. Open `http://127.0.0.1:31389` in Chrome or Edge and select **Sign in / Sign up** to open the sign-in page. Choose **Continue with Google**; the first Google sign-in creates the account, and returning users sign in with the same Google account. Allow the local origin in Supabase's redirect URL allowlist.

Keep the terminal running while using Aura. Do not open `index.html` directly; Aura needs its backend server. Without Supabase settings, localhost remains usable in local-only mode, but Google sign-in and cross-device sync are unavailable.

Use the sidebar to switch between Chat, Explore, saved Chats, web Search, and Settings. Web searches open Google results in a new tab.

## Chats and privacy

Use **Your chats** to reopen conversations, **+** to start a new chat, and **×** to delete a chat after confirmation. On the first sign-in, Aura copies existing local chats from `data/chats.json` (or legacy `data/history.json`) into the first Google account. The local files are retained. Later chats are stored in Supabase and are scoped to the signed-in account by row-level security.

Chat prompts and supported attachments are sent to Google's Gemini API using the `gemini-3.1-flash-lite` model. API usage may incur charges under your Gemini account. Attachments are limited to 10 MB and are not retained in chat history.

Voice input works best in Chrome or Edge. Website and desktop app actions are available only when Aura runs locally; a cloud-hosted server cannot open them on a user's computer.
