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
import uuid
import webbrowser
from datetime import datetime, timedelta
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.parse import urlparse
from urllib.request import Request, urlopen


ROOT_DIR = Path(__file__).resolve().parent

DATA_DIR = ROOT_DIR / "data"
HISTORY_FILE = DATA_DIR / "history.json"
CHATS_FILE = DATA_DIR / "chats.json"
HOST = os.environ.get("HOST", "127.0.0.1")
PORT = int(os.environ.get("PORT", "3000"))
LOCAL_HOSTS = ("127.0.0.1", "localhost", "::1")
GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models"
GEMINI_MODEL = "gemini-3.1-flash-lite"
GEMINI_REQUEST_TIMEOUT_SECONDS = 45
MAX_REQUEST_BYTES = 4096
MAX_CHAT_REQUEST_BYTES = 16 * 1024 * 1024
MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024
MAX_TEXT_ATTACHMENT_CHARACTERS = 100000
HISTORY_LIMIT = 50
MAX_CHAT_MESSAGES = 12
MAX_CHAT_MESSAGE_LENGTH = 2000
MAX_ASSISTANT_MESSAGE_LENGTH = 12000
RESPONSE_LANGUAGES = {
    "en": "English",
    "hi": "Hindi",
    "es": "Spanish",
    "fr": "French",
    "pa": "Punjabi",
}
HISTORY_LOCK = threading.Lock()
CHATS_LOCK = threading.Lock()
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
            "name": "create_calendar_event",
            "description": "Prepare a calendar event when the user directly asks to schedule or add an event. Return ISO 8601 local start and end times; if no end is specified, assume one hour.",
            "parameters": {
                "type": "object",
                "properties": {
                    "title": {"type": "string", "description": "Short event title."},
                    "start": {"type": "string", "description": "Local date/time in ISO 8601 format, for example 2026-09-14T09:00:00."},
                    "end": {"type": "string", "description": "Local end date/time in ISO 8601 format."},
                    "details": {"type": "string", "description": "Optional event details."},
                    "location": {"type": "string", "description": "Optional event location."},
                },
                "required": ["title", "start", "end"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "set_alarm",
            "description": "Prepare a local browser alarm when the user directly asks to set an alarm or reminder. Return ISO 8601 local time.",
            "parameters": {
                "type": "object",
                "properties": {
                    "title": {"type": "string", "description": "What the alarm is for."},
                    "time": {"type": "string", "description": "Local date/time in ISO 8601 format."},
                },
                "required": ["title", "time"],
            },
        },
    },
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


