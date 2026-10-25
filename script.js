const statusText = document.getElementById("status");
const transcript = document.getElementById("transcript");
const setupNote = document.getElementById("setupNote");
const listenButton = document.getElementById("listenButton");
const stopButton = document.getElementById("stopButton");
const orbWrap = document.getElementById("orbWrap");
const commandInput = document.getElementById("commandInput");
const chatMessages = document.getElementById("chatMessages");
const chatList = document.getElementById("chatList");
const newChatButton = document.getElementById("newChatButton");
const signInButton = document.getElementById("signInButton");
const signOutButton = document.getElementById("signOutButton");
const signedInAccount = document.getElementById("signedInAccount");
const accountHint = document.getElementById("accountHint");
const accountName = document.getElementById("accountName");
const accountEmail = document.getElementById("accountEmail");
const accountAvatar = document.getElementById("accountAvatar");
const attachmentInput = document.getElementById("attachmentInput");
const attachmentButton = document.getElementById("attachmentButton");
const chooseFileButton = document.getElementById("chooseFileButton");
const uploadMenu = document.getElementById("uploadMenu");
const attachmentPreview = document.getElementById("attachmentPreview");
const attachmentThumb = document.getElementById("attachmentThumb");
const attachmentFileName = document.getElementById("attachmentFileName");
const removeAttachmentButton = document.getElementById("removeAttachmentButton");
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const MAX_CONVERSATION_MESSAGES = 10;
const MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024;
let recognition;
let conversation = [];
let selectedChatId = null;
let selectedFile = null;
let attachmentPreviewUrl = null;
let supabaseClient = null;
let activeSession = null;
let loadedUserId = null;
let localMode = false;

function setChatAccess(isSignedIn) {
  newChatButton.disabled = !isSignedIn;
  commandInput.disabled = !isSignedIn;
  document.querySelector(".send").disabled = !isSignedIn;
  listenButton.disabled = !isSignedIn || !SpeechRecognition;
  attachmentInput.disabled = !isSignedIn;
  attachmentButton.disabled = !isSignedIn;
  chooseFileButton.disabled = !isSignedIn;
  removeAttachmentButton.disabled = !isSignedIn;
  document.querySelectorAll("[data-command]").forEach((button) => {
    button.disabled = !isSignedIn;
  });
}

function showSignedOutState(message = "Sign in with Google to see your saved chats.") {
  loadedUserId = null;
  selectedChatId = null;
  conversation = [];
  attachmentInput.value = "";
  showSelectedAttachment(null);
  setChatAccess(false);
  signedInAccount.hidden = true;
  signInButton.hidden = false;
  chatList.replaceChildren();
  const empty = document.createElement("p");
  empty.className = "sidebar-chat-empty";
  empty.textContent = message;
  chatList.append(empty);
  chatMessages.replaceChildren();
  const prompt = document.createElement("p");
  prompt.className = "chat-empty";
  prompt.textContent = "Sign in with Google to start chatting and save your conversations.";
  chatMessages.append(prompt);
}

showSignedOutState("Loading sign-in settings…");

async function apiFetch(url, options = {}) {
  if (localMode) return fetch(url, options);

  const { data, error } = await supabaseClient.auth.getSession();
  if (error) throw error;
  activeSession = data.session;
  if (!activeSession) throw new Error("Sign in with Google to continue.");

  const headers = new Headers(options.headers || {});
  headers.set("Authorization", `Bearer ${activeSession.access_token}`);
  return fetch(url, { ...options, headers });
}

async function loadSignedInUser(session) {
  const user = session.user;
  const displayName = user.user_metadata?.full_name || user.user_metadata?.name
    || user.email?.split("@")[0] || "Google user";
  accountName.textContent = displayName;
  accountEmail.textContent = user.email || "";
  accountAvatar.textContent = displayName.slice(0, 1).toUpperCase();
  accountHint.textContent = "Continue with Google";
  signInButton.hidden = true;
  signedInAccount.hidden = false;
  setChatAccess(false);

  const migrationResponse = await apiFetch("/api/migrate-local-chats", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({})
  });
  const migration = await migrationResponse.json();
  if (!migrationResponse.ok) throw new Error(migration.error || "Could not import existing chats.");
  if (migration.migrated > 0) {
    statusText.textContent = `Imported ${migration.migrated} existing chat${migration.migrated === 1 ? "" : "s"} to your account.`;
  }

  await loadChats();
  if (activeSession?.user.id === user.id) setChatAccess(true);
}

