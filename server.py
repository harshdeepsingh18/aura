import json
import os
import re
import subprocess
import tempfile
import threading
from datetime import datetime
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import quote, urlparse


ROOT_DIR = Path(__file__).resolve().parent
DATA_DIR = ROOT_DIR / "data"
HISTORY_FILE = DATA_DIR / "history.json"
HOST = "127.0.0.1"
PORT = int(os.environ.get("PORT", "3000"))
MAX_REQUEST_BYTES = 4096
MAX_COMMAND_LENGTH = 200
HISTORY_LIMIT = 50
HISTORY_LOCK = threading.Lock()

ALLOWED_APPS = {
    "notepad": ("notepad.exe", "Notepad"),
    "calculator": ("calc.exe", "Calculator"),
}


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


def process_command(raw_command):
    command = raw_command.strip()
    normalized = re.sub(r"[.!?]+$", "", command.lower()).strip()

    if (
        re.search(r"\b(open|go to|visit|launch)\b.*\byoutube\b", normalized)
        or normalized == "youtube"
    ):
        return {
            "message": "Opening YouTube in a new tab.",
            "action": {"type": "open-url", "url": "https://www.youtube.com/"},
        }

    if (
        re.search(r"\b(play|start)\b.*\b(music|song|songs)\b", normalized)
        or normalized == "music"
    ):
        return {
            "message": "Opening music on YouTube.",
            "action": {
                "type": "open-url",
                "url": "https://www.youtube.com/results?search_query=music",
            },
        }

    if re.match(r"^(search|google|look up)\b", normalized):
        query = re.sub(r"^(search for|search|google|look up)\s*", "", command, flags=re.I).strip()
        if not query:
            return {"message": "Tell me what you want to search for."}
        return {
            "message": f"Searching for {query}.",
            "action": {
                "type": "open-url",
                "url": f"https://www.google.com/search?q={quote(query, safe='')}",
            },
        }

    if re.search(r"\b(time|clock)\b", normalized):
        current_time = datetime.now().astimezone().strftime("%I:%M %p").lstrip("0")
        return {"message": f"It is {current_time}."}

    app_match = re.fullmatch(
        r"(?:please\s+)?(?:open|launch|start)\s+(notepad|calculator)(?:\s+app)?",
        normalized,
    )
    if app_match:
        return {"message": launch_allowed_app(app_match.group(1))}

    return {
        "message": (
            "I don't know that command yet. Try YouTube, music, search, Notepad, or Calculator."
        )
    }


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

    def _read_json_body(self):
        content_type = self.headers.get("Content-Type", "")
        if content_type.split(";", 1)[0].strip().lower() != "application/json":
            self._send_json(400, {"error": "Send a command as JSON using the command field."})
            return None

        try:
            content_length = int(self.headers.get("Content-Length", ""))
        except ValueError:
            self._send_json(400, {"error": "A valid Content-Length header is required."})
            return None

        if content_length < 1 or content_length > MAX_REQUEST_BYTES:
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
        if urlparse(self.path).path != "/api/commands":
            self._send_json(404, {"error": "Not found."})
            return

        body = self._read_json_body()
        if body is None:
            return
        if not isinstance(body, dict) or not isinstance(body.get("command"), str):
            self._send_json(400, {"error": "Send a command as JSON using the command field."})
            return

        command = body["command"].strip()
        if not command or len(command) > MAX_COMMAND_LENGTH:
            self._send_json(400, {"error": "A command must contain 1 to 200 characters."})
            return

        try:
            result = process_command(command)
            with HISTORY_LOCK:
                history = read_history()
                history.insert(
                    0,
                    {
                        "command": command,
                        "createdAt": datetime.now().astimezone().isoformat(),
                        "message": result["message"],
                    },
                )
                write_history(history[:HISTORY_LIMIT])
        except OSError as error:
            self.log_error("Could not complete command: %s", error)
            self._send_json(500, {"error": "The server could not complete the command."})
            return
        except (ValueError, json.JSONDecodeError):
            self.log_error("Could not read command history.")
            self._send_json(500, {"error": "Could not read command history."})
            return

        self._send_json(200, result)

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
