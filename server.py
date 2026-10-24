import json
import ipaddress
import logging
import os
import secrets
import subprocess
import tempfile
import threading
import time
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
OLLAMA_URL = "http://127.0.0.1:11434"
OLLAMA_MODEL = os.environ.get("OLLAMA_MODEL", "qwen3:4b")
MAX_REQUEST_BYTES = 4096
MAX_CHAT_REQUEST_BYTES = 128 * 1024
HISTORY_LIMIT = 50
MAX_CHAT_MESSAGES = 12
MAX_CHAT_MESSAGE_LENGTH = 2000
HISTORY_LOCK = threading.Lock()
PENDING_ACTIONS_LOCK = threading.Lock()
PENDING_ACTION_TTL_SECONDS = 120
pending_actions = {}

ALLOWED_APPS = {
    "notepad": ("notepad.exe", "Notepad"),
    "calculator": ("calc.exe", "Calculator"),
}
OLLAMA_TOOLS = [
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
            "description": "Propose opening an explicitly allowlisted desktop app when directly asked.",
            "parameters": {
                "type": "object",
                "properties": {
                    "app": {
                        "type": "string",
                        "enum": sorted(ALLOWED_APPS),
                        "description": "The exact allowlisted app identifier.",
                    }
                },
                "required": ["app"],
                "additionalProperties": False,
            },
        },
    },
]
SYSTEM_INSTRUCTION = (
    "You are Aura, a helpful conversational voice assistant. Answer general questions "
    "naturally and clearly. You have no live web access, so be honest about that. "
    "You may propose opening a website only when the user explicitly asks to open or visit "
    "one, and may propose launching Notepad or Calculator only when explicitly requested. "
    "Never claim an action has already happened. The user must approve every proposed action."
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
    executable, label = ALLOWED_APPS[app_name]
    if os.name != "nt":
        raise OSError("Opening desktop apps is supported only on Windows.")
    subprocess.Popen(
        [executable],
        stdin=subprocess.DEVNULL,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
        shell=False,
        close_fds=True,
    )
    return f"{label} is opening."


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
        message = "The local AI service did not return an error description."
    return " ".join(message.split())[:500]


def ollama_status():
    request = Request(f"{OLLAMA_URL}/api/tags", method="GET")
    try:
        with urlopen(request, timeout=2) as response:
            result = json.loads(response.read())
    except (HTTPError, URLError, TimeoutError, json.JSONDecodeError):
        return {
            "aiConfigured": False,
            "provider": "Ollama (local)",
            "model": OLLAMA_MODEL,
            "message": "Start Ollama, then download the model shown in the setup instructions.",
        }

    models = result.get("models", [])
    installed = any(
        isinstance(model, dict)
        and model.get("name", model.get("model")) in (OLLAMA_MODEL, f"{OLLAMA_MODEL}:latest")
        for model in models
    )
    return {
        "aiConfigured": installed,
        "provider": "Ollama (local)",
        "model": OLLAMA_MODEL,
        "message": (
            "Local model is ready."
            if installed
            else f"Download the model by running: ollama pull {OLLAMA_MODEL}"
        ),
    }


def generate_local_reply(messages):
    payload = {
        "model": OLLAMA_MODEL,
        "messages": [{"role": "system", "content": SYSTEM_INSTRUCTION}, *messages],
        "tools": OLLAMA_TOOLS,
        "stream": False,
        "options": {"num_predict": 1024},
    }
    request = Request(
        f"{OLLAMA_URL}/api/chat",
        data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    try:
        with urlopen(request, timeout=300) as response:
            result = json.loads(response.read())
    except HTTPError as error:
        service_message = extract_service_error_message(error.read())
        raise RuntimeError(f"Ollama error (HTTP {error.code}): {service_message}") from None
    except (URLError, TimeoutError) as error:
        raise RuntimeError("Could not connect to Ollama. Start the Ollama app and try again.") from error
    except json.JSONDecodeError as error:
        raise RuntimeError("Ollama returned an invalid response.") from error

    try:
        message = result["message"]
    except (KeyError, IndexError, TypeError) as error:
        raise RuntimeError("Ollama did not return a usable answer. Try asking another way.") from error

    reply = message.get("content")
    reply = reply.strip() if isinstance(reply, str) else ""
    action = None
    tool_calls = message.get("tool_calls")
    if not isinstance(tool_calls, list):
        tool_calls = []
    for tool_call in tool_calls:
        if not isinstance(tool_call, dict):
            continue
        function_call = tool_call.get("function", {})
        if not isinstance(function_call, dict):
            continue
        arguments = function_call.get("arguments", {})
        if isinstance(arguments, str):
            try:
                arguments = json.loads(arguments)
            except json.JSONDecodeError:
                continue
        if not isinstance(arguments, dict):
            continue
        if function_call.get("name") == "open_website" and action is None:
            try:
                action = {
                    "type": "open-url",
                    "url": validate_public_https_url(arguments.get("url")),
                }
            except ValueError:
                reply = reply or "I can't open that address. Aura only opens public HTTPS websites."
        elif function_call.get("name") == "launch_app" and action is None:
            app_name = arguments.get("app")
            if isinstance(app_name, str) and app_name in ALLOWED_APPS:
                action = {"type": "launch-app", "app": app_name}

    if action and not reply:
        if action["type"] == "open-url":
            reply = f"Would you like me to open {action['url']}?"
        else:
            reply = f"Would you like me to open {ALLOWED_APPS[action['app']][1]}?"
    if action:
        reply = f"{reply}\n\nI haven't done this yet. Approve below to continue."
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
                ollama_status(),
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
            if (
                not isinstance(message, dict)
                or message.get("role") not in ("user", "assistant")
                or not isinstance(message.get("content"), str)
                or not message["content"].strip()
                or len(message["content"]) > MAX_CHAT_MESSAGE_LENGTH
            ):
                self._send_json(400, {"error": "Each chat message must have a valid role and text."})
                return
        if messages[-1]["role"] != "user":
            self._send_json(400, {"error": "The most recent chat message must be from you."})
            return

        try:
            result = generate_local_reply(messages)
        except RuntimeError as error:
            self._send_json(503, {"error": str(error)})
            return
        if result["action"] and result["action"]["type"] == "launch-app":
            result["action"]["confirmationToken"] = issue_action_confirmation(result["action"]["app"])

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
