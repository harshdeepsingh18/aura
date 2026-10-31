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
const authGate = document.getElementById("authGate");
const profileGate = document.getElementById("profileGate");
const profileForm = document.getElementById("profileForm");
const profileFirstName = document.getElementById("profileFirstName");
const profileLastName = document.getElementById("profileLastName");
const profileEmail = document.getElementById("profileEmail");
const profileError = document.getElementById("profileError");
const profileSubmit = document.getElementById("profileSubmit");
const authMessage = document.getElementById("authMessage");
const googleSignInButton = document.getElementById("googleSignInButton");
const githubSignInButton = document.getElementById("githubSignInButton");
const workspaceShell = document.getElementById("workspaceShell");
const accountControl = document.getElementById("accountControl");
const accountTrigger = document.getElementById("accountTrigger");
const accountAvatar = document.getElementById("accountAvatar");
const accountMenu = document.getElementById("accountMenu");
const accountMenuEmail = document.getElementById("accountMenuEmail");
const signOutButton = document.getElementById("signOutButton");
const settingsSignOutButton = document.getElementById("settingsSignOutButton");
const accountName = document.getElementById("accountName");
const accountDetail = document.getElementById("accountDetail");
const settingsAccountName = document.getElementById("settingsAccountName");
const settingsAccountEmail = document.getElementById("settingsAccountEmail");
const suggestionGrid = document.getElementById("suggestionGrid");
const chatSearch = document.getElementById("chatSearch");
const clearChatSearch = document.getElementById("clearChatSearch");
const promptSearch = document.getElementById("promptSearch");
const promptCategories = document.getElementById("promptCategories");
const promptTemplateGrid = document.getElementById("promptTemplateGrid");
const promptFeaturedGrid = document.getElementById("promptFeaturedGrid");
const promptTrendingGrid = document.getElementById("promptTrendingGrid");
const promptRecentGrid = document.getElementById("promptRecentGrid");
const promptSavedGrid = document.getElementById("promptSavedGrid");
const promptStudioHome = document.getElementById("promptStudioHome");
const promptEditor = document.getElementById("promptEditor");
const promptVariableFields = document.getElementById("promptVariableFields");
const promptPreview = document.getElementById("promptPreview");
const promptActionFeedback = document.getElementById("promptActionFeedback");
const promptDetailBookmark = document.getElementById("promptDetailBookmark");
const promptStudioFeedback = document.getElementById("promptStudioFeedback");
const languageSelect = document.getElementById("languageSelect");
const UI_TRANSLATIONS = {
  hi: {
    "Assistant": "सहायक", "Prompt Studio": "प्रॉम्प्ट स्टूडियो", "Chats": "चैट", "Search": "खोज", "Settings": "सेटिंग्स",
    "New chat": "नई चैट", "RECENT CHATS": "हाल की चैट", "Your chats will appear here.": "आपकी चैट यहाँ दिखाई देंगी।",
    "What can I help you with?": "मैं आपकी किस तरह मदद कर सकता हूँ?", "Your ideas start here.": "आपके विचारों की शुरुआत यहाँ से होती है।",
    "Ready when you are": "जब आप तैयार हों", "Ask anything, or use voice input.": "कुछ भी पूछें या आवाज़ से बोलें।",
    "Message Aura...": "Aura को संदेश दें...",
    "Local storage and service status.": "स्थानीय संग्रहण और सेवा की स्थिति।",
    "Account & chat storage": "खाता और चैट संग्रहण", "Appearance & preferences": "दिखावट और प्राथमिकताएँ",
    "Light appearance": "हल्की थीम", "Use a light color palette for Aura.": "Aura के लिए हल्के रंगों का उपयोग करें।",
    "Press Enter to send": "भेजने के लिए Enter दबाएँ", "Use Shift + Enter to add a new line.": "नई पंक्ति के लिए Shift + Enter दबाएँ।",
    "Language": "भाषा", "Choose the language for the interface and Aura’s replies.": "इंटरफ़ेस और Aura के जवाबों की भाषा चुनें।",
    "AI service": "AI सेवा", "Your chats": "आपकी चैट", "Open a saved conversation or start a new one.": "सहेजी गई बातचीत खोलें या नई शुरू करें।",
    "＋ New chat": "＋ नई चैट", "Search the web": "वेब पर खोजें",
    "Search Google for current information. Results open in this tab; use Back to return to Aura.": "नई जानकारी के लिए Google पर खोजें। नतीजे इसी टैब में खुलेंगे; Aura पर लौटने के लिए Back दबाएँ।",
    "Find the right prompt.": "सही प्रॉम्प्ट खोजें।", "Browse all prompts": "सभी प्रॉम्प्ट देखें",
    "Featured prompts": "चुनिंदा प्रॉम्प्ट", "Trending now": "अभी लोकप्रिय", "Recently used": "हाल ही में उपयोग किए गए",
    "Saved prompts": "सहेजे गए प्रॉम्प्ट", "Use in Aura Chat": "Aura चैट में उपयोग करें", "Copy Prompt": "प्रॉम्प्ट कॉपी करें",
    "Welcome back": "वापसी पर स्वागत है", "Continue with Google": "Google के साथ जारी रखें",
    "Sign in to continue your Aura experience.": "Aura का उपयोग जारी रखने के लिए साइन इन करें।"
  },
  es: {
    "Assistant": "Asistente", "Prompt Studio": "Estudio de prompts", "Chats": "Chats", "Search": "Buscar", "Settings": "Ajustes",
    "New chat": "Nuevo chat", "RECENT CHATS": "CHATS RECIENTES", "Your chats will appear here.": "Tus chats aparecerán aquí.",
    "What can I help you with?": "¿En qué puedo ayudarte?", "Your ideas start here.": "Tus ideas empiezan aquí.",
    "Ready when you are": "Listo cuando quieras", "Ask anything, or use voice input.": "Pregunta lo que quieras o usa la voz.",
    "Message Aura...": "Escribe a Aura...", "Local storage and service status.": "Almacenamiento local y estado del servicio.",
    "Account & chat storage": "Cuenta y almacenamiento de chats", "Appearance & preferences": "Apariencia y preferencias",
    "Light appearance": "Apariencia clara", "Use a light color palette for Aura.": "Usa una paleta clara para Aura.",
    "Press Enter to send": "Pulsa Enter para enviar", "Use Shift + Enter to add a new line.": "Usa Shift + Enter para añadir una línea.",
    "Language": "Idioma", "Choose the language for the interface and Aura’s replies.": "Elige el idioma de la interfaz y las respuestas de Aura.",
    "AI service": "Servicio de IA", "Your chats": "Tus chats", "Open a saved conversation or start a new one.": "Abre una conversación guardada o inicia una nueva.",
    "＋ New chat": "＋ Nuevo chat", "Search the web": "Buscar en la web",
    "Search Google for current information. Results open in this tab; use Back to return to Aura.": "Busca información actual en Google. Los resultados se abren en esta pestaña; usa Atrás para volver a Aura.",
    "Find the right prompt.": "Encuentra el prompt adecuado.", "Browse all prompts": "Ver todos los prompts",
    "Featured prompts": "Prompts destacados", "Trending now": "Tendencias", "Recently used": "Usados recientemente",
    "Saved prompts": "Prompts guardados", "Use in Aura Chat": "Usar en Aura Chat", "Copy Prompt": "Copiar prompt",
    "Welcome back": "Te damos la bienvenida", "Continue with Google": "Continuar con Google",
    "Sign in to continue your Aura experience.": "Inicia sesión para continuar con Aura."
  },
  fr: {
    "Assistant": "Assistant", "Prompt Studio": "Studio de prompts", "Chats": "Discussions", "Search": "Rechercher", "Settings": "Paramètres",
    "New chat": "Nouvelle discussion", "RECENT CHATS": "DISCUSSIONS RÉCENTES", "Your chats will appear here.": "Vos discussions apparaîtront ici.",
    "What can I help you with?": "Comment puis-je vous aider ?", "Your ideas start here.": "Vos idées commencent ici.",
    "Ready when you are": "Prêt quand vous l’êtes", "Ask anything, or use voice input.": "Posez une question ou utilisez la saisie vocale.",
    "Message Aura...": "Écrivez à Aura...", "Local storage and service status.": "Stockage local et état du service.",
    "Account & chat storage": "Compte et stockage des discussions", "Appearance & preferences": "Apparence et préférences",
    "Light appearance": "Thème clair", "Use a light color palette for Aura.": "Utiliser une palette claire pour Aura.",
    "Press Enter to send": "Appuyer sur Entrée pour envoyer", "Use Shift + Enter to add a new line.": "Utilisez Maj + Entrée pour passer à la ligne.",
    "Language": "Langue", "Choose the language for the interface and Aura’s replies.": "Choisissez la langue de l’interface et des réponses d’Aura.",
    "AI service": "Service d’IA", "Your chats": "Vos discussions", "Open a saved conversation or start a new one.": "Ouvrez une discussion enregistrée ou commencez-en une nouvelle.",
    "＋ New chat": "＋ Nouvelle discussion", "Search the web": "Rechercher sur le Web",
    "Search Google for current information. Results open in this tab; use Back to return to Aura.": "Recherchez des informations récentes sur Google. Les résultats s’ouvrent dans cet onglet ; revenez en arrière pour retrouver Aura.",
    "Find the right prompt.": "Trouvez le bon prompt.", "Browse all prompts": "Parcourir tous les prompts",
    "Featured prompts": "Prompts à la une", "Trending now": "Tendances", "Recently used": "Récemment utilisés",
    "Saved prompts": "Prompts enregistrés", "Use in Aura Chat": "Utiliser dans Aura Chat", "Copy Prompt": "Copier le prompt",
    "Welcome back": "Bon retour", "Continue with Google": "Continuer avec Google",
    "Sign in to continue your Aura experience.": "Connectez-vous pour continuer avec Aura."
  },
  pa: {
    "Assistant": "ਸਹਾਇਕ", "Prompt Studio": "ਪ੍ਰੌਂਪਟ ਸਟੂਡੀਓ", "Chats": "ਚੈਟਾਂ", "Search": "ਖੋਜੋ", "Settings": "ਸੈਟਿੰਗਾਂ",
    "New chat": "ਨਵੀਂ ਚੈਟ", "RECENT CHATS": "ਹਾਲੀਆ ਚੈਟਾਂ", "Your chats will appear here.": "ਤੁਹਾਡੀਆਂ ਚੈਟਾਂ ਇੱਥੇ ਦਿਖਾਈ ਦੇਣਗੀਆਂ।",
    "What can I help you with?": "ਮੈਂ ਤੁਹਾਡੀ ਕੀ ਮਦਦ ਕਰ ਸਕਦਾ ਹਾਂ?", "Your ideas start here.": "ਤੁਹਾਡੇ ਵਿਚਾਰ ਇੱਥੋਂ ਸ਼ੁਰੂ ਹੁੰਦੇ ਹਨ।",
    "Ready when you are": "ਜਦੋਂ ਤੁਸੀਂ ਤਿਆਰ ਹੋ", "Ask anything, or use voice input.": "ਕੁਝ ਵੀ ਪੁੱਛੋ ਜਾਂ ਆਵਾਜ਼ ਰਾਹੀਂ ਦੱਸੋ।",
    "Message Aura...": "Aura ਨੂੰ ਸੁਨੇਹਾ ਲਿਖੋ...", "Local storage and service status.": "ਸਥਾਨਕ ਸਟੋਰੇਜ ਅਤੇ ਸੇਵਾ ਦੀ ਸਥਿਤੀ।",
    "Account & chat storage": "ਖਾਤਾ ਅਤੇ ਚੈਟ ਸਟੋਰੇਜ", "Appearance & preferences": "ਦਿੱਖ ਅਤੇ ਪਸੰਦਾਂ",
    "Light appearance": "ਹਲਕੀ ਥੀਮ", "Use a light color palette for Aura.": "Aura ਲਈ ਹਲਕੇ ਰੰਗ ਵਰਤੋ।",
    "Press Enter to send": "ਭੇਜਣ ਲਈ Enter ਦਬਾਓ", "Use Shift + Enter to add a new line.": "ਨਵੀਂ ਲਾਈਨ ਲਈ Shift + Enter ਦਬਾਓ।",
    "Language": "ਭਾਸ਼ਾ", "Choose the language for the interface and Aura’s replies.": "ਇੰਟਰਫੇਸ ਅਤੇ Aura ਦੇ ਜਵਾਬਾਂ ਲਈ ਭਾਸ਼ਾ ਚੁਣੋ।",
    "AI service": "AI ਸੇਵਾ", "Your chats": "ਤੁਹਾਡੀਆਂ ਚੈਟਾਂ", "Open a saved conversation or start a new one.": "ਸੰਭਾਲੀ ਗੱਲਬਾਤ ਖੋਲ੍ਹੋ ਜਾਂ ਨਵੀਂ ਸ਼ੁਰੂ ਕਰੋ।",
    "＋ New chat": "＋ ਨਵੀਂ ਚੈਟ", "Search the web": "ਵੈੱਬ ਖੋਜੋ",
    "Find the right prompt.": "ਸਹੀ ਪ੍ਰੌਂਪਟ ਲੱਭੋ।", "Browse all prompts": "ਸਾਰੇ ਪ੍ਰੌਂਪਟ ਵੇਖੋ",
    "Featured prompts": "ਖਾਸ ਪ੍ਰੌਂਪਟ", "Trending now": "ਹੁਣ ਪ੍ਰਚਲਿਤ", "Recently used": "ਹਾਲ ਹੀ ਵਿੱਚ ਵਰਤੇ",
    "Saved prompts": "ਸੰਭਾਲੇ ਪ੍ਰੌਂਪਟ", "Use in Aura Chat": "Aura ਚੈਟ ਵਿੱਚ ਵਰਤੋ", "Copy Prompt": "ਪ੍ਰੌਂਪਟ ਕਾਪੀ ਕਰੋ",
    "Welcome back": "ਜੀ ਆਇਆਂ ਨੂੰ", "Continue with Google": "Google ਨਾਲ ਜਾਰੀ ਰੱਖੋ",
    "Sign in to continue your Aura experience.": "Aura ਵਰਤਣ ਲਈ ਸਾਈਨ ਇਨ ਕਰੋ।"
  }
};
const originalTextNodes = new WeakMap();
const translatedTextNodes = new WeakMap();
const originalAttributes = new WeakMap();
const translatedAttributes = new WeakMap();
const PROMPT_TEMPLATES = [
  { title: "Learn Anything", category: "Study", description: "Understand a new topic with a clear, engaging lesson.", fields: [["topic", "Topic", "e.g. Photosynthesis"]], prompt: "Teach me about {{topic}} as a clear, engaging tutor. Start with the core idea, build from fundamentals to useful detail, use a memorable example or analogy, and finish with three quick questions to check my understanding. If the topic is broad, organize it into a short learning path." },
  { title: "Solve Problems", category: "Study", description: "Work through a difficult question one step at a time.", fields: [["problem", "Problem to solve", "Paste or describe the problem"], ["level", "Difficulty level", "e.g. High school, university, beginner"]], prompt: "Help me solve this problem at {{level}} level: {{problem}}. First identify what is being asked and the relevant concepts. Then show the reasoning in clear, ordered steps, check the result, and point out one common mistake. Do not skip the explanation." },
  { title: "Make Study Notes", category: "Study", description: "Turn a subject into structured, easy-to-review notes.", fields: [["subject", "Subject", "e.g. The water cycle"], ["level", "Course or level", "e.g. Grade 10, introductory"]], prompt: "Create concise, well-organized study notes about {{subject}} for {{level}}. Use descriptive headings, explain key terms, highlight essential facts and relationships, and include a short recap plus five active-recall questions. Keep the notes accurate and easy to scan." },
  { title: "Exam Preparation", category: "Study", description: "Build a practical revision plan and practice questions.", fields: [["subject", "Subject", "e.g. Biology"], ["examDate", "Exam date or time available", "e.g. In two weeks"]], prompt: "Help me prepare for my {{subject}} exam, which is {{examDate}}. Create a realistic revision plan with spaced review, focused study blocks, and practice. Ask me what topics are included if that information is missing. Finish with five varied practice questions and an answer key separated from the questions." },
  { title: "Brainstorm Ideas", category: "Creativity", description: "Generate fresh options and choose a promising direction.", fields: [["goal", "What are you brainstorming?", "e.g. A science-fair project"], ["constraints", "Constraints or audience", "e.g. Low budget, teens"]], prompt: "Help me brainstorm ideas for {{goal}}. The audience or constraints are: {{constraints}}. Generate at least ten distinct options, including a few unconventional ones. Briefly explain the value of each, group related ideas, then recommend the three strongest and suggest a practical first step for each." },
  { title: "Learn Programming", category: "Coding", description: "Learn a coding concept through examples and practice.", fields: [["language", "Programming language", "e.g. Python"], ["topic", "Concept to learn", "e.g. Loops"], ["level", "Experience level", "e.g. Beginner"]], prompt: "Teach me {{topic}} in {{language}} as a patient programming instructor. Assume I am {{level}}. Explain the concept in plain language, show a small correct example, walk through what it does, mention one common mistake, and give me a short exercise without revealing its solution until I ask." },
  { title: "Debug Code", category: "Coding", description: "Find the cause of a bug and propose a safe fix.", fields: [["language", "Programming language", "e.g. JavaScript"], ["code", "Code and error", "Paste the relevant code and exact error"]], prompt: "Review this {{language}} code and help me debug it: {{code}}. Identify the most likely root cause using evidence from the code or error. Explain the issue, suggest the smallest safe change, and provide corrected code only for the relevant part. If important context is missing, ask for it instead of guessing." },
  { title: "Build a Website", category: "Coding", description: "Plan an accessible website implementation before coding.", fields: [["goal", "Website goal", "e.g. Portfolio for a photographer"], ["stack", "Preferred tools or stack", "e.g. Existing project stack"]], prompt: "Help me build a website for {{goal}} using {{stack}}. First outline the page structure and key user flows. Then propose an accessible, responsive implementation plan that fits the existing project architecture. Call out assumptions and ask before replacing existing integrations or introducing dependencies." },
  { title: "Compare Two Things", category: "Study", description: "Compare options fairly against the criteria that matter.", fields: [["first", "First item", "e.g. Solar power"], ["second", "Second item", "e.g. Wind power"], ["goal", "Comparison goal", "e.g. A home installation"]], prompt: "Compare {{first}} and {{second}} for {{goal}}. Use the same relevant criteria for both, explain meaningful similarities and differences, and distinguish established facts from context-dependent trade-offs. End with a concise comparison table and explain what additional information would change the recommendation." },
  { title: "Professional Email", category: "Writing", description: "Draft a polished email with a clear purpose and tone.", fields: [["goal", "Email purpose", "e.g. Request a meeting"], ["recipient", "Recipient", "e.g. Project manager"], ["details", "Key details", "Add dates, context, or requested action"], ["tone", "Tone", "e.g. Warm and professional"]], prompt: "Draft a {{tone}} email to {{recipient}}. Purpose: {{goal}}. Include these details: {{details}}. Write a specific subject line, keep the message concise and courteous, make the requested next step clear, and do not invent facts or commitments." },
  { title: "Improve Writing", category: "Writing", description: "Edit a draft while preserving your meaning and voice.", fields: [["text", "Writing to improve", "Paste your draft"], ["goal", "What should improve?", "e.g. Clarity, concision, tone"]], prompt: "Improve this writing for {{goal}}, while preserving the original meaning and voice: {{text}}. Return the revised version first. Then briefly list the most important edits. Do not add unsupported facts; flag any sentence whose meaning is unclear instead of rewriting its intent." },
  { title: "Summarize Documents", category: "Writing", description: "Extract a document's main ideas, evidence, and actions.", fields: [["document", "Document text", "Paste the text or key excerpt"], ["audience", "Who is the summary for?", "e.g. A busy project team"]], prompt: "Summarize the following document for {{audience}}: {{document}}. Start with a brief executive summary, then list the main points, important evidence or caveats, and any explicit decisions or action items. Clearly separate what the document says from any interpretation, and do not invent missing details." },
  { title: "Daily Schedule", category: "Productivity", description: "Create a balanced plan around your priorities and constraints.", fields: [["tasks", "Tasks and priorities", "List what needs to get done"], ["hours", "Available time", "e.g. 9:00–17:00"], ["constraints", "Breaks or constraints", "e.g. Lunch at noon, school pickup"]], prompt: "Create a realistic schedule for {{hours}} using these tasks and priorities: {{tasks}}. Respect these constraints: {{constraints}}. Estimate task durations, include short breaks and transition time, prioritize the most important work, and leave a buffer. Flag any workload that does not reasonably fit." },
  { title: "Multiple Perspectives", category: "Creativity", description: "Explore a question through several thoughtful viewpoints.", fields: [["question", "Question or issue", "e.g. Should schools use AI tutors?"], ["context", "Relevant context", "e.g. Audience, location, timeframe"]], prompt: "Analyze this question from multiple reasonable perspectives: {{question}}. Context: {{context}}. Present at least three distinct viewpoints in good faith, identify the values or assumptions behind each, note shared concerns, and finish with questions that could help someone reach a more informed conclusion. Avoid false balance when evidence strongly favors one claim." },
  { title: "Critique My Work", category: "Creativity", description: "Get constructive, specific feedback with actionable revisions.", fields: [["work", "Work to review", "Paste your work or describe it"], ["goal", "Intended goal or audience", "e.g. Persuade a general audience"]], prompt: "Give constructive feedback on this work: {{work}}. Its goal or audience is: {{goal}}. First identify what is already effective, then point to the highest-impact issues with specific examples. Explain why each matters and suggest actionable improvements. Be candid and respectful; do not rewrite the entire work unless I ask." },
  { title: "Social Media Content", category: "Writing", description: "Draft platform-aware posts without making up claims.", fields: [["topic", "Topic or announcement", "e.g. Launching a community event"], ["platform", "Platform", "e.g. LinkedIn, Instagram"], ["audience", "Audience", "e.g. Local volunteers"], ["tone", "Tone", "e.g. Friendly and energetic"]], prompt: "Create a {{tone}} {{platform}} post about {{topic}} for {{audience}}. Lead with a clear hook, keep the format appropriate for the platform, and include a simple call to action. Do not invent statistics, endorsements, or facts. Provide three alternate opening lines after the draft." },
  { title: "Learning Roadmap", category: "Study", description: "Map a topic into sequenced milestones and practice.", fields: [["goal", "What do you want to learn?", "e.g. Data visualization"], ["level", "Starting experience", "e.g. Beginner"], ["time", "Time available", "e.g. 4 hours per week"]], prompt: "Design a practical learning roadmap for {{goal}}. My starting level is {{level}}, and I can study {{time}}. Break the learning into ordered milestones with prerequisites, hands-on practice, and a way to check progress. Keep the plan realistic, identify free or widely available resource types, and explain what to learn next after the foundations." },
  { title: "Create a Table", category: "Productivity", description: "Organize information into a useful, readable comparison table.", fields: [["subject", "What should the table organize?", "e.g. Weekly meal options"], ["columns", "Desired columns", "e.g. Option, cost, prep time"]], prompt: "Create a clear table about {{subject}} with these columns: {{columns}}. Use consistent units and concise entries. Include only information supported by what I provide; label unknown values clearly rather than inventing them. After the table, briefly explain any assumptions or patterns worth noticing." },
  { title: "Ask Before Answering", category: "Productivity", description: "Clarify important requirements before giving a recommendation.", fields: [["question", "Your question or task", "e.g. Help me choose a laptop"], ["context", "What context should it consider?", "e.g. Budget, location, preferences"]], prompt: "I need help with this: {{question}}. Relevant context: {{context}}. Before answering, identify the missing information that could materially change your response and ask me up to three concise clarifying questions. Wait for my answers before making a recommendation. If nothing important is missing, say so and answer directly." },
  { title: "Improve AI Response", category: "Writing", description: "Refine an AI-generated answer for accuracy and usefulness.", fields: [["response", "Response to improve", "Paste the response"], ["goal", "What would make it better?", "e.g. More accurate and concise"], ["context", "Original question or context", "Paste the original prompt if available"]], prompt: "Improve this response to make it {{goal}}: {{response}}. Original question or context: {{context}}. Preserve useful information, remove unsupported claims, correct errors you can confidently identify, and make uncertainty explicit. Return the improved response, followed by a short note describing substantive changes. Do not claim verification you did not perform." }
];
const PROMPT_STUDIO_CATEGORIES = [
  "All",
  "Education",
  "Software Development",
  "Business",
  "Writing & Communication",
  "Marketing",
  "Research & Analysis",
  "Productivity",
  "Creative & Design"
];
const PROMPT_STUDIO_DETAILS = {
  "Learn Anything": ["Education", ["learning", "explanations", "practice"], "Use to learn an unfamiliar concept from first principles, with examples and a quick understanding check."],
  "Solve Problems": ["Education", ["problem solving", "reasoning", "step-by-step"], "Use when you have a defined academic or practical problem and want a transparent, checked solution."],
  "Make Study Notes": ["Education", ["study notes", "revision", "reference"], "Use to turn a subject or source material into structured notes for review and active recall."],
  "Exam Preparation": ["Education", ["exam prep", "revision plan", "practice"], "Use to plan revision around an exam date and generate practice that exposes gaps in understanding."],
  "Brainstorm Ideas": ["Creative & Design", ["ideation", "options", "creative thinking"], "Use when you need several distinct directions before selecting an idea to develop."],
  "Learn Programming": ["Software Development", ["programming", "learning", "examples"], "Use to understand a programming concept through a small example and a guided exercise."],
  "Debug Code": ["Software Development", ["debugging", "code review", "troubleshooting"], "Use when code behaves unexpectedly and you can provide the relevant snippet and exact error."],
  "Build a Website": ["Software Development", ["web development", "planning", "accessibility"], "Use to plan a website that fits an existing stack, user flow, and accessibility requirements."],
  "Compare Two Things": ["Research & Analysis", ["comparison", "decision support", "trade-offs"], "Use to compare two options against shared criteria and understand which context changes the decision."],
  "Professional Email": ["Writing & Communication", ["email", "professional writing", "communication"], "Use to draft a concise professional email with a clear recipient, purpose, tone, and next step."],
  "Improve Writing": ["Writing & Communication", ["editing", "clarity", "proofreading"], "Use to improve clarity, tone, or concision while preserving the original meaning and voice."],
  "Summarize Documents": ["Research & Analysis", ["summarization", "documents", "key findings"], "Use to brief a reader on a document's claims, evidence, decisions, and action items without adding unsupported facts."],
  "Daily Schedule": ["Productivity", ["planning", "time management", "prioritization"], "Use to turn a task list and real-world constraints into a balanced, achievable schedule."],
  "Multiple Perspectives": ["Research & Analysis", ["analysis", "perspectives", "decision support"], "Use to map reasonable viewpoints, their assumptions, and the questions that would help evaluate an issue."],
  "Critique My Work": ["Creative & Design", ["feedback", "review", "iteration"], "Use to get specific, constructive feedback against the intended goal or audience before revising."],
  "Social Media Content": ["Marketing", ["social media", "campaigns", "copywriting"], "Use to create platform-aware social content with a defined audience, tone, and call to action."],
  "Learning Roadmap": ["Education", ["learning plan", "roadmap", "skill development"], "Use to map a learning goal into sequenced milestones, realistic practice, and progress checks."],
  "Create a Table": ["Productivity", ["structured data", "tables", "organization"], "Use to organize provided information into consistent columns while explicitly marking unknowns."],
  "Ask Before Answering": ["Business", ["requirements", "clarification", "decision support"], "Use when a task has important unknowns and you want clarifying questions before a recommendation."],
  "Improve AI Response": ["Writing & Communication", ["editing", "quality control", "AI output"], "Use to refine a draft response, check unsupported claims, and make uncertainty clear."]
};
const PROMPT_STUDIO_FEATURED_IDS = ["exam-preparation", "build-a-website", "professional-email"];
const PROMPT_STUDIO_TRENDING_IDS = ["debug-code", "summarize-documents", "daily-schedule"];
PROMPT_TEMPLATES.forEach((template) => {
  const [category, tags, whenToUse] = PROMPT_STUDIO_DETAILS[template.title];
  template.id = template.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  template.category = category;
  template.tags = tags;
  template.whenToUse = whenToUse;
});
let activePromptCategory = "All";
let selectedPromptTemplate = null;
let promptStudioState = { favorites: [], recent: [] };
let promptStudioOwner = null;
let promptStudioSaveQueue = Promise.resolve();
let cachedChats = [];
let currentLanguage = "en";
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
let cloudAuthEnabled = false;
let authClient = null;
let loadedUserId = null;

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

