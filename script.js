const statusText = document.getElementById("status");
const transcript = document.getElementById("transcript");
const listenButton = document.getElementById("listenButton");
const stopButton = document.getElementById("stopButton");
const orbWrap = document.getElementById("orbWrap");
const commandInput = document.getElementById("commandInput");
const historyList = document.getElementById("historyList");
const clearHistoryButton = document.getElementById("clearHistoryButton");
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
let recognition;
let voiceTab = null;

function prepareVoiceTab() {
  voiceTab = window.open("about:blank", "_blank");
}

function closeVoiceTab() {
  if (voiceTab && !voiceTab.closed) voiceTab.close();
  voiceTab = null;
}

function openUrl(url) {
  const parsedUrl = new URL(url);
  const allowedHosts = new Set(["youtube.com", "www.youtube.com", "google.com", "www.google.com"]);
  if (parsedUrl.protocol !== "https:" || !allowedHosts.has(parsedUrl.hostname)) {
    throw new Error("The server returned an unsupported website address.");
  }

  if (voiceTab && !voiceTab.closed) {
    voiceTab.location.href = parsedUrl.href;
    voiceTab = null;
    return true;
  }
  return Boolean(window.open(parsedUrl.href, "_blank", "noopener,noreferrer"));
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

function renderHistory(entries) {
  historyList.replaceChildren();
  if (entries.length === 0) {
    const empty = document.createElement("li");
    empty.className = "history-empty";
    empty.textContent = "No commands yet.";
    historyList.append(empty);
    return;
  }

  entries.forEach((entry) => {
    const item = document.createElement("li");
    item.className = "history-item";
    item.append(document.createTextNode(entry.command));
    const time = document.createElement("time");
    time.dateTime = entry.createdAt;
    time.textContent = new Date(entry.createdAt).toLocaleString();
    item.append(time);
    historyList.append(item);
  });
}

async function loadHistory() {
  const response = await fetch("/api/history");
  if (!response.ok) throw new Error("Could not load command history.");
  const data = await response.json();
  renderHistory(data.history);
}

async function runCommand(rawCommand) {
  const command = rawCommand.trim();
  if (!command) {
    closeVoiceTab();
    return;
  }

  transcript.textContent = `You said: “${command}”`;
  statusText.textContent = "Working on it…";

  try {
    const response = await fetch("/api/commands", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ command })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "The command could not be processed.");

    if (data.action && data.action.type === "open-url") {
      const opened = openUrl(data.action.url);
      statusText.textContent = opened ? data.message : "Pop-up blocked. Allow pop-ups to open that website.";
    } else {
      closeVoiceTab();
      statusText.textContent = data.message;
    }
    speak(data.message);
    await loadHistory();
  } catch (error) {
    closeVoiceTab();
    statusText.textContent = `Backend error: ${error.message}`;
  }
}

if (SpeechRecognition) {
  recognition = new SpeechRecognition();
  recognition.lang = navigator.language || "en-US";
  recognition.continuous = false;
  recognition.interimResults = false;

  recognition.onstart = () => setListening(true);
  recognition.onend = () => setListening(false);
  recognition.onresult = (event) => runCommand(event.results[0][0].transcript);
  recognition.onerror = (event) => {
    setListening(false);
    const messages = {
      "not-allowed": "Microphone access was blocked. Allow it in your browser settings.",
      "no-speech": "I didn't hear anything. Please try again.",
      "audio-capture": "No microphone was found."
    };
    statusText.textContent = messages[event.error] || `Voice recognition error: ${event.error}`;
    closeVoiceTab();
  };

  listenButton.addEventListener("click", () => {
    prepareVoiceTab();
    try {
      recognition.start();
    } catch (error) {
      closeVoiceTab();
      statusText.textContent = `Unable to start voice recognition: ${error.message}`;
    }
  });
  stopButton.addEventListener("click", () => {
    closeVoiceTab();
    recognition.stop();
  });
} else {
  listenButton.disabled = true;
  statusText.textContent = "Voice recognition is not supported in this browser";
  transcript.textContent = "Try Chrome or Edge, or type a command below.";
}

document.getElementById("commandForm").addEventListener("submit", (event) => {
  event.preventDefault();
  prepareVoiceTab();
  const command = commandInput.value;
  commandInput.value = "";
  commandInput.focus();
  runCommand(command);
});

document.querySelectorAll("[data-command]").forEach((button) => {
  button.addEventListener("click", () => {
    prepareVoiceTab();
    runCommand(button.dataset.command);
  });
});

clearHistoryButton.addEventListener("click", async () => {
  clearHistoryButton.disabled = true;
  try {
    const response = await fetch("/api/history", { method: "DELETE" });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Could not clear command history.");
    renderHistory([]);
  } catch (error) {
    statusText.textContent = `Backend error: ${error.message}`;
  } finally {
    clearHistoryButton.disabled = false;
  }
});

loadHistory().catch((error) => {
  historyList.replaceChildren();
  const item = document.createElement("li");
  item.className = "history-empty";
  item.textContent = error.message;
  historyList.append(item);
});
