const statusText = document.getElementById("status");
    const transcript = document.getElementById("transcript");
    const listenButton = document.getElementById("listenButton");
    const stopButton = document.getElementById("stopButton");
    const orbWrap = document.getElementById("orbWrap");
    const commandInput = document.getElementById("commandInput");
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    let recognition;
    let voiceTab = null;

    function openUrl(url) {
      if (voiceTab && !voiceTab.closed) {
        voiceTab.location.href = url;
        voiceTab = null;
        return true;
      }
      return Boolean(window.open(url, "_blank", "noopener,noreferrer"));
    }

    function setListening(isListening) {
      orbWrap.classList.toggle("listening", isListening);
      listenButton.disabled = isListening;
      stopButton.disabled = !isListening;
      statusText.textContent = isListening ? "Listening…" : "Ready when you are";
    }

    function speak(message) {
      if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(new SpeechSynthesisUtterance(message));
      }
    }

    function runCommand(rawCommand) {
      const command = rawCommand.trim();
      if (!command) return;

      transcript.textContent = `You said: “${command}”`;
      const normalized = command.toLowerCase().replace(/[.!?]+$/g, "").trim();
      statusText.textContent = "Working on it…";

      if (/\b(open|go to|visit|launch)\b.*\byoutube\b/.test(normalized) || normalized === "youtube") {
        speak("Opening YouTube");
        statusText.textContent = openUrl("https://www.youtube.com/")
          ? "Opening YouTube in a new tab"
          : "Pop-up blocked. Allow pop-ups to open YouTube.";
      } else if (/\b(play|start)\b.*\b(music|song|songs)\b/.test(normalized) || normalized === "music") {
        speak("Opening music");
        statusText.textContent = openUrl("https://www.youtube.com/results?search_query=music")
          ? "Opening music on YouTube"
          : "Pop-up blocked. Allow pop-ups to open music.";
      } else if (/\b(time|clock)\b/.test(normalized)) {
        if (voiceTab && !voiceTab.closed) voiceTab.close();
        voiceTab = null;
        const time = new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit" }).format(new Date());
        statusText.textContent = `It is ${time}`;
        speak(`It is ${time}`);
      } else if (/^(search|google|look up)\b/.test(normalized)) {
        const query = command.replace(/^(search for|search|google|look up)\s*/i, "").trim();
        if (!query) {
          if (voiceTab && !voiceTab.closed) voiceTab.close();
          voiceTab = null;
          statusText.textContent = "Tell me what you want to search for";
          speak("Tell me what you want to search for");
          return;
        }
        speak(`Searching for ${query}`);
        statusText.textContent = openUrl(`https://www.google.com/search?q=${encodeURIComponent(query)}`)
          ? `Searching for “${query}”`
          : "Pop-up blocked. Allow pop-ups to open search results.";
      } else {
        if (voiceTab && !voiceTab.closed) voiceTab.close();
        voiceTab = null;
        statusText.textContent = "I don't know that command yet";
        speak("Sorry, I don't know that command yet. Try opening YouTube, playing music, or searching the web.");
      }
    }

    if (SpeechRecognition) {
      recognition = new SpeechRecognition();
      recognition.lang = navigator.language || "en-US";
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => setListening(true);
      recognition.onend = () => {
        setListening(false);
        if (voiceTab && !voiceTab.closed) voiceTab.close();
        voiceTab = null;
      };
      recognition.onresult = (event) => {
        const spokenCommand = event.results[0][0].transcript;
        runCommand(spokenCommand);
      };
      recognition.onerror = (event) => {
        setListening(false);
        const messages = {
          "not-allowed": "Microphone access was blocked. Allow it in your browser settings.",
          "no-speech": "I didn't hear anything. Please try again.",
          "audio-capture": "No microphone was found."
        };
        statusText.textContent = messages[event.error] || `Voice recognition error: ${event.error}`;
        if (voiceTab && !voiceTab.closed) voiceTab.close();
        voiceTab = null;
      };
      listenButton.addEventListener("click", () => {
        voiceTab = window.open("about:blank", "_blank");
        try {
          recognition.start();
        } catch (error) {
          if (voiceTab && !voiceTab.closed) voiceTab.close();
          voiceTab = null;
          statusText.textContent = `Unable to start voice recognition: ${error.message}`;
        }
      });
      stopButton.addEventListener("click", () => {
        if (voiceTab && !voiceTab.closed) voiceTab.close();
        voiceTab = null;
        recognition.stop();
      });
    } else {
      listenButton.disabled = true;
      statusText.textContent = "Voice recognition is not supported in this browser";
      transcript.textContent = "Try Chrome or Edge, or type a command below.";
    }

    document.getElementById("commandForm").addEventListener("submit", (event) => {
      event.preventDefault();
      runCommand(commandInput.value);
      commandInput.value = "";
      commandInput.focus();
    });

    document.querySelectorAll("[data-command]").forEach((button) => {
      button.addEventListener("click", () => runCommand(button.dataset.command));
    });