def explicit_alarm_request(command):
    """Handle clear alarm/reminder requests locally instead of relying on model tool choice."""
    if not re.search(
        r"\b(?:set|create|make)\s+(?:me\s+)?(?:an?\s+)?(?:alarm|reminder)\b|\bremind\s+me\b|\bwake\s+me\b",
        command,
        re.IGNORECASE,
    ):
        return None

    now = datetime.now().astimezone()
    lowered = command.casefold()
    relative = re.search(r"\bin\s+(\d{1,3})\s*(minutes?|mins?|hours?|hrs?)\b", command, re.IGNORECASE)
    time_match = None
    if relative:
        amount = int(relative.group(1))
        unit = relative.group(2).casefold()
        alarm_at = now + (timedelta(hours=amount) if unit.startswith(("hour", "hr")) else timedelta(minutes=amount))
    else:
        time_match = re.search(r"\b(\d{1,2})(?::([0-5]\d))?\s*(a\.?m\.?|p\.?m\.?)\b", command, re.IGNORECASE)
        if time_match:
            hour = int(time_match.group(1))
            minute = int(time_match.group(2) or 0)
            meridiem = time_match.group(3).casefold().replace(".", "")
            if not 1 <= hour <= 12:
                return {"reply": "Please give the alarm time in a format like 7:30 AM or 7:30 PM.", "action": None}
            hour = hour % 12 + (12 if meridiem == "pm" else 0)
        else:
            time24 = re.search(r"\b(?:at|for)\s+([01]?\d|2[0-3]):([0-5]\d)\b", command, re.IGNORECASE)
            if not time24:
                return {"reply": "What time should I set the alarm for? Please include AM or PM, or use 24-hour time.", "action": None}
            time_match = time24
            hour, minute = int(time24.group(1)), int(time24.group(2))

        requested_date = None
        if re.search(r"\bday after tomorrow\b", lowered):
            requested_date = (now + timedelta(days=2)).date()
        elif re.search(r"\btomorrow\b", lowered):
            requested_date = (now + timedelta(days=1)).date()
        elif re.search(r"\btoday\b", lowered):
            requested_date = now.date()
        else:
            iso_date = re.search(r"\b(20\d{2})-(\d{1,2})-(\d{1,2})\b", command)
            dmy_date = re.search(r"\b(\d{1,2})[/.](\d{1,2})[/.](\d{4})\b", command)
            try:
                if iso_date:
                    requested_date = datetime(int(iso_date.group(1)), int(iso_date.group(2)), int(iso_date.group(3))).date()
                elif dmy_date:
                    first, second, year = map(int, dmy_date.groups())
                    day, month = (second, first) if first <= 12 < second else (first, second)
                    requested_date = datetime(year, month, day).date()
            except ValueError:
                return {"reply": "That date doesn't look valid. Please send the alarm date again.", "action": None}

        if requested_date is None:
            requested_date = now.date()
        alarm_at = now.replace(hour=hour, minute=minute, second=0, microsecond=0)
        alarm_at = alarm_at.replace(year=requested_date.year, month=requested_date.month, day=requested_date.day)
        if alarm_at <= now and not re.search(r"\b(?:today|tomorrow|day after tomorrow|on\s+\d)\b", lowered):
            alarm_at += timedelta(days=1)

    if alarm_at <= now:
        return {"reply": "That time has already passed. Please choose a future alarm time.", "action": None}

    title = command.strip()
    title = re.sub(r"^\s*(?:aura[, :]+)?", "", title, flags=re.IGNORECASE)
    title = re.sub(r"^(?:please\s+)?(?:set|create|make)\s+(?:me\s+)?(?:an?\s+)?(?:alarm|reminder)(?:\s+(?:for|to))?\s*", "", title, flags=re.IGNORECASE)
    title = re.sub(r"^(?:please\s+)?remind\s+me(?:\s+(?:to|about))?\s*", "", title, flags=re.IGNORECASE)
    title = re.sub(r"^(?:(?:at|for)\s+)?\d{1,2}(?::\d{2})?\s*(?:a\.?m\.?|p\.?m\.?)\s*(?:to|for)?\s*", "", title, flags=re.IGNORECASE)
    title = re.sub(r"^(?:wake\s+me\s+up\s+)?(?:at\s+)?", "", title, flags=re.IGNORECASE)
    title = re.sub(r"\s+(?:today|tomorrow|day after tomorrow|on\s+\d{1,4}[/.\-]\d{1,2}(?:[/.\-]\d{2,4})?)\b.*$", "", title, flags=re.IGNORECASE)
    title = re.sub(r"\b20\d{2}-\d{1,2}-\d{1,2}\b", "", title)
    title = re.sub(r"\b\d{1,2}[/.]\d{1,2}[/.]\d{4}\b", "", title)
    title = re.sub(r"\s+(?:(?:at|for)\s+)?\d{1,2}(?::\d{2})?\s*(?:a\.?m\.?|p\.?m\.?)?.*$", "", title, flags=re.IGNORECASE)
    title = re.sub(r"^(?:to|for)\s+", "", title, flags=re.IGNORECASE)
    title = re.sub(r"\s+in\s+\d{1,3}\s*(?:minutes?|mins?|hours?|hrs?)\b.*$", "", title, flags=re.IGNORECASE)
    title = re.sub(r"[.!?]+$", "", title).strip() or "Alarm"
    action = {"type": "alarm", "title": title[:160], "time": alarm_at.isoformat(timespec="minutes")}
    return {"reply": f"Ready to set an alarm for {action['title']} at {alarm_at.strftime('%I:%M %p on %B %d')}.", "action": action}