async function applyAuthSession(session) {
  activeSession = session;
  if (!session) {
    showSignedOutState();
    return;
  }
  if (loadedUserId === session.user.id) return;

  loadedUserId = session.user.id;
  try {
    await loadSignedInUser(session);
    if (activeSession?.user.id !== session.user.id) return;
  } catch (error) {
    if (activeSession?.user.id === session.user.id) {
      statusText.textContent = error.message;
      setChatAccess(false);
      loadedUserId = null;
    }
  }
}

async function initializeAuth() {
  const response = await fetch("/api/config");
  const config = await response.json();
  if (!response.ok) throw new Error(config.error || "Could not load sign-in settings.");
  if (!config.cloudConfigured) {
    if (config.localMode) {
      localMode = true;
      accountHint.textContent = "Local only — configure Supabase to sign in";
      statusText.textContent = "Chats are saved only on this computer until Supabase is configured.";
      await loadChats();
      setChatAccess(true);
      return;
    }
    accountHint.textContent = "Supabase setup required";
    statusText.textContent = "Add your Supabase URL and anon key to enable Google sign-in.";
    showSignedOutState("Set up Supabase to enable saved chats.");
    return;
  }
  if (!window.supabase?.createClient) {
    accountHint.textContent = "Could not load Google sign-in";
    showSignedOutState("Refresh this page and check your connection.");
    throw new Error("Could not load the Supabase sign-in library.");
  }

  supabaseClient = window.supabase.createClient(config.supabaseUrl, config.supabaseAnonKey, {
    auth: { autoRefreshToken: true, detectSessionInUrl: true, persistSession: true }
  });
  signInButton.disabled = false;
  signInButton.addEventListener("click", async () => {
    signInButton.disabled = true;
    try {
      const { error } = await supabaseClient.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: config.appOrigin || window.location.origin }
      });
      if (error) throw error;
    } catch (error) {
      statusText.textContent = `Google sign-in failed: ${error.message}`;
    } finally {
      signInButton.disabled = false;
    }
  });
  signOutButton.addEventListener("click", async () => {
    signOutButton.disabled = true;
    try {
      const { error } = await supabaseClient.auth.signOut();
      if (error) throw error;
    } catch (error) {
      statusText.textContent = `Could not sign out: ${error.message}`;
    } finally {
      signOutButton.disabled = false;
    }
  });
  supabaseClient.auth.onAuthStateChange((event, session) => {
    if (event === "INITIAL_SESSION") return;
    activeSession = session;
    window.setTimeout(() => applyAuthSession(session), 0);
  });
  const { data, error } = await supabaseClient.auth.getSession();
  if (error) throw error;
  await applyAuthSession(data.session);
}

const ATTACHMENT_MIME_TYPES = {
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  webp: "image/webp",
  gif: "image/gif",
  pdf: "application/pdf",
  txt: "text/plain",
  md: "text/markdown",
  csv: "text/csv",
  json: "application/json"
};

function getAttachmentMimeType(file) {
  if (Object.values(ATTACHMENT_MIME_TYPES).includes(file.type)) return file.type;
  const extension = file.name.split(".").pop().toLowerCase();
  return ATTACHMENT_MIME_TYPES[extension] || "";
}

function readAttachment(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = String(reader.result || "");
      const comma = dataUrl.indexOf(",");
      if (comma < 0) return reject(new Error("Aura couldn't read that file."));
      resolve({
        name: file.name,
        mimeType: getAttachmentMimeType(file),
        data: dataUrl.slice(comma + 1)
      });
    };
    reader.onerror = () => reject(new Error("Aura couldn't read that file."));
    reader.readAsDataURL(file);
  });
}

function showSelectedAttachment(file) {
  selectedFile = file;
  attachmentPreview.hidden = !file;
  attachmentThumb.replaceChildren();
  attachmentFileName.textContent = file ? file.name : "";
  if (attachmentPreviewUrl) URL.revokeObjectURL(attachmentPreviewUrl);
  attachmentPreviewUrl = null;
  if (!file) return;

  const mimeType = getAttachmentMimeType(file);
  if (mimeType.startsWith("image/")) {
    const image = document.createElement("img");
    image.alt = `Preview of ${file.name}`;
    attachmentPreviewUrl = URL.createObjectURL(file);
    image.src = attachmentPreviewUrl;
    attachmentThumb.append(image);
  } else {
    const fileType = document.createElement("span");
    fileType.className = "file-type-icon";
    fileType.textContent = file.name.split(".").pop().slice(0, 4).toUpperCase();
    attachmentThumb.append(fileType);
  }
}