function translateTextNode(node) {
  if (!node.nodeValue.trim()) return;
  const previousTranslation = translatedTextNodes.get(node);
  let original = originalTextNodes.get(node);
  if (node.nodeValue !== previousTranslation) {
    original = node.nodeValue;
    originalTextNodes.set(node, original);
  }
  if (original === undefined) return;
  const leading = original.match(/^\s*/)[0];
  const trailing = original.match(/\s*$/)[0];
  const text = original.slice(leading.length, original.length - trailing.length || undefined);
  const translated = UI_TRANSLATIONS[currentLanguage]?.[text] || text;
  const nextValue = `${leading}${translated}${trailing}`;
  translatedTextNodes.set(node, nextValue);
  if (node.nodeValue !== nextValue) node.nodeValue = nextValue;
}

function translateAttribute(element, attribute) {
  const originals = originalAttributes.get(element) || {};
  const translations = translatedAttributes.get(element) || {};
  const previousTranslation = translations[attribute];
  let original = originals[attribute];
  const current = element.getAttribute(attribute);
  if (current !== previousTranslation) {
    original = current;
    originals[attribute] = original;
    originalAttributes.set(element, originals);
  }
  const translated = UI_TRANSLATIONS[currentLanguage]?.[original] || original;
  translations[attribute] = translated;
  translatedAttributes.set(element, translations);
  if (current !== translated) element.setAttribute(attribute, translated);
}

