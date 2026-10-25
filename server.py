import base64
import binascii
import json
import ipaddress
import logging
import os
import re
import secrets
import subprocess
import tempfile
import threading
import time
import webbrowser
from datetime import datetime
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.parse import urlparse
from urllib.request import Request, urlopen


ROOT_DIR = Path(__file__).resolve().parent

DATA_DIR = ROOT_DIR / "data"
HISTORY_FILE = DATA_DIR / "history.json"
HOST = "127.0.0.1"
PORT = int(os.environ.get("PORT", "3000"))
GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models"
GEMINI_MODEL = "gemini-3.1-flash-lite"
MAX_REQUEST_BYTES = 4096
MAX_CHAT_REQUEST_BYTES = 16 * 1024 * 1024
MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024
MAX_TEXT_ATTACHMENT_CHARACTERS = 100000
HISTORY_LIMIT = 50
MAX_CHAT_MESSAGES = 12
MAX_CHAT_MESSAGE_LENGTH = 2000
MAX_ASSISTANT_MESSAGE_LENGTH = 12000
HISTORY_LOCK = threading.Lock()
PENDING_ACTIONS_LOCK = threading.Lock()
PENDING_ACTION_TTL_SECONDS = 120
pending_actions = {}

ALLOWED_APPS = {
    "notepad": ("notepad.exe", "Notepad"),
    "calculator": ("calc.exe", "Calculator"),
}
APP_SHORTCUT_DIRS = [
    Path(os.environ[key]) / "Microsoft" / "Windows" / "Start Menu" / "Programs"
    for key in ("APPDATA", "PROGRAMDATA")
    if os.environ.get(key)
]
AI_TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "open_website",
            "description": "Propose opening a normal public HTTPS website when directly asked.",
            "parameters": {
                "type": "object",
                "properties": {
                    "url": {
                        "type": "string",
                        "description": "The full HTTPS URL of the public website to open.",
                    }
                },
                "required": ["url"],
                "additionalProperties": False,
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "launch_app",
            "description": "Propose opening an installed Windows Start Menu app when directly asked.",
            "parameters": {
                "type": "object",
                "properties": {
                    "app": {
                        "type": "string",
                        "description": "The exact name of an installed app from the allowed app list.",
                    }
                },
                "required": ["app"],
                "additionalProperties": False,
            },
        },
    },
]


def available_desktop_apps():
    apps = {app_id: (label, None) for app_id, (_, label) in ALLOWED_APPS.items()}
    for directory in APP_SHORTCUT_DIRS:
        try:
            shortcuts = directory.rglob("*.lnk")
            for shortcut in shortcuts:
                label = shortcut.stem.strip()
                if label:
                    apps.setdefault(label.casefold(), (label, shortcut))
        except OSError:
            continue
    return apps


def resolve_desktop_app(app_name):
    if not isinstance(app_name, str):
        return None
    requested = app_name.strip().casefold()
    apps = available_desktop_apps()
    if requested in apps:
        label, shortcut = apps[requested]
        return requested, label, shortcut
    for app_id, (label, shortcut) in apps.items():
        if requested and (requested in label.casefold() or label.casefold() in requested):
            return app_id, label, shortcut
    return None