def explicit_calendar_request(command):
    """Create a structured calendar draft for explicit dated task/event requests."""
    intent = re.search(
        r"\b(?:add|put|set|schedule|create|book)\b.{0,50}\b(?:task|event|meeting|appointment)\b|"
        r"\b(?:add|put|set|schedule|create|book)\s+(?:an?\s+)?(?:task|event|meeting|appointment)\b",
        command,
        re.IGNORECASE,
    )
    if not intent:
        return None

    now = datetime.now().astimezone()
    lowered = command.casefold()
    event_date = None
    if re.search(r"\bday after tomorrow\b", lowered):
        event_date = (now + timedelta(days=2)).date()
    elif re.search(r"\btomorrow\b", lowered):
        event_date = (now + timedelta(days=1)).date()
    elif re.search(r"\btoday\b", lowered):
        event_date = now.date()
    else:
        iso_date = re.search(r"\b(20\d{2})-(\d{1,2})-(\d{1,2})\b", command)
        dmy_date = re.search(r"\b(\d{1,2})[/.](\d{1,2})[/.](\d{4})\b", command)
        try:
            if iso_date:
                event_date = datetime(int(iso_date.group(1)), int(iso_date.group(2)), int(iso_date.group(3))).date()
            elif dmy_date:
                first, second, year = map(int, dmy_date.groups())
                day, month = (second, first) if first <= 12 < second else (first, second)
                event_date = datetime(year, month, day).date()
        except ValueError:
            return {"reply": "That date doesn't look valid. Please send the calendar date again.", "action": None}

    if event_date is None:
        return {"reply": "What date should I add this to? You can give a date like 14/09/2026.", "action": None}

    has_clock_hint = bool(re.search(r"\b(?:at|from)\s+\d{1,2}\b|\b\d{1,2}:\d{2}\s*(?:a\.?m\.?|p\.?m\.?)?", command, re.IGNORECASE))
    time_match = re.search(r"\b(\d{1,2})(?::([0-5]\d))?\s*(a\.?m\.?|p\.?m\.?)\b", command, re.IGNORECASE)
    time24 = None if time_match else re.search(r"\b(?:at|from)\s+([01]?\d|2[0-3]):([0-5]\d)\b", command, re.IGNORECASE)
    if has_clock_hint and not time_match and not time24:
        return {"reply": "What time should I use? Please include AM or PM, or use 24-hour time.", "action": None}

    all_day = not time_match and not time24
    if all_day:
        start = datetime.combine(event_date, datetime.min.time()).replace(tzinfo=now.tzinfo)
        end = start + timedelta(days=1)
    else:
        if time_match:
            hour = int(time_match.group(1))
            minute = int(time_match.group(2) or 0)
            meridiem = time_match.group(3).casefold().replace(".", "")
            if not 1 <= hour <= 12:
                return {"reply": "Please give the event time in a format like 7:30 AM or 7:30 PM.", "action": None}
            hour = hour % 12 + (12 if meridiem == "pm" else 0)
        else:
            hour, minute = int(time24.group(1)), int(time24.group(2))
        start = datetime.combine(event_date, datetime.min.time()).replace(
            hour=hour, minute=minute, tzinfo=now.tzinfo
        )
        end = start + timedelta(hours=1)

    title = command.strip()
    title = re.sub(r"^\s*(?:aura[, :]+)?(?:please\s+)?(?:add|put|set|schedule|create|book)\s+", "", title, flags=re.IGNORECASE)
    title = re.sub(r"^(?:some\s+things?\s+like\s+)?(?:an?\s+|the\s+|my\s+)?(?:task|event|meeting|appointment)\b(?:\s+(?:to|called|named))?\s*", "", title, flags=re.IGNORECASE)
    title = re.sub(r"\s+(?:on|for|at|from)\s+(?:(?:the\s+)?date\s+)?(?:today|tomorrow|day after tomorrow|\d{1,4}[/.\-]\d{1,2}(?:[/.\-]\d{2,4})?|20\d{2}-\d{1,2}-\d{1,2}).*$", "", title, flags=re.IGNORECASE)
    title = re.sub(r"\b20\d{2}-\d{1,2}-\d{1,2}\b|\b\d{1,2}[/.]\d{1,2}[/.]\d{4}\b", "", title)
    title = re.sub(r"\s+(?:at|from)\s+\d{1,2}(?::\d{2})?\s*(?:a\.?m\.?|p\.?m\.?)?.*$", "", title, flags=re.IGNORECASE)
    title = re.sub(r"^(?:on|for)\s+", "", title, flags=re.IGNORECASE)
    title = re.sub(r"^(?:these|this|the)\s+date\b.*$", "", title, flags=re.IGNORECASE)
    title = re.sub(r"[.!?]+$", "", title).strip() or "Task"
    if title.casefold() in ("task", "event", "meeting", "appointment", "these date", "this date"):
        return {"reply": "What should I call the task or event? Please include a short title.", "action": None}
    action = {
        "type": "calendar-event",
        "title": title[:160],
        "start": event_date.isoformat() if all_day else start.isoformat(timespec="minutes"),
        "end": end.date().isoformat() if all_day else end.isoformat(timespec="minutes"),
        "allDay": all_day,
        "details": "",
        "location": "",
    }
    date_label = event_date.strftime("%B %d, %Y")
    reply = f"Ready to add {action['title']} to your calendar on {date_label}."
    if not all_day:
        reply = f"Ready to add {action['title']} to your calendar on {date_label} at {start.strftime('%I:%M %p')}."
    return {"reply": reply, "action": action}


def load_gemini_api_key():
    return load_setting("GEMINI_API_KEY")


def load_setting(name):
    environment_key = os.environ.get(name, "").strip()
    if environment_key:
        return environment_key

    env_file = ROOT_DIR / ".env"
    if not env_file.exists():
        return ""
    for line in env_file.read_text(encoding="utf-8").splitlines():
        key, separator, value = line.strip().partition("=")
        if separator and key.strip() == name:
            return value.strip().strip("\"'")
    return ""


SUPABASE_URL = load_setting("SUPABASE_URL").rstrip("/")
SUPABASE_ANON_KEY = load_setting("SUPABASE_ANON_KEY")
PUBLIC_ORIGIN = load_setting("PUBLIC_ORIGIN").rstrip("/")
SUPABASE_ENABLED = bool(SUPABASE_URL and SUPABASE_ANON_KEY)