function translateInterface(language) {
  currentLanguage = language === "en" || Object.prototype.hasOwnProperty.call(UI_TRANSLATIONS, language)
    ? language
    : "en";
  document.documentElement.lang = currentLanguage;
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  let node = walker.nextNode();
  while (node) {
    translateTextNode(node);
    node = walker.nextNode();
  }
  document.querySelectorAll("[placeholder], [aria-label], [title]").forEach((element) => {
    ["placeholder", "aria-label", "title"].forEach((attribute) => {
      if (element.hasAttribute(attribute)) translateAttribute(element, attribute);
    });
  });
}

const interfaceTranslator = new MutationObserver((mutations) => {
  mutations.forEach((mutation) => {
    if (mutation.type === "characterData") {
      translateTextNode(mutation.target);
      return;
    }
    if (mutation.type === "attributes") {
      translateAttribute(mutation.target, mutation.attributeName);
      return;
    }
    mutation.addedNodes.forEach((addedNode) => {
      if (addedNode.nodeType === Node.TEXT_NODE) translateTextNode(addedNode);
      else if (addedNode.nodeType === Node.ELEMENT_NODE) {
        const walker = document.createTreeWalker(addedNode, NodeFilter.SHOW_TEXT);
        let textNode = walker.nextNode();
        while (textNode) {
          translateTextNode(textNode);
          textNode = walker.nextNode();
        }
        [addedNode, ...addedNode.querySelectorAll("[placeholder], [aria-label], [title]")].forEach((element) => {
          ["placeholder", "aria-label", "title"].forEach((attribute) => {
            if (element.hasAttribute(attribute)) translateAttribute(element, attribute);
          });
        });
      }
    });
  });
});
interfaceTranslator.observe(document.body, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ["placeholder", "aria-label", "title"] });

