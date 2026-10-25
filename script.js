const statusText = document.getElementById("status");
const transcript = document.getElementById("transcript");
const setupNote = document.getElementById("setupNote");
const listenButton = document.getElementById("listenButton");
const stopButton = document.getElementById("stopButton");
const orbWrap = document.getElementById("orbWrap");
const commandInput = document.getElementById("commandInput");
const chatMessages = document.getElementById("chatMessages");
const chatList = document.getElementById("chatList");
const allChatList = document.getElementById("allChatList");
const newChatButton = document.getElementById("newChatButton");
const newChatPageButton = document.getElementById("newChatPageButton");
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
const API_REQUEST_TIMEOUT_MS = 45000;
const AI_REQUEST_TIMEOUT_MS = 115000;
let recognition;
let conversation = [];
let selectedChatId = null;
let selectedFile = null;
let attachmentPreviewUrl = null;

function setChatAccess(enabled) {
  newChatButton.disabled = !enabled;
  newChatPageButton.disabled = !enabled;
  commandInput.disabled = !enabled;
  document.querySelector(".send").disabled = !enabled;
  listenButton.disabled = !enabled || !SpeechRecognition;
  attachmentInput.disabled = !enabled;
  attachmentButton.disabled = !enabled;
  chooseFileButton.disabled = !enabled;
  removeAttachmentButton.disabled = !enabled;
  document.querySelectorAll("[data-command]").forEach((button) => {
    button.disabled = !enabled;
  });
}

function showPage(pageName) {
  document.querySelectorAll(".view-page").forEach((page) => {
    page.hidden = page.dataset.page !== pageName;
  });
  document.querySelectorAll("[data-page-target]").forEach((button) => {
    const isCurrentPage = button.dataset.pageTarget === pageName;
    button.classList.toggle("active", isCurrentPage);
    if (isCurrentPage) button.setAttribute("aria-current", "page");
    else button.removeAttribute("aria-current");
  });
}

async function apiFetch(url, options = {}) {
  const timeoutMs = url === "/api/chat" ? AI_REQUEST_TIMEOUT_MS : API_REQUEST_TIMEOUT_MS;
  return fetchWithTimeout(url, options, timeoutMs);
}

async function fetchWithTimeout(url, options, timeoutMs) {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } catch (error) {
    if (error.name === "AbortError") {
      throw new Error(`The request timed out after ${Math.ceil(timeoutMs / 1000)} seconds. Check your connection and try again.`);
    }
    throw error;
  } finally {
    window.clearTimeout(timeoutId);
  }
}

function showChatLoadError(error) {
  const message = `Could not load your chats: ${error.message}`;
  statusText.textContent = message;
  chatMessages.replaceChildren();
  const prompt = document.createElement("p");
  prompt.className = "chat-empty";
  prompt.textContent = message;
  chatMessages.append(prompt);

  [chatList, allChatList].forEach((list) => {
    list.replaceChildren();
    const notice = document.createElement("p");
    notice.className = "sidebar-chat-empty";
    notice.textContent = "Could not load chats.";
    const retryButton = document.createElement("button");
    retryButton.className = "sidebar-chat-item";
    retryButton.type = "button";
    retryButton.textContent = "Retry";
    retryButton.addEventListener("click", initializeLocalChats);
    list.append(notice, retryButton);
  });
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

document.querySelectorAll("[data-page-target]").forEach((button) => {
  button.addEventListener("click", () => {
    showPage(button.dataset.pageTarget);
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

function renderChatList(chats, target = chatList) {
  target.replaceChildren();
  if (chats.length === 0) {
    const empty = document.createElement("p");
    empty.className = "sidebar-chat-empty";
    empty.textContent = "No chats yet.";
    target.append(empty);
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
    target.append(row);
  });
}

async function refreshChatList() {
  const response = await apiFetch("/api/chats");
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Could not load saved chats.");
  renderChatList(data.chats);
  renderChatList(data.chats, allChatList);
  return { chats: data.chats, activeChat: data.activeChat || null };
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
  allChatList.querySelectorAll(".sidebar-chat-item").forEach((button) => {
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
    renderChatList(data.chats, allChatList);
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
    showPage("chat");
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
    renderChatList(data.chats, allChatList);
    showPage("chat");
    commandInput.focus();
  } catch (error) {
    statusText.textContent = error.message;
  } finally {
    newChatButton.disabled = false;
  }
}

async function loadChats() {
  const { chats, activeChat } = await refreshChatList();
  if (chats.length === 0) {
    await createChat();
    return;
  }
  if (activeChat) {
    renderChat(activeChat);
    return;
  }
  await openChat(chats[0].id);
}

async function initializeLocalChats() {
  setChatAccess(false);
  try {
    await loadChats();
    if (!selectedChatId) throw new Error("Could not load or create a chat.");
    setChatAccess(true);
    statusText.textContent = "Chats are saved on this computer.";
  } catch (error) {
    showChatLoadError(error);
    setChatAccess(false);
  }
}

async function checkAiStatus() {
  const response = await fetchWithTimeout("/api/status", {}, API_REQUEST_TIMEOUT_MS);
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
  const slowResponseTimer = window.setTimeout(() => {
    const label = loadingIndicator.querySelector(".typing-label");
    if (!label) return;
    label.textContent = "Still waiting for a response";
    loadingIndicator.setAttribute("aria-label", "Still waiting for a response");
    statusText.textContent = "This is taking longer than usual. Still waiting for a response…";
  }, 15000);
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
    window.clearTimeout(slowResponseTimer);
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
newChatPageButton.addEventListener("click", createChat);

checkAiStatus().catch((error) => {
  setupNote.textContent = `Could not check Gemini API status: ${error.message}`;
});

initializeLocalChats();