def is_valid_origin(value, allow_local_http):
    try:
        parsed = urlparse(value)
        hostname = parsed.hostname
        port = parsed.port
    except ValueError:
        return False
    if (
        parsed.scheme not in (("https", "http") if allow_local_http else ("https",))
        or not hostname
        or parsed.username is not None
        or parsed.password is not None
        or parsed.path not in ("", "/")
        or parsed.params
        or parsed.query
        or parsed.fragment
    ):
        return False
    return parsed.scheme == "https" or (hostname in LOCAL_HOSTS and port is not None)


SUPABASE_MISCONFIGURED = (
    bool(SUPABASE_URL) != bool(SUPABASE_ANON_KEY)
    or (bool(SUPABASE_URL) and not is_valid_origin(SUPABASE_URL, allow_local_http=True))
    or (bool(PUBLIC_ORIGIN) and not is_valid_origin(PUBLIC_ORIGIN, allow_local_http=True))
)
GEMINI_API_KEY = load_gemini_api_key()
SUPABASE_TIMEOUT_SECONDS = 10


class SupabaseRequestError(RuntimeError):
    def __init__(self, status, message):
        super().__init__(message)
        self.status = status


def supabase_request(path, access_token, method="GET", payload=None, prefer=None):
    if SUPABASE_MISCONFIGURED or not SUPABASE_ENABLED:
        raise SupabaseRequestError(503, "Supabase settings are incomplete or invalid.")
    headers = {
        "apikey": SUPABASE_ANON_KEY,
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/json",
    }
    if prefer:
        headers["Prefer"] = prefer
    data = json.dumps(payload).encode("utf-8") if payload is not None else None
    request = Request(f"{SUPABASE_URL}{path}", data=data, headers=headers, method=method)
    try:
        with urlopen(request, timeout=SUPABASE_TIMEOUT_SECONDS) as response:
            response_body = response.read()
    except HTTPError as error:
        message = extract_service_error_message(error.read())
        raise SupabaseRequestError(error.code, message) from None
    except (TimeoutError, URLError) as error:
        raise SupabaseRequestError(503, "Could not connect to Supabase. Check the service settings and connection.") from error
    if not response_body:
        return None
    try:
        return json.loads(response_body)
    except json.JSONDecodeError as error:
        raise SupabaseRequestError(502, "Supabase returned an invalid response.") from error


def authenticate_supabase_user(access_token):
    user = supabase_request("/auth/v1/user", access_token)
    if not isinstance(user, dict) or not isinstance(user.get("id"), str):
        raise SupabaseRequestError(401, "Please sign in again.")
    return user


def cloud_chat_from_row(row):
    return {
        "id": row["id"],
        "title": row.get("title", "New chat"),
        "createdAt": row.get("created_at", ""),
        "updatedAt": row.get("updated_at", ""),
        "messages": row.get("messages", []),
    }


def cloud_list_chats(access_token):
    rows = supabase_request(
        "/rest/v1/chats?select=id,title,created_at,updated_at,messages&order=updated_at.desc",
        access_token,
    )
    if not isinstance(rows, list):
        raise SupabaseRequestError(502, "Supabase returned an invalid chat list.")
    return [cloud_chat_from_row(row) for row in rows if isinstance(row, dict)]


def cloud_get_chat(access_token, chat_id):
    rows = supabase_request(
        f"/rest/v1/chats?id=eq.{chat_id}&select=id,title,created_at,updated_at,messages",
        access_token,
    )
    if not isinstance(rows, list):
        raise SupabaseRequestError(502, "Supabase returned an invalid chat.")
    return cloud_chat_from_row(rows[0]) if rows else None


def cloud_save_chat(access_token, user_id, chat):
    payload = {
        "id": chat["id"],
        "user_id": user_id,
        "title": chat["title"],
        "created_at": chat["createdAt"],
        "updated_at": chat["updatedAt"],
        "messages": chat["messages"],
    }
    rows = supabase_request(
        "/rest/v1/chats?on_conflict=id",
        access_token,
        method="POST",
        payload=payload,
        prefer="resolution=merge-duplicates,return=representation",
    )
    if not isinstance(rows, list) or not rows:
        raise SupabaseRequestError(502, "Supabase did not save the chat.")
    return cloud_chat_from_row(rows[0])


def cloud_delete_chat(access_token, chat_id):
    return supabase_request(
        f"/rest/v1/chats?id=eq.{chat_id}",
        access_token,
        method="DELETE",
        prefer="return=representation",
    )
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