function setUploadMenuOpen(isOpen) {
  uploadMenu.hidden = !isOpen;
  attachmentButton.setAttribute("aria-expanded", String(isOpen));
}

attachmentButton.addEventListener("click", () => setUploadMenuOpen(uploadMenu.hidden));
chooseFileButton.addEventListener("click", () => {
  setUploadMenuOpen(false);
  attachmentInput.click();
});
document.addEventListener("click", (event) => {
  if (!event.target.closest(".attachment-picker")) setUploadMenuOpen(false);
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") setUploadMenuOpen(false);
});
attachmentInput.addEventListener("change", () => {
  const file = attachmentInput.files[0] || null;
  if (file && file.size > MAX_ATTACHMENT_BYTES) {
    attachmentInput.value = "";
    showSelectedAttachment(null);
    statusText.textContent = "Choose a file smaller than 10 MB.";
    return;
  }
  if (file && !getAttachmentMimeType(file)) {
    attachmentInput.value = "";
    showSelectedAttachment(null);
    statusText.textContent = "Use a photo, PDF, TXT, Markdown, CSV, or JSON file.";
    return;
  }
  showSelectedAttachment(file);
  if (file) statusText.textContent = "File attached. Ask Aura a question about it.";
});
removeAttachmentButton.addEventListener("click", () => {
  attachmentInput.value = "";
  showSelectedAttachment(null);
});

document.querySelectorAll("[data-scroll-target]").forEach((button) => {
  button.addEventListener("click", () => {
    const target = document.getElementById(button.dataset.scrollTarget);
    if (!target) return;
    target.scrollIntoView({ behavior: "smooth", block: "start" });
    if (button.classList.contains("nav-item")) {
      document.querySelectorAll(".nav-item").forEach((item) => {
        item.classList.remove("active");
        item.removeAttribute("aria-current");
      });
      button.classList.add("active");
      button.setAttribute("aria-current", "page");
    }
  });
});

function openUrl(url) {
  const parsedUrl = new URL(url);
  const isIpAddress = /^\d{1,3}(?:\.\d{1,3}){3}$/.test(parsedUrl.hostname)
    || parsedUrl.hostname.startsWith("[");
  if (
    parsedUrl.protocol !== "https:"
    || parsedUrl.username
    || parsedUrl.password
    || isIpAddress
    || !parsedUrl.hostname.includes(".")
  ) {
    throw new Error("Aura can only open public HTTPS websites.");
  }

  const openedWindow = window.open(parsedUrl.href, "_blank");
  if (openedWindow) openedWindow.opener = null;
  return Boolean(openedWindow);
}

function setListening(isListening) {
  orbWrap.classList.toggle("listening", isListening);
  listenButton.disabled = isListening;
  stopButton.disabled = !isListening;
  if (isListening) statusText.textContent = "Listening…";
  else if (statusText.textContent === "Listening…") statusText.textContent = "Ready when you are";
}

function speak(message) {
  if ("speechSynthesis" in window) {
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(new SpeechSynthesisUtterance(message));
  }
}

function makeActionPrompt(action, confirmationToken) {
  const prompt = document.createElement("div");
  prompt.className = "action-prompt";
  const approveButton = document.createElement("button");
  approveButton.type = "button";
  approveButton.textContent = action.type === "open-url"
    ? `Approve and open ${new URL(action.url).hostname}`
    : `Approve and open ${action.appName || "the app"}`;
  const cancelButton = document.createElement("button");
  cancelButton.type = "button";
  cancelButton.className = "cancel-action";
  cancelButton.textContent = "Cancel";

  cancelButton.addEventListener("click", () => {
    prompt.textContent = "Action cancelled.";
  });
  approveButton.addEventListener("click", async () => {
    approveButton.disabled = true;
    cancelButton.disabled = true;
    try {
      let message;
      if (action.type === "open-url") {
        if (!openUrl(action.url)) {
          throw new Error("The browser blocked the new tab. Allow pop-ups for Aura and approve again.");
        }
        message = "Website opened.";
      } else if (action.type === "launch-app") {
        const response = await apiFetch("/api/actions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ confirmationToken })
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "The app could not be opened.");
        message = data.message;
      } else {
        throw new Error("Aura cannot perform that action.");
      }
      prompt.textContent = message;
      statusText.textContent = message;
      speak(message);
    } catch (error) {
      prompt.textContent = error.message;
      statusText.textContent = error.message;
    }
  });

  prompt.append(approveButton, cancelButton);
  return prompt;
}

