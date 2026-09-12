"""
Mock upstream LLM server for guardrail-rs POC / Studio testing.

Binds to 127.0.0.1:9000 and echoes back whatever `messages` it received in
the `_debug_received_messages` field of an OpenAI-compatible chat completion
response. This is how we prove PII was redacted/injection was blocked
*before* the "LLM" ever saw the raw text.
"""
import json
import sys
import threading
import time
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer


class MockUpstreamHandler(BaseHTTPRequestHandler):
    def _reply(self, received_messages, model="gpt-4o"):
        body = json.dumps({
            "id": f"mock-chatcmpl-{int(time.time() * 1000)}",
            "object": "chat.completion",
            "model": model,
            "choices": [{
                "index": 0,
                "message": {
                    "role": "assistant",
                    "content": "Mock upstream received your request.",
                },
                "finish_reason": "stop",
            }],
            "_debug_received_messages": received_messages,
        }).encode()
        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_POST(self):
        length = int(self.headers.get("Content-Length", 0))
        raw = self.rfile.read(length) if length else b"{}"
        try:
            payload = json.loads(raw or b"{}")
        except json.JSONDecodeError:
            payload = {}
        model = payload.get("model", "gpt-4o")
        self._reply(payload.get("messages", []), model=model)

    def do_GET(self):
        if self.path in ("/healthz", "/health"):
            body = b'{"status":"ok","service":"mock-upstream"}'
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)
        else:
            self.send_response(404)
            self.end_headers()

    def log_message(self, format, *args):  # noqa: A002
        pass


def main():
    host = "127.0.0.1"
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 9000
    server = ThreadingHTTPServer((host, port), MockUpstreamHandler)
    print(f"Mock upstream listening on http://{host}:{port}", flush=True)
    server.serve_forever()


if __name__ == "__main__":
    main()