def write_chats(chats):
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    temporary_path = None
    try:
        with tempfile.NamedTemporaryFile(
            mode="w",
            encoding="utf-8",
            dir=DATA_DIR,
            prefix="chats-",
            suffix=".tmp",
            delete=False,
        ) as temporary_file:
            temporary_path = Path(temporary_file.name)
            json.dump(chats, temporary_file, indent=2)
        os.replace(temporary_path, CHATS_FILE)
    finally:
        if temporary_path is not None and temporary_path.exists():
            temporary_path.unlink()


def read_chats():
    try:
        chats = json.loads(CHATS_FILE.read_text(encoding="utf-8"))
    except FileNotFoundError:
        chats = []
        for entry in read_history():
            if not isinstance(entry, dict):
                continue
            command = entry.get("command")
            reply = entry.get("message")
            if not isinstance(command, str) or not command.strip() or not isinstance(reply, str) or not reply.strip():
                continue
            created_at = entry.get("createdAt")
            if not isinstance(created_at, str):
                created_at = datetime.now().astimezone().isoformat()
            user_message = {"role": "user", "content": command}
            if isinstance(entry.get("attachmentName"), str):
                user_message["attachmentName"] = entry["attachmentName"]
            chats.append(
                {
                    "id": str(uuid.uuid4()),
                    "title": command.strip()[:48],
                    "createdAt": created_at,
                    "updatedAt": created_at,
                    "messages": [user_message, {"role": "assistant", "content": reply}],
                }
            )
        write_chats(chats)
    if not isinstance(chats, list):
        raise ValueError("Chat file must contain a JSON array.")
    return chats


def ordered_chats(chats):
    valid_chats = [
        chat
        for chat in chats
        if isinstance(chat, dict) and isinstance(chat.get("id"), str)
    ]
    return sorted(valid_chats, key=lambda entry: entry.get("updatedAt", entry.get("createdAt", "")), reverse=True)


def chat_summaries(chats):
    return [
        {
            "id": chat["id"],
            "title": chat.get("title", "New chat"),
            "updatedAt": chat.get("updatedAt", chat.get("createdAt", "")),
        }
        for chat in ordered_chats(chats)
    ]


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


def generate_gemini_reply(messages, attachment=None, response_language="en"):
    if not GEMINI_API_KEY:
        raise RuntimeError(
            "Gemini API key is missing. Add GEMINI_API_KEY to the .env file or environment, then restart Aura."
        )
    language_name = RESPONSE_LANGUAGES.get(response_language)
    if language_name is None:
        raise RuntimeError("The selected response language is not supported.")

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
        f"Respond in {language_name} unless the user explicitly asks for another language. "
        "For app launch requests, choose an installed app from the launch_app function's allowed app list."
        " For calendar events and alarms, prepare the matching function call only when directly asked, "
        "ask a follow-up question if the date or time is missing or ambiguous, and never say it is set "
        "until the user approves the action in Aura. Aura can set browser alarms; use the set_alarm function "
        "instead of claiming you cannot set alarms. Use the local timezone for all dates and times."
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
        with urlopen(request, timeout=GEMINI_REQUEST_TIMEOUT_SECONDS) as response:
            result = json.loads(response.read())
    except HTTPError as error:
        service_message = extract_service_error_message(error.read())
        raise RuntimeError(f"Gemini API error (HTTP {error.code}): {service_message}") from None
    except TimeoutError:
        raise RuntimeError(
            f"Gemini did not respond within {GEMINI_REQUEST_TIMEOUT_SECONDS} seconds. Please try again."
        ) from None
    except URLError as error:
        if isinstance(error.reason, TimeoutError):
            raise RuntimeError(
                f"Gemini did not respond within {GEMINI_REQUEST_TIMEOUT_SECONDS} seconds. Please try again."
            ) from None
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
        elif function_call.get("name") == "create_calendar_event":
            title = arguments.get("title")
            start = arguments.get("start")
            end = arguments.get("end")
            try:
                start_date = datetime.fromisoformat(start)
                end_date = datetime.fromisoformat(end)
                if not isinstance(title, str) or not title.strip() or end_date <= start_date:
                    raise ValueError
                action = {
                    "type": "calendar-event",
                    "title": title.strip()[:160],
                    "start": start_date.isoformat(timespec="minutes"),
                    "end": end_date.isoformat(timespec="minutes"),
                    "details": str(arguments.get("details", ""))[:1000],
                    "location": str(arguments.get("location", ""))[:300],
                }
            except (TypeError, ValueError):
                reply_parts.append("I couldn't make a valid calendar entry. Please check the date and time.")
        elif function_call.get("name") == "set_alarm":
            title = arguments.get("title")
            alarm_time = arguments.get("time")
            try:
                parsed_time = datetime.fromisoformat(alarm_time)
                if not isinstance(title, str) or not title.strip():
                    raise ValueError
                action = {
                    "type": "alarm",
                    "title": title.strip()[:160],
                    "time": parsed_time.isoformat(timespec="minutes"),
                }
            except (TypeError, ValueError):
                reply_parts.append("I couldn't make a valid alarm. Please check the date and time.")

    reply = "\n".join(part.strip() for part in reply_parts if part.strip())
    if action and not reply:
        if action["type"] == "calendar-event":
            reply = f"Ready to add {action['title']} to your calendar."
        elif action["type"] == "alarm":
            reply = f"Ready to set an alarm for {action['title']}."
        elif action["type"] == "open-url":
            reply = f"Would you like me to open {action['url']}?"
        else:
            reply = f"Would you like me to open {action['appName']}?"
    if not reply:
        reply = "I couldn't create a text answer. Please try asking again."
    return {"reply": reply, "action": action}