function addChatMessage(role, content, action) {
  const emptyMessage = chatMessages.querySelector(".chat-empty");
  if (emptyMessage) emptyMessage.remove();

  const message = document.createElement("article");
  message.className = `chat-message ${role}`;
  const text = document.createElement("div");
  text.textContent = content;
  message.append(text);
  if (action) message.append(makeActionPrompt(action, action.confirmationToken));
  chatMessages.append(message);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

function addLoadingIndicator() {
  const indicator = document.createElement("div");
  indicator.className = "chat-message assistant typing-indicator";
  indicator.setAttribute("role", "status");
  indicator.setAttribute("aria-label", "Aura is thinking");
  for (let index = 0; index < 3; index += 1) {
    const dot = document.createElement("span");
    dot.className = "typing-dot";
    dot.setAttribute("aria-hidden", "true");
    indicator.append(dot);
  }
  const label = document.createElement("span");
  label.className = "typing-label";
  label.textContent = "Aura is thinking";
  indicator.append(label);
  chatMessages.append(indicator);
  chatMessages.scrollTop = chatMessages.scrollHeight;
  return indicator;
}

function renderChatList(chats) {
  chatList.replaceChildren();
  if (chats.length === 0) {
    const empty = document.createElement("p");
    empty.className = "sidebar-chat-empty";
    empty.textContent = "No chats yet.";
    chatList.append(empty);
    return;
  }

  chats.forEach((chat) => {
    const row = document.createElement("div");
    row.className = "sidebar-chat-row";

    const selectButton = document.createElement("button");
    selectButton.className = "sidebar-chat-item";
    selectButton.type = "button";
    selectButton.dataset.chatId = chat.id;
    selectButton.textContent = chat.title || "New chat";
    selectButton.title = chat.title || "New chat";
    selectButton.setAttribute("aria-current", String(chat.id === selectedChatId));
    selectButton.addEventListener("click", () => openChat(chat.id));

    const deleteButton = document.createElement("button");
    deleteButton.className = "sidebar-chat-delete";
    deleteButton.type = "button";
    deleteButton.textContent = "×";
    deleteButton.setAttribute("aria-label", `Delete chat: ${chat.title || "New chat"}`);
    deleteButton.title = "Delete chat";
    deleteButton.addEventListener("click", () => deleteChat(chat.id, chat.title || "New chat"));

    row.append(selectButton, deleteButton);
    chatList.append(row);
  });
}

async function refreshChatList() {
  const response = await apiFetch("/api/chats");
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Could not load saved chats.");
  renderChatList(data.chats);
  return data.chats;
}

function renderChat(chat) {
  selectedChatId = chat.id;
  conversation = chat.messages
    .filter((message) => message.role === "user" || message.role === "assistant")
    .slice(-MAX_CONVERSATION_MESSAGES);
  chatMessages.replaceChildren();
  if (conversation.length === 0) {
    const empty = document.createElement("p");
    empty.className = "chat-empty";
    empty.textContent = "Your conversation with Aura will appear here.";
    chatMessages.append(empty);
  } else {
    conversation.forEach((message) => {
      const attachmentName = message.attachmentName ? `\n📎 ${message.attachmentName}` : "";
      addChatMessage(message.role, `${message.content}${attachmentName}`);
    });
  }
  chatList.querySelectorAll(".sidebar-chat-item").forEach((button) => {
    button.setAttribute("aria-current", String(button.dataset.chatId === selectedChatId));
  });
}

async function deleteChat(chatId, title) {
  if (!window.confirm(`Delete "${title}"? This cannot be undone.`)) return;

  try {
    const response = await apiFetch(`/api/chats/${encodeURIComponent(chatId)}`, { method: "DELETE" });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Could not delete this chat.");

    renderChatList(data.chats);
    if (chatId === selectedChatId) {
      selectedChatId = null;
      if (data.chats.length > 0) {
        await openChat(data.chats[0].id);
      } else {
        await createChat();
      }
    }
  } catch (error) {
    statusText.textContent = error.message;
  }
}

async function openChat(chatId) {
  try {
    const response = await apiFetch(`/api/chats/${encodeURIComponent(chatId)}`);
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Could not open this chat.");
    renderChat(data.chat);
  } catch (error) {
    statusText.textContent = error.message;
  }
}

async function createChat() {
  newChatButton.disabled = true;
  try {
    const response = await apiFetch("/api/chats", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({})
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Could not create a new chat.");
    renderChat(data.chat);
    renderChatList(data.chats);
    commandInput.focus();
  } catch (error) {
    statusText.textContent = error.message;
  } finally {
    newChatButton.disabled = !(localMode || activeSession);
  }
}

async function loadChats() {
  const chats = await refreshChatList();
  if (chats.length === 0) {
    await createChat();
    return;
  }
  await openChat(chats[0].id);
}

async function checkAiStatus() {
  const response = await fetch("/api/status");
  if (!response.ok) throw new Error("Could not check Gemini API setup.");
  const data = await response.json();
  setupNote.textContent = data.aiConfigured
    ? `${data.provider} is ready (${data.model}).`
    : data.message;
}

async function sendChat(rawMessage) {
  const content = rawMessage.trim();
  if (!content) return;

  transcript.textContent = `You said: “${content}”`;
  const displayContent = selectedFile ? `${content}\n📎 ${selectedFile.name}` : content;
  addChatMessage("user", displayContent);
  statusText.textContent = "Aura is thinking…";
  const loadingIndicator = addLoadingIndicator();
  commandInput.disabled = true;
  document.querySelector(".send").disabled = true;

  const userMessage = { role: "user", content };
  const messages = [...conversation, userMessage].slice(-(MAX_CONVERSATION_MESSAGES + 1));
  const chatId = selectedChatId;
  try {
    const attachment = selectedFile ? await readAttachment(selectedFile) : null;
    const response = await apiFetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chatId, messages, attachment })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Aura could not get a response.");
    if (typeof data.reply !== "string") throw new Error("Aura received an invalid response.");

    loadingIndicator.remove();
    conversation = [...messages, { role: "assistant", content: data.reply }]
      .slice(-MAX_CONVERSATION_MESSAGES);
    addChatMessage("assistant", data.reply, data.action || null);
    statusText.textContent = data.action ? "Action needs your approval" : "Ready when you are";
    speak(data.reply);
    await refreshChatList();
  } catch (error) {
    loadingIndicator.remove();
    addChatMessage("assistant", error.message);
    statusText.textContent = error.message;
  } finally {
    commandInput.disabled = false;
    document.querySelector(".send").disabled = false;
    commandInput.focus();
  }
}

