# Aura AI

Aura is a Python web app with AI chat powered by Google's Gemini API. It supports local-only chats or Google sign-in with Supabase-backed chat history that follows the signed-in user across devices.

## Cloud setup: Google sign-in and synced chats

1. Create a Supabase project and run [`supabase/schema.sql`](./supabase/schema.sql) in its SQL Editor. The table uses row-level security so each signed-in user can read and change only their own chats.
2. In Google Cloud Console, create a **Web application** OAuth client. Add your Aura website origin to **Authorized JavaScript origins**. In Supabase, enable **Authentication → Sign In / Providers → Google**, then enter the Google client ID and client secret. Supabase shows its OAuth callback URL (usually `https://<project-ref>.supabase.co/auth/v1/callback`); add that exact URL to the Google client's **Authorized redirect URIs**.
3. In Supabase **Authentication → URL Configuration**, set the Site URL to your Aura website origin and add the local development origin and deployed Aura origin to the redirect URL allow list (for example `http://127.0.0.1:3000` and `https://aura.example.com`).
4. Configure the Aura server environment:

   ```text
   GEMINI_API_KEY=your_gemini_key
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_ANON_KEY=your_supabase_publishable_or_anon_key
   PUBLIC_ORIGIN=https://aura.example.com
   HOST=0.0.0.0
   PORT=3000
   ```

   `SUPABASE_ANON_KEY` is the project's public anon/publishable key, not its service-role key. Never put a service-role key or `GEMINI_API_KEY` in browser code. `PUBLIC_ORIGIN` must be the exact public origin (scheme and host, no path); the cloud server uses it to reject requests from other sites.
5. Deploy the project to a Python host that runs `python server.py`, provides HTTPS, and forwards requests to the configured port. Set the environment values in the host's secret/configuration settings, then add the deployed HTTPS origin to both Google and Supabase redirect configuration. The app and its `/api` endpoints must be served from the same origin.

The app loads Supabase's browser client from jsDelivr only when cloud sign-in is configured. Google sign-in is handled by Supabase Auth; Aura's Python server verifies each user's Supabase access token before accessing chat endpoints. Chats are stored in Supabase and protected by database row-level security. Existing local chats in `data/chats.json` or `data/history.json` are not uploaded automatically; they remain on the computer where they were created.

After Google sign-in, new users complete a short profile with their first name, last name, and a self-reported answer to whether they are 18 or older. Both age answers can continue into Aura. These details are saved to the user's Supabase Auth profile metadata; the age answer is not independently verified.

## Run locally

1. Install Python 3.
2. Start Aura from its folder:
   - Windows PowerShell: `$env:PORT = "3000"; py server.py`
   - Or: `python server.py` with `PORT=3000` set in the environment.
3. Open [http://127.0.0.1:3000](http://127.0.0.1:3000). This address works only on the computer running Aura.

Without `SUPABASE_URL` and `SUPABASE_ANON_KEY`, Aura uses local-only mode and saves chats in the `data` folder. For local development with Google login and cloud chat history enabled, configure Supabase's redirect URL allow list to include `http://127.0.0.1:3000`, then set `PUBLIC_ORIGIN=http://127.0.0.1:3000` along with your Supabase settings before starting the server. Open the same [http://127.0.0.1:3000](http://127.0.0.1:3000) address after startup. Closing the terminal stops the local server. Do not open `index.html` directly; Aura needs its backend server.

The redesigned workspace includes a responsive navigation drawer, searchable and date-grouped chat history, suggested prompts, voice input, file attachments, and formatted assistant responses with copy and regenerate controls. Open **Prompt Studio** in the sidebar to discover 20 practical templates across Education, Software Development, Business, Writing & Communication, Marketing, Research & Analysis, Productivity, and Creative & Design. Search and filter the collection, save prompts, revisit recent prompts, customize required inputs, inspect the full prompt, then copy it or load it into the chat composer. Saved and recently used prompt IDs are stored in the signed-in user's Supabase Auth profile metadata in cloud mode, and in browser storage in local-only mode. Use the sidebar to switch between Assistant, Prompt Studio, saved Chats, web Search, and Settings. Choose **New chat** (or press **Ctrl/Cmd + K**) to start a conversation; use the history search and delete controls to manage saved chats. Settings let you choose a light appearance and whether Enter sends a message; Shift + Enter inserts a line break.

## Privacy and limitations

Google account data is used for sign-in. In cloud mode, chat text and titles are stored in the configured Supabase project under the user's account. Chat prompts and supported attachments are sent to Google's Gemini API; attachments themselves are not retained in chat history. Website and desktop app actions are available only in local-only mode. Do not upload sensitive information.