def explicit_open_action(command):
    play_request = re.match(
        r"^\s*(?:aura[, :]+)?(?:(?:can|could|would) you\s+)?(?:please\s+)?"
        r"(?:play|start playing)\s+(?:some\s+)?(?:music|a song|songs|a playlist)\b",
        command,
        flags=re.IGNORECASE,
    )
    if play_request:
        for preferred_player in ("Spotify", "Windows Media Player", "VLC media player", "Media Player"):
            player = resolve_desktop_app(preferred_player)
            if player:
                app_id, app_label, _ = player
                return {"type": "launch-app", "app": app_id, "appName": app_label}
        return {"type": "open-url", "url": "https://open.spotify.com"}

    match = re.match(
        r"^\s*(?:aura[, :]+)?(?:(?:can|could|would) you\s+)?(?:please\s+)?"
        r"(?:open|launch|start|run|visit|go to)\s+(?:the\s+)?(.+?)\s*[.!?]*\s*$",
        command,
        flags=re.IGNORECASE,
    )
    if not match:
        return None

    target = re.sub(r"\s+(?:for me|please)$", "", match.group(1).strip(), flags=re.IGNORECASE)
    app = resolve_desktop_app(target)
    if app:
        app_id, app_label, _ = app
        return {"type": "launch-app", "app": app_id, "appName": app_label}

    websites = {
        "youtube": "https://www.youtube.com",
        "youtube.com": "https://www.youtube.com",
        "youtube music": "https://music.youtube.com",
        "spotify": "https://open.spotify.com",
        "google": "https://www.google.com",
        "gmail": "https://mail.google.com",
        "google maps": "https://maps.google.com",
        "chatgpt": "https://chatgpt.com",
    }
    website = websites.get(target.casefold())
    if website:
        return {"type": "open-url", "url": website}
    if re.fullmatch(r"(?:https://)?[a-z0-9.-]+\.[a-z]{2,}(?:/[^\s]*)?", target, re.IGNORECASE):
        candidate = target if target.lower().startswith("https://") else f"https://{target}"
        try:
            return {"type": "open-url", "url": validate_public_https_url(candidate)}
        except ValueError:
            return None
    return None


def load_gemini_api_key():
    environment_key = os.environ.get("GEMINI_API_KEY", "").strip()
    if environment_key:
        return environment_key

    env_file = ROOT_DIR / ".env"
    if not env_file.exists():
        return ""
    for line in env_file.read_text(encoding="utf-8").splitlines():
        key, separator, value = line.strip().partition("=")
        if separator and key.strip() == "GEMINI_API_KEY":
            return value.strip().strip("\"'")
    return ""


GEMINI_API_KEY = load_gemini_api_key()
SYSTEM_INSTRUCTION = (
    "You are Aura, a helpful conversational voice assistant. Answer general questions "
    "naturally and clearly. You have no live web access, so be honest about that. "
    "You may propose opening a website only when the user explicitly asks to open or visit "
    "one, and may propose launching an installed desktop app only when explicitly requested. "
    "Never claim an action has already happened. The site performs actions only in direct response "
    "to an explicit user request."
)


def read_history():
    try:
        history = json.loads(HISTORY_FILE.read_text(encoding="utf-8"))
    except FileNotFoundError:
        return []
    if not isinstance(history, list):
        raise ValueError("History file must contain a JSON array.")
    return history


def write_history(history):
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    temporary_path = None
    try:
        with tempfile.NamedTemporaryFile(
            mode="w",
            encoding="utf-8",
            dir=DATA_DIR,
            prefix="history-",
            suffix=".tmp",
            delete=False,
        ) as temporary_file:
            temporary_path = Path(temporary_file.name)
            json.dump(history, temporary_file, indent=2)
        os.replace(temporary_path, HISTORY_FILE)
    finally:
        if temporary_path is not None and temporary_path.exists():
            temporary_path.unlink()


def launch_allowed_app(app_name):
    if os.name != "nt":
        raise OSError("Opening desktop apps is supported only on Windows.")
    resolved = resolve_desktop_app(app_name)
    if not resolved:
        raise OSError("That app is not available in the Windows Start Menu.")
    app_id, label, shortcut = resolved
    if app_id in ALLOWED_APPS:
        executable = ALLOWED_APPS[app_id][0]
        subprocess.Popen(
            [executable],
            stdin=subprocess.DEVNULL,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
            shell=False,
            close_fds=True,
        )
        return f"{label} is opening."

    if shortcut is not None and shortcut.is_file():
        os.startfile(str(shortcut))
        return f"{label} is opening."
    raise OSError("That app shortcut is no longer available.")


def issue_action_confirmation(app_name):
    token = secrets.token_urlsafe(24)
    now = time.monotonic()
    with PENDING_ACTIONS_LOCK:
        expired_tokens = [
            existing_token
            for existing_token, (_, expires_at) in pending_actions.items()
            if expires_at <= now
        ]
        for expired_token in expired_tokens:
            del pending_actions[expired_token]
        pending_actions[token] = (app_name, now + PENDING_ACTION_TTL_SECONDS)
    return token