function setStatus(message, loading = false) {
  statusText.textContent = message;
  statusText.classList.toggle("is-loading", loading);
  if (loading) statusText.setAttribute("aria-busy", "true");
  else statusText.removeAttribute("aria-busy");
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
  document.body.classList.remove("mobile-sidebar-open");
  document.getElementById("mobileMenuButton").setAttribute("aria-expanded", "false");
  if (pageName === "prompts" && !promptEditor.hidden) {
    selectedPromptTemplate = null;
    promptEditor.hidden = true;
    promptStudioHome.hidden = false;
    renderPromptTemplates();
  }
}

function renderPromptCategories() {
  promptCategories.replaceChildren();
  PROMPT_STUDIO_CATEGORIES.forEach((category) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "prompt-category";
    button.textContent = category;
    button.setAttribute("aria-pressed", String(category === activePromptCategory));
    button.addEventListener("click", () => {
      activePromptCategory = category;
      renderPromptCategories();
      renderPromptTemplates();
    });
    promptCategories.append(button);
  });
}

function getFilteredPromptTemplates() {
  const query = promptSearch.value.trim().toLocaleLowerCase();
  return PROMPT_TEMPLATES.filter((template) => {
    const matchesCategory = activePromptCategory === "All" || template.category === activePromptCategory;
    const matchesQuery = !query
      || `${template.title} ${template.description} ${template.category} ${template.tags.join(" ")} ${template.fields.map((field) => field[1]).join(" ")}`
        .toLocaleLowerCase().includes(query);
    return matchesCategory && matchesQuery;
  });
}

