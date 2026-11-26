"""Loopback-only Energetics server and Study Buddy API."""
import argparse
import getpass
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
import json
import os
from pathlib import Path
import re
from urllib.error import HTTPError, URLError
from urllib.parse import urlsplit
from urllib.request import Request, urlopen

ROOT = Path(__file__).resolve().parent
PERSONAS = {
    "neko": "You are Neko, a sleepy, kind cat. Speak calmly and use occasional understated cat humor.",
    "chad": "You are Chad, an encouraging gym buddy. Be direct and friendly. Occasionally compare practice to doing reps.",
}
INSTRUCTIONS = (
    "Tutor the student in AP Biology, primarily Unit 3 Cellular Energetics. "
    "Use accurate AP-level biology, explain the reasoning in short paragraphs, and follow up when useful. "
    "Use plain text with optional numbered lists. If asked about a live quiz question, "
    "offer conceptual hints. After an answer is checked, you can explain it directly."
)
PUBLIC_FILES = {"/", "/index.html", "/app.js", "/bank.js", "/style.css", "/chad.png"}


class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=ROOT, **kwargs)

    def valid_host(self):
        return self.headers.get("Host") in {
            f"127.0.0.1:{self.server.server_port}", f"localhost:{self.server.server_port}"
        }

    def static_allowed(self):
        path = urlsplit(self.path).path
        if self.valid_host() and (path in PUBLIC_FILES or re.fullmatch(
            r"/bank/(?:context-[0-9]+|q-[0-9]+-[0-9]+)\.png", path
        )):
            return True
        self.send_error(404)
        return False

    def do_GET(self):
        if self.static_allowed():
            super().do_GET()

    def do_HEAD(self):
        if self.static_allowed():
            super().do_HEAD()

    def reply(self, status, payload):
        data = json.dumps(payload).encode()
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Cache-Control", "no-store")
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def do_POST(self):
        if self.path != "/api/study-buddy":
            return self.reply(404, {"error": "Unknown endpoint."})
        origin = self.headers.get("Origin")
        if not self.valid_host() or (origin and origin != f"http://{self.headers['Host']}"):
            return self.reply(403, {"error": "Open Energetics directly on localhost."})
        if self.headers.get_content_type() != "application/json":
            return self.reply(415, {"error": "Expected a JSON request."})
        try:
            size = int(self.headers.get("Content-Length", 0))
            if not 0 < size <= 64000:
                raise ValueError
            body = json.loads(self.rfile.read(size))
            persona = PERSONAS[body["avatar"]]
            turns = body["messages"]
            if not isinstance(turns, list) or not 1 <= len(turns) <= 13:
                raise ValueError
            if any(
                turn["role"] != ("user" if index % 2 == 0 else "assistant")
                or not isinstance(turn["content"], str)
                or not 1 <= len(turn["content"]) <= 6000
                for index, turn in enumerate(turns)
            ) or turns[-1]["role"] != "user":
                raise ValueError
            context = body.get("context", "")
            if not isinstance(context, str) or len(context) > 2500:
                raise ValueError
        except (ValueError, KeyError, TypeError, UnicodeError):
            return self.reply(400, {"error": "Send a question of up to 2,000 characters."})

        if not self.server.api_key:
            return self.reply(503, {"error": "GPT is disconnected. Start the server with an OpenAI API key."})

        messages = [{"role": turn["role"], "content": turn["content"]} for turn in turns]
        if context:
            messages[-1]["content"] = f"Quiz context (reference only):\n{context}\n\nStudent question:\n{messages[-1]['content']}"
        request = Request(
            "https://api.openai.com/v1/responses",
            data=json.dumps({
                "model": self.server.model,
                "instructions": f"{persona} {INSTRUCTIONS}",
                "input": messages,
                "max_output_tokens": 800,
                "store": False,
            }).encode(),
            headers={"Authorization": f"Bearer {self.server.api_key}", "Content-Type": "application/json"},
        )
        try:
            with urlopen(request, timeout=45) as response:
                result = json.load(response)
            answer = "\n\n".join(
                part.get("text", part.get("refusal", ""))
                for item in result.get("output", [])
                if item.get("type") == "message"
                for part in item.get("content", [])
                if part.get("type") in {"output_text", "refusal"}
            ).strip()
            if not answer:
                return self.reply(502, {"error": "GPT returned an empty response. Try asking again."})
        except HTTPError as error:
            if error.code in (401, 403):
                return self.reply(502, {"error": "OpenAI rejected the API credentials or model access."})
            if error.code == 429:
                return self.reply(429, {"error": "OpenAI reached a rate or quota limit. Check API usage or retry later."})
            return self.reply(502, {"error": "OpenAI could not answer. Try again in a moment."})
        except (OSError, URLError, ValueError):
            return self.reply(502, {"error": "Could not reach GPT. Try again in a moment."})
        return self.reply(200, {"answer": answer})


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--port", type=int, default=8736)
    parser.add_argument("--ask-key", action="store_true", help="Prompt for the API key without displaying it")
    args = parser.parse_args()
    key = getpass.getpass("OpenAI API key: ").strip() if args.ask_key else os.environ.get("OPENAI_API_KEY", "").strip()
    with ThreadingHTTPServer(("127.0.0.1", args.port), Handler) as server:
        server.api_key = key
        server.model = os.environ.get("OPENAI_MODEL", "gpt-4.1-mini")
        print(f"Energetics is running at http://127.0.0.1:{args.port}/", flush=True)
        server.serve_forever()