def consume_action_confirmation(token):
    if not isinstance(token, str):
        return None
    with PENDING_ACTIONS_LOCK:
        action = pending_actions.pop(token, None)
    if action is None or action[1] <= time.monotonic():
        return None
    return action[0]


def validate_public_https_url(raw_url):
    if not isinstance(raw_url, str) or len(raw_url) > 2048:
        raise ValueError("Aura can only open a valid public HTTPS website.")
    try:
        parsed = urlparse(raw_url)
        hostname = parsed.hostname
        port = parsed.port
    except ValueError as error:
        raise ValueError("Aura can only open a valid public HTTPS website.") from error
    if (
        parsed.scheme != "https"
        or not hostname
        or parsed.username is not None
        or parsed.password is not None
        or port not in (None, 443)
        or not parsed.netloc
    ):
        raise ValueError("Aura can only open a valid public HTTPS website.")
    try:
        address = ipaddress.ip_address(hostname)
    except ValueError:
        if "." not in hostname or hostname.endswith("."):
            raise ValueError("Aura can only open a public website.")
    else:
        if not address.is_global:
            raise ValueError("Aura cannot open local or private network addresses.")
    return parsed.geturl()


def extract_service_error_message(error_body):
    try:
        decoded_body = error_body.decode("utf-8", errors="replace").strip()
    except AttributeError:
        decoded_body = str(error_body).strip()

    try:
        parsed_body = json.loads(decoded_body)
    except json.JSONDecodeError:
        parsed_body = None

    def find_message(value):
        if isinstance(value, dict):
            for field in ("message", "detail", "error", "title"):
                field_value = value.get(field)
                if isinstance(field_value, str) and field_value.strip():
                    return field_value
            for nested_value in value.values():
                found = find_message(nested_value)
                if found:
                    return found
        elif isinstance(value, list):
            for nested_value in value:
                found = find_message(nested_value)
                if found:
                    return found
        return None

    message = find_message(parsed_body) if parsed_body is not None else decoded_body
    if not message:
        message = "The AI service did not return an error description."
    return " ".join(message.split())[:500]


def gemini_status():
    return {
        "aiConfigured": bool(GEMINI_API_KEY),
        "provider": "Google Gemini API",
        "model": GEMINI_MODEL,
        "message": (
            "Gemini API key is ready."
            if GEMINI_API_KEY
            else "Add GEMINI_API_KEY to the .env file or environment, then restart Aura."
        ),
    }


def gemini_function_declarations():
    declarations = []
    for tool in AI_TOOLS:
        parameters = {
            key: value
            for key, value in tool["function"]["parameters"].items()
            if key != "additionalProperties"
        }
        if tool["function"]["name"] == "launch_app":
            properties = dict(parameters["properties"])
            properties["app"] = {
                **properties["app"],
                "enum": sorted(
                    label for label, _ in available_desktop_apps().values()
                ),
            }
            parameters["properties"] = properties
        declarations.append(
            {
                "name": tool["function"]["name"],
                "description": tool["function"]["description"],
                "parameters": parameters,
            }
        )
    return declarations