class AuraRequestHandler(BaseHTTPRequestHandler):
    server_version = "Aura/1.0"

    def _send_supabase_error(self, error, operation):
        if error.status in (401, 403):
            self._send_json(401, {"error": "Your sign-in has expired. Please sign in again."})
            return
        self.log_error("Supabase error while attempting to %s: %s", operation, error)
        self._send_json(503, {"error": f"Could not {operation}. Check your Supabase configuration and try again."})

    def _require_user(self):
        if not SUPABASE_ENABLED:
            return {"id": None}
        authorization = self.headers.get("Authorization", "")
        scheme, separator, access_token = authorization.partition(" ")
        if scheme.lower() != "bearer" or not separator or not access_token.strip():
            self._send_json(401, {"error": "Sign in with Google or GitHub to continue."})
            return None
        try:
            return authenticate_supabase_user(access_token.strip())
        except SupabaseRequestError as error:
            self._send_supabase_error(error, "verify your sign-in")
            return None

    def _send_json(self, status, payload):
        body = json.dumps(payload).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(body)

    def _request_is_allowed(self):
        request_host = self.headers.get("Host", "").lower()
        origin = self.headers.get("Origin")
        if SUPABASE_ENABLED and PUBLIC_ORIGIN:
            configured_origin = urlparse(PUBLIC_ORIGIN)
            if request_host != configured_origin.netloc.lower():
                self._send_json(403, {"error": "Request host is not allowed."})
                return False
            if origin:
                parsed_origin = urlparse(origin)
                if (
                    parsed_origin.scheme != configured_origin.scheme
                    or parsed_origin.netloc.lower() != configured_origin.netloc.lower()
                    or parsed_origin.path not in ("", "/")
                    or parsed_origin.params
                    or parsed_origin.query
                    or parsed_origin.fragment
                ):
                    self._send_json(403, {"error": "Request origin is not allowed."})
                    return False
            return True

        allowed_hosts = {
            f"127.0.0.1:{PORT}".lower(),
            f"localhost:{PORT}".lower(),
            f"[::1]:{PORT}".lower(),
        }

        if request_host not in allowed_hosts:
            self._send_json(403, {"error": "Aura only accepts local requests."})
            return False

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
        if not self._request_is_allowed():
            return

        route = urlparse(self.path).path
        if route == "/api/config":
            self._send_json(
                200,
                {
                    "authEnabled": SUPABASE_ENABLED,
                    "authMisconfigured": SUPABASE_MISCONFIGURED,
                    "supabaseUrl": SUPABASE_URL if SUPABASE_ENABLED else None,
                    "supabaseAnonKey": SUPABASE_ANON_KEY if SUPABASE_ENABLED else None,
                },
            )
            return
        if route == "/api/status":
            self._send_json(
                200,
                gemini_status(),
            )
            return
        if route == "/api/chats":
            user = self._require_user()
            if user is None:
                return
            if SUPABASE_ENABLED:
                try:
                    chats = cloud_list_chats(self.headers.get("Authorization", "").partition(" ")[2].strip())
                    self._send_json(
                        200,
                        {
                            "chats": chat_summaries(chats),
                            "activeChat": next(iter(ordered_chats(chats)), None),
                        },
                    )
                except SupabaseRequestError as error:
                    self._send_supabase_error(error, "load your chats")
                return
            try:
                with CHATS_LOCK:
                    chats = read_chats()
                self._send_json(
                    200,
                    {
                        "chats": chat_summaries(chats),
                        "activeChat": next(iter(ordered_chats(chats)), None),
                    },
                )
            except (OSError, ValueError, json.JSONDecodeError):
                self.log_error("Could not read local chats.")
                self._send_json(500, {"error": "Could not read saved chats."})
            return
        if route.startswith("/api/chats/"):
            user = self._require_user()
            if user is None:
                return
            chat_id = route.removeprefix("/api/chats/")
            if not chat_id or "/" in chat_id:
                self._send_json(404, {"error": "Chat not found."})
                return
            if SUPABASE_ENABLED:
                try:
                    chat = cloud_get_chat(self.headers.get("Authorization", "").partition(" ")[2].strip(), chat_id)
                    if chat is None:
                        self._send_json(404, {"error": "Chat not found."})
                        return
                    self._send_json(200, {"chat": chat})
                except SupabaseRequestError as error:
                    self._send_supabase_error(error, "open your chat")
                return
            try:
                with CHATS_LOCK:
                    chats = read_chats()
                chat = next((entry for entry in chats if entry.get("id") == chat_id), None)
                if chat is None:
                    self._send_json(404, {"error": "Chat not found."})
                    return
                self._send_json(200, {"chat": chat})
            except (OSError, ValueError, json.JSONDecodeError):
                self.log_error("Could not open local chat.")
                self._send_json(500, {"error": "Could not open saved chat."})
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
        if not self._request_is_allowed():
            return
        route = urlparse(self.path).path
        if route not in ("/api/chat", "/api/actions", "/api/chats"):
            self._send_json(404, {"error": "Not found."})
            return
        user = self._require_user()
        if user is None:
            return
        if route == "/api/chat":
            self._handle_chat(user)
            return
        if route == "/api/chats":
            self._handle_create_chat(user)
            return
        self._handle_action()

    def _handle_create_chat(self, user):
        body = self._read_json_body()
        if body is None:
            return
        now = datetime.now().astimezone().isoformat()
        chat_id = str(uuid.uuid4())
        chat = {
            "id": chat_id,
            "title": "New chat",
            "createdAt": now,
            "updatedAt": now,
            "messages": [],
        }
        if SUPABASE_ENABLED:
            access_token = self.headers.get("Authorization", "").partition(" ")[2].strip()
            try:
                chat = cloud_save_chat(access_token, user["id"], chat)
                chats = cloud_list_chats(access_token)
                self._send_json(201, {"chat": chat, "chats": chat_summaries(chats)})
            except SupabaseRequestError as error:
                self._send_supabase_error(error, "create a new chat")
            return
        try:
            with CHATS_LOCK:
                chats = read_chats()
                chats.insert(0, chat)
                write_chats(chats)
            self._send_json(201, {"chat": chat, "chats": chat_summaries(chats)})
        except (OSError, ValueError, json.JSONDecodeError):
            self.log_error("Could not create a local chat.")
            self._send_json(500, {"error": "Could not create a new chat."})

    def _handle_chat(self, user):
        body = self._read_json_body(MAX_CHAT_REQUEST_BYTES)
        if body is None:
            return
        messages = body.get("messages") if isinstance(body, dict) else None
        if not isinstance(messages, list) or not 1 <= len(messages) <= MAX_CHAT_MESSAGES:
            self._send_json(400, {"error": "Send up to 12 chat messages ending with your message."})
            return
        response_language = body.get("language", "en")
        if not isinstance(response_language, str) or response_language not in RESPONSE_LANGUAGES:
            self._send_json(400, {"error": "Choose a supported response language."})
            return
        chat_id = body.get("chatId") if isinstance(body, dict) else None
        if not isinstance(chat_id, str) or not chat_id:
            self._send_json(400, {"error": "A chat must be selected before sending a message."})
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

        access_token = self.headers.get("Authorization", "").partition(" ")[2].strip()
        if SUPABASE_ENABLED:
            try:
                chat = cloud_get_chat(access_token, chat_id)
            except SupabaseRequestError as error:
                self._send_supabase_error(error, "open your chat")
                return
        else:
            try:
                with CHATS_LOCK:
                    chats = read_chats()
                chat = next((entry for entry in chats if entry.get("id") == chat_id), None)
            except (OSError, ValueError, json.JSONDecodeError):
                self.log_error("Could not open local chat for a new message.")
                self._send_json(500, {"error": "Could not open saved chat."})
                return
        if chat is None:
            self._send_json(404, {"error": "This chat no longer exists. Start a new chat and try again."})
            return

        try:
            attachment = parse_attachment(body.get("attachment"))
        except ValueError as error:
            self._send_json(400, {"error": str(error)})
            return

        try:
            stored_messages = chat.get("messages", [])
            conversation_messages = [
                {"role": message["role"], "content": message["content"]}
                for message in stored_messages
                if isinstance(message, dict)
                and message.get("role") in ("user", "assistant")
                and isinstance(message.get("content"), str)
                and message["content"].strip()
            ]
            model_messages = conversation_messages[-(MAX_CHAT_MESSAGES - 1):] + [messages[-1]]
            last_user_text = messages[-1]["content"]
            alarm_request = explicit_alarm_request(last_user_text)
            calendar_request = explicit_calendar_request(last_user_text) if alarm_request is None else None
            direct_action = explicit_open_action(last_user_text) if alarm_request is None and calendar_request is None else None
            result = alarm_request or calendar_request or (
                {"reply": "", "action": direct_action}
                if direct_action
                else generate_gemini_reply(model_messages, attachment, response_language)
            )
        except RuntimeError as error:
            self._send_json(503, {"error": str(error)})
            return
        action = result.get("action")
        if action:
            if action["type"] in ("calendar-event", "alarm"):
                pass
            elif SUPABASE_ENABLED:
                result["reply"] = "Website and desktop app actions are available only when Aura runs locally."
                result["action"] = None
            elif action["type"] == "open-url":
                if webbrowser.open(action["url"], new=2):
                    result["reply"] = f"Opened {action['url']}"
                else:
                    result["reply"] = "I couldn't open that website in your browser."
            elif action["type"] == "launch-app":
                try:
                    result["reply"] = launch_allowed_app(action["app"])
                except OSError:
                    result["reply"] = f"I couldn't open {action['appName']}."
            if action["type"] not in ("calendar-event", "alarm"):
                result["action"] = None

        user_text = messages[-1]["content"].strip()
        now = datetime.now().astimezone().isoformat()
        if not chat["messages"]:
            chat["title"] = user_text[:48]
        user_message = {"role": "user", "content": user_text}
        if attachment:
            user_message["attachmentName"] = attachment["name"]
        chat["messages"].extend(
            [user_message, {"role": "assistant", "content": result["reply"]}]
        )
        chat["updatedAt"] = now
        if SUPABASE_ENABLED:
            try:
                chat = cloud_save_chat(access_token, user["id"], chat)
            except SupabaseRequestError as error:
                self._send_supabase_error(error, "save your chat")
                return
        else:
            try:
                with CHATS_LOCK:
                    chats = read_chats()
                    saved_chat = next(
                        (entry for entry in chats if entry.get("id") == chat_id),
                        None,
                    )
                    if saved_chat is None:
                        self._send_json(404, {"error": "This chat no longer exists. Start a new chat and try again."})
                        return
                    saved_chat.update(chat)
                    write_chats(chats)
                chat = saved_chat
            except (OSError, ValueError, json.JSONDecodeError):
                self.log_error("Could not save local chat.")
                self._send_json(500, {"error": "Could not save chat."})
                return

        result["chatId"] = chat_id
        result["chatTitle"] = chat["title"]

        self._send_json(200, result)

    def _handle_action(self):
        if SUPABASE_ENABLED:
            self._send_json(403, {"error": "Website and desktop app actions are available only when Aura runs locally."})
            return
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
        if not self._request_is_allowed():
            return
        route = urlparse(self.path).path
        if route.startswith("/api/chats/"):
            user = self._require_user()
            if user is None:
                return
            chat_id = route.removeprefix("/api/chats/")
            if not chat_id or "/" in chat_id:
                self._send_json(404, {"error": "Chat not found."})
                return
            if SUPABASE_ENABLED:
                access_token = self.headers.get("Authorization", "").partition(" ")[2].strip()
                try:
                    deleted = cloud_delete_chat(access_token, chat_id)
                    if not isinstance(deleted, list) or not deleted:
                        self._send_json(404, {"error": "Chat not found."})
                        return
                    chats = cloud_list_chats(access_token)
                    self._send_json(200, {"chats": chat_summaries(chats)})
                except SupabaseRequestError as error:
                    self._send_supabase_error(error, "delete your chat")
                return
            try:
                with CHATS_LOCK:
                    chats = read_chats()
                    chat_index = next(
                        (
                            index
                            for index, chat in enumerate(chats)
                            if isinstance(chat, dict) and chat.get("id") == chat_id
                        ),
                        None,
                    )
                    if chat_index is None:
                        self._send_json(404, {"error": "Chat not found."})
                        return
                    del chats[chat_index]
                    write_chats(chats)
                self._send_json(200, {"chats": chat_summaries(chats)})
            except (OSError, ValueError, json.JSONDecodeError):
                self.log_error("Could not delete local chat.")
                self._send_json(500, {"error": "Could not delete saved chat."})
            return

        self._send_json(404, {"error": "Not found."})


class LocalHTTPServer(ThreadingHTTPServer):
    allow_reuse_address = True
    daemon_threads = True


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO, format="%(message)s")
    if not 1 <= PORT <= 65535:
        raise ValueError("PORT must be a valid TCP port number.")
    if HOST not in LOCAL_HOSTS and (
        not SUPABASE_ENABLED or not PUBLIC_ORIGIN or SUPABASE_MISCONFIGURED
    ):
        raise ValueError(
            "Binding to a public interface requires valid Supabase settings and PUBLIC_ORIGIN."
        )

    server = LocalHTTPServer((HOST, PORT), AuraRequestHandler)
    print(f"Aura is running at http://{HOST}:{PORT}")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nStopping Aura.")
    finally:
        server.server_close()
