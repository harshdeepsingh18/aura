# Aura AI

Aura is a Python web app with AI chat powered by Google's Gemini API. It supports local-only chats or Google and GitHub sign-in with Supabase-backed chat history that follows the signed-in user across devices.

## Cloud setup: Google or GitHub sign-in and synced chats

1. Create a Supabase project and run [`supabase/schema.sql`](./supabase/schema.sql) in its SQL Editor. It enables and forces row-level security on `public.chats`, removes table access from `public` and `anon`, and grants authenticated users CRUD access only to rows whose `user_id` matches `auth.uid()`. The Aura server sends each signed-in user's access token to Supabase for chat operations, so these policies are enforced by the database.
2. Set up one or both sign-in providers:
   - **Google:** In Google Cloud Console, create a **Web application** OAuth client. Add your Aura website origin to **Authorized JavaScript origins**. In Supabase, enable **Authentication → Sign In / Providers → Google**, then enter the Google client ID and client secret. Supabase shows its OAuth callback URL (usually `https://<project-ref>.supabase.co/auth/v1/callback`); add that exact URL to the Google client's **Authorized redirect URIs**.
   - **GitHub:** Create an **OAuth App** in GitHub Developer Settings. Set its homepage URL to your Aura website origin. In Supabase, open **Authentication → Sign In / Providers → GitHub**, turn **GitHub Enabled** on, and copy the callback URL shown there into the GitHub app's **Authorization callback URL**. Add both the GitHub client ID and client secret to Supabase, then save. A client ID alone is not enough; if the provider is disabled Supabase returns `Unsupported provider: provider is not enabled`. New users can create their Aura account by choosing either provider, provided sign-ups are enabled in Supabase. See the [Supabase GitHub sign-in guide](https://supabase.com/docs/guides/auth/social-sign-in/auth-github) for the current provider setup steps.
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
5. Deploy the project to a Python host that runs `python server.py`, provides HTTPS, and forwards requests to the configured port. Set the environment values in the host's secret/configuration settings, then add the deployed HTTPS origin to each configured provider and Supabase redirect configuration. The app and its `/api` endpoints must be served from the same origin.

For local development, copy [`.env.example`](./.env.example) to `.env` and add your own values. `.env` files are ignored by Git; do not commit them or paste secret keys into source code. The Gemini key stays on the Python server. The Supabase anon/publishable key is sent to the browser for sign-in and is designed to be public; protect data with Supabase row-level security and never use a service-role key in Aura.

The app loads Supabase's browser client from jsDelivr only when cloud sign-in is configured. Google and GitHub sign-in are handled by Supabase Auth; Aura's Python server verifies each user's Supabase access token before accessing chat endpoints. Chats are stored in Supabase and protected by database row-level security. Existing local chats in `data/chats.json` or `data/history.json` are not uploaded automatically; they remain on the computer where they were created.

After Google or GitHub sign-in, new users complete a short profile with their first name, last name, and a self-reported answer to whether they are 18 or older. Both age answers can continue into Aura. These details are saved to the user's Supabase Auth profile metadata; the age answer is not independently verified.

## Run locally

1. Install Python 3.
2. Start Aura from its folder:
   - Windows PowerShell: `$env:PORT = "3000"; py server.py`
   - Or: `python server.py` with `PORT=3000` set in the environment.
3. Open [http://127.0.0.1:3000](http://127.0.0.1:3000). This address works only on the computer running Aura.

Without `SUPABASE_URL` and `SUPABASE_ANON_KEY`, Aura uses local-only mode and saves chats in the `data` folder. For local development with Google or GitHub login and cloud chat history enabled, configure Supabase's redirect URL allow list to include `http://127.0.0.1:3000`, then set `PUBLIC_ORIGIN=http://127.0.0.1:3000` along with your Supabase settings before starting the server. Open the same [http://127.0.0.1:3000](http://127.0.0.1:3000) address after startup. Closing the terminal stops the local server. Do not open `index.html` directly; Aura needs its backend server.

The redesigned workspace includes a responsive navigation drawer, searchable and date-grouped chat history, suggested prompts, voice input, file attachments, and formatted assistant responses with copy and regenerate controls. Open **Prompt Studio** in the sidebar to discover 20 practical templates across Education, Software Development, Business, Writing & Communication, Marketing, Research & Analysis, Productivity, and Creative & Design. Search and filter the collection, save prompts, revisit recent prompts, customize required inputs, inspect the full prompt, then copy it or load it into the chat composer. Saved and recently used prompt IDs are stored in the signed-in user's Supabase Auth profile metadata in cloud mode, and in browser storage in local-only mode. Use the sidebar to switch between Assistant, Prompt Studio, saved Chats, web Search, and Settings. Choose **New chat** (or press **Ctrl/Cmd + K**) to start a conversation; use the history search and delete controls to manage saved chats. Settings let you choose a light appearance, the interface and AI response language (English, Hindi, Spanish, French, or Punjabi), and whether Enter sends a message; Shift + Enter inserts a line break.

Ask Aura to add a named task or event on a date, for example, “Add a task to call Sam on 14/09/2026.” Date-only tasks are all-day calendar entries; include a time to create a timed event (one hour by default). Aura shows a confirmation before acting. Approved calendar entries open a prefilled Google Calendar page and download a standard `.ics` file that can be imported into other calendar apps. You can also set alarms, for example, “Set an alarm for 7:30 PM” or “Remind me to take medicine tomorrow at 8 AM.” Approved alarms are saved in this browser and use browser notifications when allowed; Aura must remain open for an alarm to trigger. Alarm storage is local to the browser and is not synced across devices.

## Privacy and limitations

Google or GitHub account data is used for sign-in. In cloud mode, chat text and titles are stored in the configured Supabase project under the user's account. Chat prompts and supported attachments are sent to Google's Gemini API; attachments themselves are not retained in chat history. Website and desktop app actions are available only in local-only mode. Do not upload sensitive information.