def parse_attachment(raw_attachment):
    if raw_attachment is None:
        return None
    if not isinstance(raw_attachment, dict):
        raise ValueError("The attached file is invalid.")

    name = raw_attachment.get("name")
    mime_type = raw_attachment.get("mimeType")
    encoded_data = raw_attachment.get("data")
    if not isinstance(name, str) or not name.strip() or not isinstance(encoded_data, str):
        raise ValueError("The attached file is missing its name or contents.")
    name = name.replace("\\", "/").split("/")[-1][:200]
    allowed_mime_types = {
        "image/png", "image/jpeg", "image/webp", "image/gif", "application/pdf",
        "text/plain", "text/markdown", "text/csv", "application/json",
    }
    if mime_type not in allowed_mime_types:
        raise ValueError("Use a PNG, JPEG, WebP, or GIF photo, a PDF, or a TXT, Markdown, CSV, or JSON file.")
    try:
        file_bytes = base64.b64decode(encoded_data, validate=True)
    except (binascii.Error, ValueError):
        raise ValueError("Aura couldn't read the attached file.") from None
    if not file_bytes:
        raise ValueError("The attached file is empty.")
    if len(file_bytes) > MAX_ATTACHMENT_BYTES:
        raise ValueError("Choose a file smaller than 10 MB.")

    if mime_type.startswith("text/") or mime_type == "application/json":
        text = file_bytes.decode("utf-8-sig", errors="replace")
        if len(text) > MAX_TEXT_ATTACHMENT_CHARACTERS:
            raise ValueError("Text files must contain 100,000 characters or fewer.")
        return {"name": name, "mimeType": mime_type, "text": text}
    return {"name": name, "mimeType": mime_type, "data": encoded_data}


def generate_gemini_reply(messages, attachment=None):
    if not GEMINI_API_KEY:
        raise RuntimeError(
            "Gemini API key is missing. Add GEMINI_API_KEY to the .env file or environment, then restart Aura."
        )

    contents = []
    for index, message in enumerate(messages):
        parts = [{"text": message["content"]}]
        if attachment is not None and index == len(messages) - 1:
            if "text" in attachment:
                parts.append({"text": f"Attached file {attachment['name']}:\n{attachment['text']}"})
            else:
                parts.append({"text": f"Attached file: {attachment['name']}"})
                parts.append(
                    {
                        "inlineData": {
                            "mimeType": attachment["mimeType"],
                            "data": attachment["data"],
                        }
                    }
                )
        contents.append({
            "role": "user" if message["role"] == "user" else "model",
            "parts": parts,
        })
    local_now = datetime.now().astimezone().strftime("%A, %B %d, %Y at %I:%M:%S %p %Z")
    system_instruction = (
        f"{SYSTEM_INSTRUCTION} The current local date and time is {local_now}. "
        "Use this exact local date and time when asked; do not guess. "
        "When the latest user message includes an attachment, use its contents to answer the user's question. "
        "For app launch requests, choose an installed app from the launch_app function's allowed app list."
    )
    payload = {
        "systemInstruction": {"parts": [{"text": system_instruction}]},
        "contents": contents,
        "tools": [{"functionDeclarations": gemini_function_declarations()}],
        "toolConfig": {"functionCallingConfig": {"mode": "AUTO"}},
    }
    request = Request(
        f"{GEMINI_API_URL}/{GEMINI_MODEL}:generateContent",
        data=json.dumps(payload).encode("utf-8"),
        headers={
            "x-goog-api-key": GEMINI_API_KEY,
            "Content-Type": "application/json",
        },
        method="POST",
    )
    try:
        with urlopen(request, timeout=120) as response:
            result = json.loads(response.read())
    except HTTPError as error:
        service_message = extract_service_error_message(error.read())
        raise RuntimeError(f"Gemini API error (HTTP {error.code}): {service_message}") from None
    except (URLError, TimeoutError):
        raise RuntimeError("Could not connect to the Gemini API. Check your internet connection.") from None
    except json.JSONDecodeError as error:
        raise RuntimeError("Gemini API returned an invalid response.") from error

    try:
        parts = result["candidates"][0]["content"]["parts"]
    except (KeyError, IndexError, TypeError) as error:
        raise RuntimeError("Gemini API did not return a usable answer. Try asking another way.") from error
    if not isinstance(parts, list):
        raise RuntimeError("Gemini API returned an invalid answer. Try asking again.")

    reply_parts = []
    action = None
    for part in parts:
        if not isinstance(part, dict):
            continue
        part_text = part.get("text")
        if isinstance(part_text, str):
            reply_parts.append(part_text)
        function_call = part.get("functionCall")
        if not isinstance(function_call, dict) or action is not None:
            continue
        arguments = function_call.get("args", {})
        if not isinstance(arguments, dict):
            continue
        if function_call.get("name") == "open_website":
            try:
                action = {
                    "type": "open-url",
                    "url": validate_public_https_url(arguments.get("url")),
                }
            except ValueError:
                reply_parts.append("I can't open that address. Aura only opens public HTTPS websites.")
        elif function_call.get("name") == "launch_app":
            app_name = arguments.get("app")
            resolved_app = resolve_desktop_app(app_name)
            if resolved_app:
                app_id, app_label, _ = resolved_app
                action = {"type": "launch-app", "app": app_id, "appName": app_label}

    reply = "\n".join(part.strip() for part in reply_parts if part.strip())
    if action and not reply:
        if action["type"] == "open-url":
            reply = f"Would you like me to open {action['url']}?"
        else:
            reply = f"Would you like me to open {action['appName']}?"
    if not reply:
        reply = "I couldn't create a text answer. Please try asking again."
    return {"reply": reply, "action": action}