function renderPromptCard(template) {
    const card = document.createElement("article");
    card.className = "prompt-template-card";
    card.dataset.promptId = template.id;
    const heading = document.createElement("div");
    heading.className = "prompt-template-card-heading";
    const category = document.createElement("span");
    category.className = `prompt-template-category category-${template.category.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
    category.textContent = template.category;
    const bookmark = document.createElement("button");
    bookmark.type = "button";
    bookmark.className = "prompt-bookmark-button";
    bookmark.dataset.bookmarkPrompt = template.id;
    const isSaved = promptStudioState.favorites.includes(template.id);
    bookmark.setAttribute("aria-pressed", String(isSaved));
    bookmark.setAttribute("aria-label", `${isSaved ? "Remove saved prompt" : "Save prompt"}: ${template.title}`);
    bookmark.title = isSaved ? "Remove from saved prompts" : "Save prompt";
    bookmark.innerHTML = isSaved
      ? '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 4.8A1.8 1.8 0 0 1 7.8 3h8.4A1.8 1.8 0 0 1 18 4.8V21l-6-3.8L6 21V4.8Z" fill="currentColor"/></svg>'
      : '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 4.8A1.8 1.8 0 0 1 7.8 3h8.4A1.8 1.8 0 0 1 18 4.8V21l-6-3.8L6 21V4.8Z"/></svg>';
    heading.append(category, bookmark);
    const title = document.createElement("strong");
    title.textContent = template.title;
    const description = document.createElement("span");
    description.className = "prompt-template-description";
    description.textContent = template.description;
    const tags = document.createElement("div");
    tags.className = "prompt-card-tags";
    template.tags.forEach((tagText) => {
      const tag = document.createElement("span");
      tag.textContent = tagText;
      tags.append(tag);
    });
    const footer = document.createElement("div");
    footer.className = "prompt-template-footer";
    const inputs = document.createElement("span");
    inputs.textContent = `${template.fields.length} customizable ${template.fields.length === 1 ? "input" : "inputs"}`;
    const view = document.createElement("button");
    view.className = "prompt-view-button";
    view.type = "button";
    view.dataset.viewPrompt = template.id;
    view.textContent = "View prompt";
    footer.append(inputs, view);
    card.append(heading, title, description, tags, footer);
    return card;
}

function renderPromptCardGrid(target, templates, emptyMessage) {
  target.replaceChildren();
  if (!templates.length) {
    const empty = document.createElement("p");
    empty.className = "prompt-empty-state";
    empty.textContent = emptyMessage;
    target.append(empty);
    return;
  }
  templates.forEach((template) => target.append(renderPromptCard(template)));
}

function renderPromptTemplates() {
  const templates = getFilteredPromptTemplates();
  const filtering = Boolean(promptSearch.value.trim()) || activePromptCategory !== "All";
  document.getElementById("promptStudioCollections").hidden = filtering;
  document.getElementById("promptBrowseHeading").textContent = filtering ? "Matching prompts" : "Browse all prompts";
  document.getElementById("promptResultCount").textContent = `${templates.length} ${templates.length === 1 ? "prompt" : "prompts"}`;
  renderPromptCardGrid(promptTemplateGrid, templates, "No prompts match those filters. Try another search or category.");
  if (filtering) return;

  const byId = new Map(PROMPT_TEMPLATES.map((template) => [template.id, template]));
  const recent = promptStudioState.recent.map((id) => byId.get(id)).filter(Boolean);
  const saved = promptStudioState.favorites.map((id) => byId.get(id)).filter(Boolean);
  renderPromptCardGrid(promptFeaturedGrid, PROMPT_STUDIO_FEATURED_IDS.map((id) => byId.get(id)).filter(Boolean), "No featured prompts.");
  renderPromptCardGrid(promptTrendingGrid, PROMPT_STUDIO_TRENDING_IDS.map((id) => byId.get(id)).filter(Boolean), "No trending prompts.");
  renderPromptCardGrid(promptRecentGrid, recent.slice(0, 3), "Prompts you use will appear here.");
  renderPromptCardGrid(promptSavedGrid, saved, "Bookmark prompts to build your collection.");
}

function updatePromptBookmarkButton() {
  if (!selectedPromptTemplate) return;
  const isSaved = promptStudioState.favorites.includes(selectedPromptTemplate.id);
  promptDetailBookmark.setAttribute("aria-pressed", String(isSaved));
  promptDetailBookmark.setAttribute("aria-label", `${isSaved ? "Remove saved prompt" : "Save prompt"}: ${selectedPromptTemplate.title}`);
  promptDetailBookmark.textContent = isSaved ? "★ Saved" : "☆ Save prompt";
}

async function loadPromptStudioState(user) {
  const owner = cloudAuthEnabled ? user?.id || null : "local";
  if (promptStudioOwner === owner) return;
  promptStudioOwner = owner;
  let savedState;
  if (cloudAuthEnabled) {
    const metadata = user?.user_metadata || {};
    savedState = {
      favorites: metadata.prompt_studio_favorites,
      recent: metadata.prompt_studio_recent
    };
  } else {
    const stored = localStorage.getItem("aura-prompt-studio");
    try {
      savedState = stored ? JSON.parse(stored) : {};
    } catch (error) {
      promptStudioFeedback.textContent = `Could not read saved Prompt Studio preferences: ${error.message}`;
      savedState = {};
    }
  }
  const validIds = new Set(PROMPT_TEMPLATES.map((template) => template.id));
  promptStudioState = {
    favorites: Array.isArray(savedState.favorites) ? [...new Set(savedState.favorites.filter((id) => validIds.has(id)))] : [],
    recent: Array.isArray(savedState.recent) ? [...new Set(savedState.recent.filter((id) => validIds.has(id)))].slice(0, 8) : []
  };
  renderPromptTemplates();
}

function persistPromptStudioState() {
  promptStudioSaveQueue = promptStudioSaveQueue.catch(() => {}).then(async () => {
    const state = { favorites: [...promptStudioState.favorites], recent: [...promptStudioState.recent] };
    if (cloudAuthEnabled) {
      if (!authClient) throw new Error("Sign in to save Prompt Studio changes.");
      const { error } = await authClient.auth.updateUser({
        data: { prompt_studio_favorites: state.favorites, prompt_studio_recent: state.recent }
      });
      if (error) throw new Error(`Could not save your Prompt Studio changes: ${error.message}`);
    } else {
      localStorage.setItem("aura-prompt-studio", JSON.stringify(state));
    }
  });
  return promptStudioSaveQueue;
}

async function togglePromptFavorite(promptId) {
  if (!PROMPT_TEMPLATES.some((template) => template.id === promptId)) return;
  const wasSaved = promptStudioState.favorites.includes(promptId);
  promptStudioState.favorites = wasSaved
    ? promptStudioState.favorites.filter((id) => id !== promptId)
    : [promptId, ...promptStudioState.favorites];
  renderPromptTemplates();
  updatePromptBookmarkButton();
  promptStudioFeedback.textContent = wasSaved ? "Updating saved prompts..." : "Saving prompt...";
  try {
    await persistPromptStudioState();
    promptStudioFeedback.textContent = wasSaved ? "Prompt removed from your collection." : "Prompt saved to your collection.";
  } catch (error) {
    promptStudioState.favorites = wasSaved
      ? [promptId, ...promptStudioState.favorites]
      : promptStudioState.favorites.filter((id) => id !== promptId);
    renderPromptTemplates();
    updatePromptBookmarkButton();
    promptStudioFeedback.textContent = error.message;
  }
}

function buildSelectedPrompt() {
  if (!selectedPromptTemplate) return "";
  const values = new Map(
    [...promptVariableFields.querySelectorAll("[data-prompt-variable]")]
      .map((input) => [input.dataset.promptVariable, input.value.trim()])
  );
  return selectedPromptTemplate.prompt.replace(/\{\{(\w+)\}\}/g, (_match, variable) => {
    const value = values.get(variable);
    if (value) return value;
    return `[${selectedPromptTemplate.fields.find(([key]) => key === variable)?.[1] || variable}]`;
  });
}

function updatePromptPreview() {
  const complete = [...promptVariableFields.querySelectorAll("[data-prompt-variable]")]
    .every((input) => input.value.trim());
  promptPreview.textContent = buildSelectedPrompt();
  document.getElementById("copyPromptButton").disabled = !complete;
  document.getElementById("usePromptButton").disabled = !complete;
  promptActionFeedback.textContent = complete ? "" : "Fill in each field to copy or use this prompt.";
}

function selectPromptTemplate(template) {
  selectedPromptTemplate = template;
  promptStudioHome.hidden = true;
  promptEditor.hidden = false;
  document.getElementById("promptEditorTitle").textContent = template.title;
  document.getElementById("promptEditorDescription").textContent = template.description;
  document.getElementById("promptWhatItDoes").textContent = template.description;
  document.getElementById("promptWhenToUse").textContent = template.whenToUse;
  const detailTags = document.getElementById("promptDetailTags");
  detailTags.replaceChildren();
  template.tags.forEach((tagText) => {
    const tag = document.createElement("span");
    tag.textContent = tagText;
    detailTags.append(tag);
  });
  promptActionFeedback.textContent = "";
  updatePromptBookmarkButton();
  promptVariableFields.replaceChildren();

  template.fields.forEach(([key, labelText, placeholder]) => {
    const label = document.createElement("label");
    label.className = "prompt-variable-label";
    label.htmlFor = `prompt-variable-${key}`;
    label.textContent = labelText;
    const field = document.createElement("textarea");
    field.id = label.htmlFor;
    field.className = "prompt-variable-input";
    field.dataset.promptVariable = key;
    field.placeholder = placeholder;
    field.rows = 2;
    field.required = true;
    field.maxLength = 4000;
    field.addEventListener("input", updatePromptPreview);
    promptVariableFields.append(label, field);
  });
  updatePromptPreview();
  if (window.matchMedia("(max-width: 760px)").matches) {
    promptEditor.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

renderPromptCategories();
renderPromptTemplates();

promptSearch.addEventListener("input", renderPromptTemplates);
document.getElementById("promptEditorClose").addEventListener("click", () => {
  selectedPromptTemplate = null;
  promptStudioHome.hidden = false;
  promptEditor.hidden = true;
  renderPromptTemplates();
});
promptDetailBookmark.addEventListener("click", () => {
  if (selectedPromptTemplate) togglePromptFavorite(selectedPromptTemplate.id);
});
function handlePromptCardAction(event) {
  const bookmark = event.target.closest("[data-bookmark-prompt]");
  if (bookmark) {
    togglePromptFavorite(bookmark.dataset.bookmarkPrompt);
    return;
  }
  const view = event.target.closest("[data-view-prompt]");
  if (!view) return;
  const template = PROMPT_TEMPLATES.find((item) => item.id === view.dataset.viewPrompt);
  if (template) selectPromptTemplate(template);
}
promptStudioHome.addEventListener("click", handlePromptCardAction);
document.getElementById("copyPromptButton").addEventListener("click", async () => {
  if (!selectedPromptTemplate) return;
  try {
    await navigator.clipboard.writeText(buildSelectedPrompt());
    promptActionFeedback.textContent = "Prompt copied to clipboard.";
  } catch (error) {
    promptActionFeedback.textContent = `Could not copy prompt: ${error.message}`;
  }
});
document.getElementById("usePromptButton").addEventListener("click", async () => {
  if (!selectedPromptTemplate) return;
  const prompt = buildSelectedPrompt();
  const usedTemplate = selectedPromptTemplate;
  promptActionFeedback.textContent = "Saving to recently used...";
  const previousRecent = [...promptStudioState.recent];
  promptStudioState.recent = [usedTemplate.id, ...promptStudioState.recent.filter((id) => id !== usedTemplate.id)].slice(0, 8);
  try {
    await persistPromptStudioState();
  } catch (error) {
    promptStudioState.recent = previousRecent;
    promptActionFeedback.textContent = error.message;
    return;
  }
  promptStudioFeedback.textContent = `${usedTemplate.title} added to recently used.`;
  commandInput.value = prompt;
  resizeComposer();
  selectedPromptTemplate = null;
  promptStudioHome.hidden = false;
  promptEditor.hidden = true;
  renderPromptTemplates();
  showPage("chat");
  commandInput.focus();
  statusText.textContent = "Prompt added to your message. Review it, then send when you're ready.";
});

function resizeComposer() {
  commandInput.style.height = "auto";
  commandInput.style.height = `${Math.min(commandInput.scrollHeight, 180)}px`;
}

function loadPreferences() {
  const lightTheme = localStorage.getItem("aura-theme") === "light";
  const enterToSend = localStorage.getItem("aura-enter-to-send") !== "false";
  const savedLanguage = localStorage.getItem("aura-language") || "en";
  languageSelect.value = savedLanguage === "en" || Object.prototype.hasOwnProperty.call(UI_TRANSLATIONS, savedLanguage)
    ? savedLanguage
    : "en";
  translateInterface(languageSelect.value);
  document.documentElement.dataset.theme = lightTheme ? "light" : "dark";
  document.getElementById("themeToggle").checked = lightTheme;
  document.getElementById("enterToSendToggle").checked = enterToSend;
}

loadPreferences();

async function apiFetch(url, options = {}) {
  const timeoutMs = url === "/api/chat" ? AI_REQUEST_TIMEOUT_MS : API_REQUEST_TIMEOUT_MS;
  const headers = new Headers(options.headers || {});
  if (cloudAuthEnabled) {
    const { data, error } = await authClient.auth.getSession();
    if (error) throw new Error(`Could not refresh your sign-in: ${error.message}`);
    const accessToken = data.session?.access_token;
    if (!accessToken) throw new Error("Sign in with Google or GitHub to continue.");
    headers.set("Authorization", `Bearer ${accessToken}`);
  }
  return fetchWithTimeout(url, { ...options, headers }, timeoutMs);
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

function loadSupabaseSdk() {
  if (window.supabase?.createClient) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const sdkScript = document.createElement("script");
    sdkScript.src = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.118.0";
    sdkScript.onload = () => {
      if (window.supabase?.createClient) resolve();
      else reject(new Error("The Supabase sign-in library did not load correctly."));
    };
    sdkScript.onerror = () => reject(new Error("Could not load the Supabase sign-in library."));
    document.head.append(sdkScript);
  });
}

function updateAccountUI(session) {
  const user = cloudAuthEnabled ? session?.user : null;
  const email = user?.email || "";
  const metadata = user?.user_metadata || {};
  const firstName = typeof metadata.first_name === "string" ? metadata.first_name.trim() : "";
  const lastName = typeof metadata.last_name === "string" ? metadata.last_name.trim() : "";
  const hasProfile = Boolean(firstName && lastName && typeof metadata.is_18_or_older === "boolean");
  const oauthName = [metadata.full_name, metadata.name, metadata.user_name]
    .find((value) => typeof value === "string" && value.trim())?.trim();
  const name = [firstName, lastName].filter(Boolean).join(" ")
    || oauthName || email || "Aura account";
  const initials = name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "A";
  accountTrigger.disabled = !user;
  accountTrigger.setAttribute("aria-expanded", "false");
  accountMenu.hidden = true;
  signOutButton.hidden = !user;
  settingsSignOutButton.hidden = !user;
  accountMenuEmail.textContent = email;
  accountAvatar.textContent = user ? initials : "L";

  if (!cloudAuthEnabled) {
    authGate.hidden = true;
    profileGate.hidden = true;
    workspaceShell.hidden = false;
    accountName.textContent = "Local chats";
    accountDetail.textContent = "Saved on this computer";
    settingsAccountName.textContent = "Local to this computer";
    settingsAccountEmail.textContent = "Chats are saved in Aura's data folder and are not synced to an online account.";
    return;
  }

  authGate.hidden = Boolean(user);
  profileGate.hidden = !user || hasProfile;
  workspaceShell.hidden = !user || !hasProfile;
  googleSignInButton.hidden = Boolean(user);
  githubSignInButton.hidden = Boolean(user);
  if (user && !hasProfile) {
    const oauthName = typeof metadata.full_name === "string"
      ? metadata.full_name
      : typeof metadata.name === "string" ? metadata.name
        : typeof metadata.user_name === "string" ? metadata.user_name : "";
    const nameParts = oauthName.trim().split(/\s+/).filter(Boolean);
    profileFirstName.value = firstName || metadata.given_name || nameParts[0] || "";
    profileLastName.value = lastName || metadata.family_name || nameParts.slice(1).join(" ");
    profileEmail.textContent = email;
    profileError.textContent = "";
    const adultAnswer = profileForm.querySelector(`input[name="isAdult"][value="${metadata.is_18_or_older === false ? "no" : "yes"}"]`);
    if (typeof metadata.is_18_or_older === "boolean" && adultAnswer) adultAnswer.checked = true;
  }
  accountName.textContent = user ? name : "Sign in to Aura";
  accountDetail.textContent = user ? email : "Sign in to sync your chats";
  settingsAccountName.textContent = user ? name : "Not signed in";
  settingsAccountEmail.textContent = user
    ? "Your conversations are saved to your Aura account and available across devices."
    : "Sign in with Google or GitHub to access your saved chats.";
  if (!user) {
    authMessage.classList.remove("auth-message-error");
    authMessage.textContent = "Sign in or create an account with Google or GitHub to save and reopen your chats across devices.";
  }
}

function clearChatView() {
  selectedChatId = null;
  conversation = [];
  suggestionGrid.hidden = false;
  document.getElementById("chatPage").classList.remove("has-conversation");
  chatMessages.replaceChildren();
  const emptyMessage = document.createElement("p");
  emptyMessage.className = "chat-empty";
  emptyMessage.textContent = "Your conversation with Aura will appear here.";
  chatMessages.append(emptyMessage);
  [chatList, allChatList].forEach((list) => {
    list.replaceChildren();
    const empty = document.createElement("p");
    empty.className = "sidebar-chat-empty";
    empty.textContent = "Your chats will appear here.";
    list.append(empty);
  });
}

async function applySession(session) {
  updateAccountUI(session);
  if (!cloudAuthEnabled) {
    await loadPromptStudioState(null);
    await initializeChats();
    return;
  }
  const userId = session?.user?.id || null;
  if (!userId) {
    clearChatView();
    await loadPromptStudioState(null);
    loadedUserId = null;
    setChatAccess(false);
    return;
  }
  const metadata = session.user.user_metadata || {};
  if (
    typeof metadata.first_name !== "string"
    || !metadata.first_name.trim()
    || typeof metadata.last_name !== "string"
    || !metadata.last_name.trim()
    || typeof metadata.is_18_or_older !== "boolean"
  ) {
    clearChatView();
    loadedUserId = null;
    setChatAccess(false);
    return;
  }
  await loadPromptStudioState(session.user);
  if (loadedUserId === userId) return;
  clearChatView();
  loadedUserId = userId;
  await initializeChats();
}

async function startOAuthSignIn(provider, button) {
  if (!authClient) return;
  const label = `Continue with ${provider === "github" ? "GitHub" : "Google"}`;
  button.disabled = true;
  button.setAttribute("aria-busy", "true");
  button.querySelector(".google-button-label").textContent = `Connecting to ${provider === "github" ? "GitHub" : "Google"}...`;
  authMessage.classList.remove("auth-message-error");
  authMessage.textContent = `Connecting to ${provider === "github" ? "GitHub" : "Google"}…`;
  try {
    const { error } = await authClient.auth.signInWithOAuth({
      provider,
      options: { redirectTo: window.location.origin }
    });
    if (error) throw error;
  } catch (error) {
    authMessage.classList.add("auth-message-error");
    const providerLabel = provider === "github" ? "GitHub" : "Google";
    const providerError = String(error.message || error);
    authMessage.textContent = provider === "github" && /unsupported provider|provider is not enabled/i.test(providerError)
      ? "GitHub sign-in is disabled in Supabase. Enable GitHub under Authentication → Sign In / Providers, add both the Client ID and Client Secret, then save the provider settings."
      : `Could not continue with ${providerLabel}: ${providerError}`;
    button.disabled = false;
    button.removeAttribute("aria-busy");
    button.querySelector(".google-button-label").textContent = label;
  }
}

async function signOut() {
  if (!authClient) return;
  signOutButton.disabled = true;
  settingsSignOutButton.disabled = true;
  document.getElementById("profileSignOutButton").disabled = true;
  closeAccountMenu();
  try {
    const { error } = await authClient.auth.signOut({ scope: "local" });
    if (error) throw error;
  } catch (error) {
    statusText.textContent = `Could not sign out: ${error.message}`;
  } finally {
    signOutButton.disabled = false;
    settingsSignOutButton.disabled = false;
    document.getElementById("profileSignOutButton").disabled = false;
  }
}

function closeAccountMenu() {
  accountMenu.hidden = true;
  accountTrigger.setAttribute("aria-expanded", "false");
}

async function initializeAuthentication() {
  setStatus("Connecting to your Aura account…", true);
  const response = await fetchWithTimeout("/api/config", {}, API_REQUEST_TIMEOUT_MS);
  if (!response.ok) throw new Error("Could not load Aura's sign-in settings.");
  const config = await response.json();
  if (config.authMisconfigured) {
    throw new Error("Set both SUPABASE_URL and SUPABASE_ANON_KEY before enabling cloud sign-in.");
  }
  cloudAuthEnabled = Boolean(config.authEnabled);
  if (!cloudAuthEnabled) {
    await applySession(null);
    return;
  }

  setStatus("Checking your sign-in…", true);
  profileForm.addEventListener("submit", saveProfile);
  document.getElementById("profileSignOutButton").addEventListener("click", signOut);
  await loadSupabaseSdk();
  authClient = window.supabase.createClient(config.supabaseUrl, config.supabaseAnonKey);
  authClient.auth.onAuthStateChange((_event, session) => {
    window.setTimeout(() => {
      applySession(session).catch((error) => {
        setStatus(`Could not load your account: ${error.message}`);
      });
    }, 0);
  });
  googleSignInButton.addEventListener("click", () => startOAuthSignIn("google", googleSignInButton));
  githubSignInButton.addEventListener("click", () => startOAuthSignIn("github", githubSignInButton));
  accountTrigger.addEventListener("click", () => {
    const isOpen = accountTrigger.getAttribute("aria-expanded") === "true";
    accountMenu.hidden = isOpen;
    accountTrigger.setAttribute("aria-expanded", String(!isOpen));
  });
  document.addEventListener("click", (event) => {
    if (!accountControl.contains(event.target)) closeAccountMenu();
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeAccountMenu();
  });
  signOutButton.addEventListener("click", signOut);
  settingsSignOutButton.addEventListener("click", signOut);
  const { data, error } = await authClient.auth.getSession();
  if (error) throw new Error(`Could not check your Aura sign-in: ${error.message}`);
  await applySession(data.session);
}

async function saveProfile(event) {
  event.preventDefault();
  const firstName = profileFirstName.value.trim();
  const lastName = profileLastName.value.trim();
  const adultAnswer = profileForm.querySelector('input[name="isAdult"]:checked');
  if (!firstName || !lastName || !adultAnswer) {
    profileError.textContent = "Enter your first and last name, then choose an age answer.";
    return;
  }

  profileSubmit.disabled = true;
  profileSubmit.setAttribute("aria-busy", "true");
  profileSubmit.querySelector(".profile-submit-label").textContent = "Saving your profile...";
  profileError.textContent = "";
  try {
    const { error } = await authClient.auth.updateUser({
      data: {
        first_name: firstName,
        last_name: lastName,
        is_18_or_older: adultAnswer.value === "yes"
      }
    });
    if (error) throw error;
    const { data, error: sessionError } = await authClient.auth.getSession();
    if (sessionError) throw sessionError;
    await applySession(data.session);
  } catch (error) {
    profileError.textContent = `Could not save your profile: ${error.message}`;
  } finally {
    profileSubmit.disabled = false;
    profileSubmit.removeAttribute("aria-busy");
    profileSubmit.querySelector(".profile-submit-label").textContent = "Continue to Aura";
  }
}

function showChatLoadError(error) {
  const message = `Could not load your chats: ${error.message}`;
  setStatus(message);
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
    retryButton.addEventListener("click", initializeChats);
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
  if (event.key === "Escape") {
    setUploadMenuOpen(false);
    document.body.classList.remove("mobile-sidebar-open");
    document.getElementById("mobileMenuButton").setAttribute("aria-expanded", "false");
  }
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
    const utterance = new SpeechSynthesisUtterance(message);
    utterance.lang = ({ en: "en-US", hi: "hi-IN", es: "es-ES", fr: "fr-FR", pa: "pa-IN" })[languageSelect.value];
    window.speechSynthesis.speak(utterance);
  }
}

function makeActionPrompt(action, confirmationToken) {
  const prompt = document.createElement("div");
  prompt.className = "action-prompt";
  const approveButton = document.createElement("button");
  approveButton.type = "button";
  approveButton.textContent = action.type === "open-url"
    ? `Approve and open ${new URL(action.url).hostname}`
    : action.type === "launch-app"
      ? `Approve and open ${action.appName || "the app"}`
      : action.type === "calendar-event"
        ? "Add to calendar"
        : `Set alarm for ${new Date(action.time).toLocaleString()}`;
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
      } else if (action.type === "calendar-event") {
        addCalendarEvent(action);
        message = `Calendar entry prepared for ${action.title}. Import the downloaded file into your calendar, or save the prefilled Google Calendar event.`;
      } else if (action.type === "alarm") {
        await addBrowserAlarm(action);
        message = `Alarm set for ${new Date(action.time).toLocaleString()}. Keep Aura open for the alarm to ring.`;
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

function icsEscape(value) {
  return String(value || "").replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/,/g, "\\,").replace(/;/g, "\\;");
}

function icsDate(date) {
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

function addCalendarEvent(event) {
  const allDay = Boolean(event.allDay);
  const start = new Date(event.start);
  const end = new Date(event.end);
  if (!Number.isFinite(start.getTime()) || !Number.isFinite(end.getTime()) || end <= start) {
    throw new Error("That calendar date or time is invalid.");
  }
  const gcalUrl = new URL("https://calendar.google.com/calendar/render");
  gcalUrl.searchParams.set("action", "TEMPLATE");
  gcalUrl.searchParams.set("text", event.title);
  const calendarDates = allDay
    ? `${event.start.replace(/-/g, "")}/${event.end.replace(/-/g, "")}`
    : `${icsDate(start)}/${icsDate(end)}`;
  gcalUrl.searchParams.set("dates", calendarDates);
  if (event.details) gcalUrl.searchParams.set("details", event.details);
  if (event.location) gcalUrl.searchParams.set("location", event.location);
  const opened = window.open(gcalUrl.href, "_blank");
  if (opened) opened.opener = null;
  const ics = [
    "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Aura//Calendar Event//EN", "BEGIN:VEVENT",
    `UID:${crypto.randomUUID()}@aura.local`, `DTSTAMP:${icsDate(new Date())}`,
    ...(allDay
      ? [`DTSTART;VALUE=DATE:${event.start.replace(/-/g, "")}`, `DTEND;VALUE=DATE:${event.end.replace(/-/g, "")}`]
      : [`DTSTART:${icsDate(start)}`, `DTEND:${icsDate(end)}`]),
    `SUMMARY:${icsEscape(event.title)}`,
    ...(event.details ? [`DESCRIPTION:${icsEscape(event.details)}`] : []),
    ...(event.location ? [`LOCATION:${icsEscape(event.location)}`] : []),
    "END:VEVENT", "END:VCALENDAR", ""
  ].join("\r\n");
  const link = document.createElement("a");
  link.href = URL.createObjectURL(new Blob([ics], { type: "text/calendar;charset=utf-8" }));
  link.download = `${event.title.replace(/[^\p{L}\p{N} _-]/gu, "").trim() || "Aura event"}.ics`;
  document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(link.href), 1000);
  if (!opened) throw new Error("The browser blocked Google Calendar. The .ics file was downloaded for import.");
}

const ALARM_STORAGE_KEY = "aura-browser-alarms";
const firedAlarmIds = new Set();

function readBrowserAlarms() {
  try {
    const alarms = JSON.parse(localStorage.getItem(ALARM_STORAGE_KEY) || "[]");
    return Array.isArray(alarms) ? alarms.filter((alarm) => alarm && typeof alarm.id === "string" && typeof alarm.time === "string") : [];
  } catch {
    return [];
  }
}

async function addBrowserAlarm(alarm) {
  const when = new Date(alarm.time);
  if (!Number.isFinite(when.getTime()) || when.getTime() <= Date.now()) {
    throw new Error("Choose a future time for the alarm.");
  }
  let notificationPermission = "unsupported";
  if ("Notification" in window) {
    notificationPermission = Notification.permission;
    if (notificationPermission === "default") notificationPermission = await Notification.requestPermission();
  }
  const alarms = readBrowserAlarms();
  alarms.push({ id: crypto.randomUUID(), title: alarm.title, time: when.toISOString() });
  localStorage.setItem(ALARM_STORAGE_KEY, JSON.stringify(alarms));
  statusText.textContent = notificationPermission === "granted"
    ? "Alarm saved. Aura must stay open until it rings."
    : "Alarm saved. Allow notifications for a visible alert when it rings.";
}

function checkBrowserAlarms() {
  const now = Date.now();
  const alarms = readBrowserAlarms();
  let changed = false;
  for (const alarm of alarms) {
    if (firedAlarmIds.has(alarm.id) || new Date(alarm.time).getTime() > now) continue;
    firedAlarmIds.add(alarm.id);
    changed = true;
    const message = `Alarm: ${alarm.title}`;
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification("Aura alarm", { body: alarm.title });
    } else {
      statusText.textContent = message;
      speak(message);
    }
  }
  if (changed) localStorage.setItem(ALARM_STORAGE_KEY, JSON.stringify(alarms.filter((alarm) => !firedAlarmIds.has(alarm.id))));
}

window.setInterval(checkBrowserAlarms, 5000);

function escapeHtml(value) {
  return value.replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&quot;",
    "'": "&#39;"
  })[character]);
}

function highlightCode(code) {
  const tokens = /(&quot;.*?&quot;|&#39;.*?&#39;|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|`[^`]*`|\b(?:const|let|var|function|return|if|else|for|while|class|new|import|from|export|async|await|true|false|null|undefined|def|print|in|not|and|or)\b|\b\d+(?:\.\d+)?\b)/g;
  return escapeHtml(code).replace(tokens, (token) => {
    const type = /^(?:&quot;|&#39;|"|'|`)/.test(token) ? "string"
      : /^\d/.test(token) ? "number" : "keyword";
    return `<span class="code-token-${type}">${token}</span>`;
  });
}

function renderMarkdown(content) {
  const blocks = [];
  const source = content.replace(/```([^\n]*)\n([\s\S]*?)```/g, (_match, language, code) => {
    const blockIndex = blocks.length;
    blocks.push(`<pre class="code-block"><div class="code-block-heading"><span>${escapeHtml(language.trim() || "Code")}</span><button type="button" class="copy-code-button" data-copy-code="${encodeURIComponent(code)}">Copy code</button></div><code>${highlightCode(code)}</code></pre>`);
    return `\n@@CODE${blockIndex}@@\n`;
  });
  return source.split(/\n{2,}/).map((paragraph) => {
    const codeMatch = paragraph.trim().match(/^@@CODE(\d+)@@$/);
    if (codeMatch) return blocks[Number(codeMatch[1])];
    let html = escapeHtml(paragraph).replace(/`([^`]+)`/g, "<code>$1</code>");
    html = html.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>").replace(/\*(.+?)\*/g, "<em>$1</em>");
    html = html.replace(/\[([^\]]+)\]\((https:\/\/[^)\s]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
    html = html.replace(/^(#{1,3})\s+(.+)$/gm, (_match, marks, title) => `<h${marks.length + 2}>${title}</h${marks.length + 2}>`);
    return `<p>${html.replace(/\n/g, "<br>")}</p>`;
  }).join("");
}

function addChatMessage(role, content, action, options = {}) {
  const emptyMessage = chatMessages.querySelector(".chat-empty");
  if (emptyMessage) emptyMessage.remove();

  const message = document.createElement("article");
  message.className = `chat-message ${role}`;
  const text = document.createElement("div");
  text.className = "message-content";
  text.innerHTML = renderMarkdown(content);
  message.append(text);
  if (action) message.append(makeActionPrompt(action, action.confirmationToken));
  const tools = document.createElement("div");
  tools.className = "message-actions";
  if (role === "assistant") {
    const copyButton = document.createElement("button");
    copyButton.type = "button";
    copyButton.textContent = "Copy";
    copyButton.setAttribute("aria-label", "Copy Aura's response");
    copyButton.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(content);
        copyButton.textContent = "Copied";
        window.setTimeout(() => { copyButton.textContent = "Copy"; }, 1400);
      } catch (error) {
        statusText.textContent = `Could not copy response: ${error.message}`;
      }
    });
    tools.append(copyButton);
    if (options.canRegenerate) {
      const regenerateButton = document.createElement("button");
      regenerateButton.type = "button";
      regenerateButton.textContent = "Regenerate";
      regenerateButton.setAttribute("aria-label", "Regenerate Aura's response");
      regenerateButton.addEventListener("click", regenerateResponse);
      tools.append(regenerateButton);
    }
  }
  if (tools.childElementCount) message.append(tools);
  text.querySelectorAll(".copy-code-button").forEach((button) => {
    button.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(decodeURIComponent(button.dataset.copyCode));
        button.textContent = "Copied";
      } catch (error) {
        statusText.textContent = `Could not copy code: ${error.message}`;
      }
    });
  });
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
  const searchTerm = target === chatList ? chatSearch.value.trim().toLocaleLowerCase() : "";
  const filteredChats = searchTerm
    ? chats.filter((chat) => (chat.title || "New chat").toLocaleLowerCase().includes(searchTerm))
    : chats;
  if (filteredChats.length === 0) {
    const empty = document.createElement("p");
    empty.className = "sidebar-chat-empty";
    empty.textContent = searchTerm ? "No matching conversations." : "No chats yet.";
    target.append(empty);
    return;
  }

  let currentGroup = "";
  filteredChats.forEach((chat) => {
    const date = new Date(chat.updatedAt || chat.createdAt || 0);
    const day = Number.isNaN(date.getTime()) ? null : new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const daysAgo = day ? Math.floor((today - day) / 86400000) : Infinity;
    const group = daysAgo === 0 ? "Today"
      : daysAgo === 1 ? "Yesterday"
        : daysAgo < 7 ? "Previous 7 days"
          : daysAgo < Infinity ? "Older" : "Earlier";
    if (group !== currentGroup) {
      const heading = document.createElement("p");
      heading.className = "chat-date-heading";
      heading.textContent = group;
      target.append(heading);
      currentGroup = group;
    }
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
  cachedChats = data.chats;
  renderChatList(cachedChats);
  renderChatList(cachedChats, allChatList);
  return { chats: data.chats, activeChat: data.activeChat || null };
}

function renderChat(chat) {
  selectedChatId = chat.id;
  conversation = chat.messages
    .filter((message) => message.role === "user" || message.role === "assistant")
    .slice(-MAX_CONVERSATION_MESSAGES);
  suggestionGrid.hidden = conversation.length > 0;
  document.getElementById("chatPage").classList.toggle("has-conversation", conversation.length > 0);
  chatMessages.replaceChildren();
  if (conversation.length === 0) {
    const empty = document.createElement("p");
    empty.className = "chat-empty";
    empty.textContent = "Your conversation with Aura will appear here.";
    chatMessages.append(empty);
  } else {
    conversation.forEach((message, index) => {
      const attachmentName = message.attachmentName ? `\n📎 ${message.attachmentName}` : "";
      addChatMessage(message.role, `${message.content}${attachmentName}`, null, {
        canRegenerate: message.role === "assistant" && index === conversation.length - 1
      });
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

    cachedChats = data.chats;
    renderChatList(cachedChats);
    renderChatList(cachedChats, allChatList);
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
    cachedChats = data.chats;
    renderChatList(cachedChats);
    renderChatList(cachedChats, allChatList);
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

async function initializeChats() {
  setChatAccess(false);
  setStatus("Loading your saved chats…", true);
  try {
    await loadChats();
    if (!selectedChatId) throw new Error("Could not load or create a chat.");
    setChatAccess(true);
    setStatus(cloudAuthEnabled
      ? "Your chats are saved to your Aura account."
      : "Chats are saved on this computer.");
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

async function regenerateResponse() {
  if (conversation.length < 2 || conversation[conversation.length - 1].role !== "assistant") return;
  const previousUserMessage = [...conversation].reverse().find((message) => message.role === "user");
  if (!previousUserMessage) return;
  conversation = conversation.slice(0, -1);
  const assistantMessages = chatMessages.querySelectorAll(".chat-message.assistant");
  assistantMessages[assistantMessages.length - 1]?.remove();
  await sendChat(previousUserMessage.content, true);
}

async function sendChat(rawMessage, isRegeneration = false) {
  const content = rawMessage.trim();
  if (!content) return;

  document.getElementById("chatPage").classList.add("has-conversation");
  suggestionGrid.hidden = true;
  if (!isRegeneration) {
    transcript.textContent = `You said: “${content}”`;
    const displayContent = selectedFile ? `${content}\n📎 ${selectedFile.name}` : content;
    addChatMessage("user", displayContent);
  }
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
  const messages = isRegeneration
    ? [...conversation].slice(-(MAX_CONVERSATION_MESSAGES + 1))
    : [...conversation, userMessage].slice(-(MAX_CONVERSATION_MESSAGES + 1));
  const chatId = selectedChatId;
  try {
    const attachment = selectedFile ? await readAttachment(selectedFile) : null;
    const response = await apiFetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chatId, messages, attachment, language: languageSelect.value })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Aura could not get a response.");
    if (typeof data.reply !== "string") throw new Error("Aura received an invalid response.");

    loadingIndicator.remove();
    conversation = [...messages, { role: "assistant", content: data.reply }]
      .slice(-MAX_CONVERSATION_MESSAGES);
    addChatMessage("assistant", data.reply, data.action || null, { canRegenerate: true });
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
  recognition.lang = ({ en: "en-US", hi: "hi-IN", es: "es-ES", fr: "fr-FR", pa: "pa-IN" })[languageSelect.value] || navigator.language || "en-US";
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
  resizeComposer();
  sendChat(message);
});
commandInput.addEventListener("input", resizeComposer);
commandInput.addEventListener("keydown", (event) => {
  const enterToSend = document.getElementById("enterToSendToggle").checked;
  if (event.key === "Enter" && enterToSend && !event.shiftKey && !event.isComposing) {
    event.preventDefault();
    document.getElementById("commandForm").requestSubmit();
  }
});

document.querySelectorAll("[data-command]").forEach((button) => {
  button.addEventListener("click", () => sendChat(button.dataset.command));
});

newChatButton.addEventListener("click", createChat);
newChatPageButton.addEventListener("click", createChat);
document.getElementById("sidebarCollapseButton").addEventListener("click", () => {
  const isCollapsed = document.body.classList.toggle("sidebar-collapsed");
  const button = document.getElementById("sidebarCollapseButton");
  button.setAttribute("aria-label", isCollapsed ? "Expand sidebar" : "Collapse sidebar");
  button.title = isCollapsed ? "Expand sidebar" : "Collapse sidebar";
});
document.getElementById("mobileMenuButton").addEventListener("click", (event) => {
  const isOpen = document.body.classList.toggle("mobile-sidebar-open");
  event.currentTarget.setAttribute("aria-expanded", String(isOpen));
});
document.getElementById("sidebarBackdrop").addEventListener("click", () => {
  document.body.classList.remove("mobile-sidebar-open");
  document.getElementById("mobileMenuButton").setAttribute("aria-expanded", "false");
});
chatSearch.addEventListener("input", () => {
  clearChatSearch.hidden = !chatSearch.value;
  renderChatList(cachedChats);
});
clearChatSearch.addEventListener("click", () => {
  chatSearch.value = "";
  clearChatSearch.hidden = true;
  renderChatList(cachedChats);
  chatSearch.focus();
});
document.getElementById("historySearchToggle").addEventListener("click", () => {
  const isVisible = document.getElementById("chatSearchWrap").classList.toggle("search-open");
  if (isVisible) chatSearch.focus();
  else {
    chatSearch.value = "";
    clearChatSearch.hidden = true;
    renderChatList(cachedChats);
  }
});
document.getElementById("themeToggle").addEventListener("change", (event) => {
  const theme = event.currentTarget.checked ? "light" : "dark";
  document.documentElement.dataset.theme = theme;
  localStorage.setItem("aura-theme", theme);
});
languageSelect.addEventListener("change", (event) => {
  const language = event.currentTarget.value;
  localStorage.setItem("aura-language", language);
  translateInterface(language);
  if (recognition) {
    recognition.lang = ({ en: "en-US", hi: "hi-IN", es: "es-ES", fr: "fr-FR", pa: "pa-IN" })[language];
  }
});
document.getElementById("enterToSendToggle").addEventListener("change", (event) => {
  localStorage.setItem("aura-enter-to-send", String(event.currentTarget.checked));
});
document.addEventListener("keydown", (event) => {
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
    event.preventDefault();
    createChat();
  }
});

checkAiStatus().catch((error) => {
  setupNote.textContent = `Could not check Gemini API status: ${error.message}`;
});

initializeAuthentication().catch((error) => {
  authGate.hidden = false;
  workspaceShell.hidden = true;
  authMessage.classList.add("auth-message-error");
  authMessage.textContent = `Aura couldn't start: ${error.message}`;
  googleSignInButton.hidden = true;
  githubSignInButton.hidden = true;
  setStatus(`Aura couldn't start: ${error.message}`);
});