if (SpeechRecognition) {
  recognition = new SpeechRecognition();
  recognition.lang = navigator.language || "en-US";
  recognition.continuous = false;
  recognition.interimResults = false;

  recognition.onstart = () => setListening(true);
  recognition.onend = () => setListening(false);
  recognition.onresult = (event) => sendChat(event.results[0][0].transcript);
  recognition.onerror = (event) => {
    setListening(false);
    const messages = {
      "not-allowed": "Microphone access was blocked. Allow it in your browser settings.",
      "no-speech": "I didn't hear anything. Please try again.",
      "audio-capture": "No microphone was found."
    };
    statusText.textContent = messages[event.error] || `Voice recognition error: ${event.error}`;
  };

  listenButton.addEventListener("click", () => {
    try {
      recognition.start();
    } catch (error) {
      statusText.textContent = `Unable to start voice recognition: ${error.message}`;
    }
  });
  stopButton.addEventListener("click", () => recognition.stop());
} else {
  listenButton.disabled = true;
  statusText.textContent = "Voice recognition is not supported in this browser";
  transcript.textContent = "Try Chrome or Edge, or type a message below.";
}

document.getElementById("commandForm").addEventListener("submit", (event) => {
  event.preventDefault();
  const message = commandInput.value;
  commandInput.value = "";
  sendChat(message);
});

document.querySelectorAll("[data-command]").forEach((button) => {
  button.addEventListener("click", () => sendChat(button.dataset.command));
});

newChatButton.addEventListener("click", createChat);

Promise.all([checkAiStatus(), initializeAuth()]).catch((error) => {
  setupNote.textContent = error.message;
});