class AuraRequestHandler(BaseHTTPRequestHandler):
    server_version = "Aura/1.0"

    def _send_json(self, status, payload):
        body = json.dumps(payload).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(body)

    def _request_is_local(self):
        allowed_hosts = {f"{HOST}:{PORT}", f"localhost:{PORT}"}
        request_host = self.headers.get("Host", "").lower()
        if request_host not in allowed_hosts:
            self._send_json(403, {"error": "Aura only accepts requests from its local address."})
            return False

        origin = self.headers.get("Origin")
        if origin:
            parsed_origin = urlparse(origin)
            if (
                parsed_origin.scheme != "http"
                or parsed_origin.netloc.lower() != request_host
                or parsed_origin.path not in ("", "/")
                or parsed_origin.params
                or parsed_origin.query
                or parsed_origin.fragment
            ):
                self._send_json(403, {"error": "Request origin is not allowed."})
                return False
        return True

    def _read_json_body(self, max_bytes=MAX_REQUEST_BYTES):
        content_type = self.headers.get("Content-Type", "")
        if content_type.split(";", 1)[0].strip().lower() != "application/json":
            self._send_json(400, {"error": "Send a command as JSON using the command field."})
            return None

        try:
            content_length = int(self.headers.get("Content-Length", ""))
        except ValueError:
            self._send_json(400, {"error": "A valid Content-Length header is required."})
            return None

        if content_length < 1 or content_length > max_bytes:
            self._send_json(413, {"error": "Request body is empty or too large."})
            return None

        try:
            body = json.loads(self.rfile.read(content_length))
        except (json.JSONDecodeError, UnicodeDecodeError):
            self._send_json(400, {"error": "Request body must contain valid JSON."})
            return None
        return body

    def do_GET(self):
        if not self._request_is_local():
            return

        route = urlparse(self.path).path
        if route == "/api/status":
            self._send_json(
                200,
                gemini_status(),
            )
            return
        if route == "/api/history":
            try:
                with HISTORY_LOCK:
                    history = read_history()
                self._send_json(200, {"history": history})
            except (OSError, ValueError, json.JSONDecodeError):
                self.log_error("Could not read command history.")
                self._send_json(500, {"error": "Could not read command history."})
            return

        static_files = {
            "/": ("index.html", "text/html; charset=utf-8"),
            "/index.html": ("index.html", "text/html; charset=utf-8"),
            "/style.css": ("style.css", "text/css; charset=utf-8"),
            "/script.js": ("script.js", "text/javascript; charset=utf-8"),
        }
        file_info = static_files.get(route)
        if file_info is None:
            self._send_json(404, {"error": "Not found."})
            return

        filename, content_type = file_info
        try:
            content = (ROOT_DIR / filename).read_bytes()
        except OSError:
            self.log_error("Could not read website file %s.", filename)
            self._send_json(500, {"error": "Could not load the website file."})
            return

        self.send_response(200)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(len(content)))
        self.end_headers()
        self.wfile.write(content)

    def do_POST(self):
        if not self._request_is_local():
            return
        route = urlparse(self.path).path
        if route not in ("/api/chat", "/api/actions"):
            self._send_json(404, {"error": "Not found."})
            return

        if route == "/api/chat":
            self._handle_chat()
            return
        self._handle_action()

    def _handle_chat(self):
        body = self._read_json_body(MAX_CHAT_REQUEST_BYTES)
        if body is None:
            return
        messages = body.get("messages") if isinstance(body, dict) else None
        if not isinstance(messages, list) or not 1 <= len(messages) <= MAX_CHAT_MESSAGES:
            self._send_json(400, {"error": "Send up to 12 chat messages ending with your message."})
            return
        for message in messages:
            message_limit = (
                MAX_CHAT_MESSAGE_LENGTH
                if isinstance(message, dict) and message.get("role") == "user"
                else MAX_ASSISTANT_MESSAGE_LENGTH
            )
            if (
                not isinstance(message, dict)
                or message.get("role") not in ("user", "assistant")
                or not isinstance(message.get("content"), str)
                or not message["content"].strip()
                or len(message["content"]) > message_limit
            ):
                self._send_json(400, {"error": "Each chat message must have a valid role and text."})
                return
        if messages[-1]["role"] != "user":
            self._send_json(400, {"error": "The most recent chat message must be from you."})
            return

        try:
            attachment = parse_attachment(body.get("attachment"))
        except ValueError as error:
            self._send_json(400, {"error": str(error)})
            return

        try:
            direct_action = explicit_open_action(messages[-1]["content"])
            result = (
                {"reply": "", "action": direct_action}
                if direct_action
                else generate_gemini_reply(messages, attachment)
            )
        except RuntimeError as error:
            self._send_json(503, {"error": str(error)})
            return
        action = result.get("action")
        if action:
            if action["type"] == "open-url":
                if webbrowser.open(action["url"], new=2):
                    result["reply"] = f"Opened {action['url']}"
                else:
                    result["reply"] = "I couldn't open that website in your browser."
            elif action["type"] == "launch-app":
                try:
                    result["reply"] = launch_allowed_app(action["app"])
                except OSError:
                    result["reply"] = f"I couldn't open {action['appName']}."
            result["action"] = None

        user_text = messages[-1]["content"].strip()
        with HISTORY_LOCK:
            try:
                history = read_history()
                history.insert(
                    0,
                    {
                        "command": user_text,
                        "createdAt": datetime.now().astimezone().isoformat(),
                        "message": result["reply"],
                        "attachmentName": attachment["name"] if attachment else None,
                    },
                )
                write_history(history[:HISTORY_LIMIT])
            except (OSError, ValueError, json.JSONDecodeError):
                self.log_error("Could not save chat history.")
                self._send_json(500, {"error": "Could not save chat history."})
                return

        self._send_json(200, result)

    def _handle_action(self):
        body = self._read_json_body()
        if body is None:
            return
        if not isinstance(body, dict):
            self._send_json(400, {"error": "A valid confirmation token is required."})
            return
        app_name = consume_action_confirmation(body.get("confirmationToken"))
        if app_name is None:
            self._send_json(403, {"error": "This action was not approved or its confirmation expired."})
            return
        try:
            message = launch_allowed_app(app_name)
        except OSError:
            self.log_error("Could not launch an allowlisted app.")
            self._send_json(500, {"error": "Could not launch that app."})
            return
        self._send_json(200, {"message": message})

    def do_DELETE(self):
        if not self._request_is_local():
            return
        if urlparse(self.path).path != "/api/history":
            self._send_json(404, {"error": "Not found."})
            return

        try:
            with HISTORY_LOCK:
                write_history([])
        except OSError:
            self.log_error("Could not clear command history.")
            self._send_json(500, {"error": "Could not clear command history."})
            return
        self._send_json(200, {"history": []})


class LocalHTTPServer(ThreadingHTTPServer):
    allow_reuse_address = True
    daemon_threads = True


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO, format="%(message)s")
    if not 1 <= PORT <= 65535:
        raise ValueError("PORT must be a valid TCP port number.")

    server = LocalHTTPServer((HOST, PORT), AuraRequestHandler)
    print(f"Aura is running at http://{HOST}:{PORT}")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nStopping Aura.")
    finally:
        server.server_close()
