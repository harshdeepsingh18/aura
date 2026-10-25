const googleSignInButton = document.getElementById("googleSignInButton");
const authStatus = document.getElementById("authStatus");

async function initializeSignIn() {
  try {
    const response = await fetch("/api/config");
    const config = await response.json();
    if (!response.ok) throw new Error(config.error || "Could not load sign-in settings.");

    if (!config.cloudConfigured) {
      authStatus.textContent = "Google sign-in is unavailable until Supabase is configured.";
      return;
    }
    if (!window.supabase?.createClient) {
      throw new Error("Could not load the sign-in service. Check your connection and refresh.");
    }

    const supabase = window.supabase.createClient(config.supabaseUrl, config.supabaseAnonKey, {
      auth: { autoRefreshToken: true, detectSessionInUrl: true, persistSession: true }
    });
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    if (data.session) {
      window.location.replace("/");
      return;
    }

    googleSignInButton.disabled = false;
    googleSignInButton.addEventListener("click", async () => {
      googleSignInButton.disabled = true;
      authStatus.textContent = "Connecting to Google…";
      try {
        const { error: signInError } = await supabase.auth.signInWithOAuth({
          provider: "google",
          options: { redirectTo: config.appOrigin || window.location.origin }
        });
        if (signInError) throw signInError;
      } catch (error) {
        authStatus.textContent = `Google sign-in failed: ${error.message}`;
        googleSignInButton.disabled = false;
      }
    });
  } catch (error) {
    authStatus.textContent = error.message;
  }
}

initializeSignIn();
