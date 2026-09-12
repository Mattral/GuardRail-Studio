"""Central configuration for GuardRail Studio backend (control plane).

All values are read from environment variables (backend/.env). Nothing here
reimplements firewall logic - these are just connection details to the real
guardrail-rs data-plane proxy, Mongo, and the optional Gemini upstream.
"""
import os
from pathlib import Path
from dotenv import load_dotenv

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

MONGO_URL = os.environ["MONGO_URL"]
DB_NAME = os.environ.get("DB_NAME", "guardrail_studio")

GUARDRAIL_CONFIG = os.environ.get("GUARDRAIL_CONFIG", "/app/guardrail/guardrail.toml")
GUARDRAIL_PROXY_URL = os.environ.get("GUARDRAIL_PROXY_URL", "http://127.0.0.1:8080")
GUARDRAIL_METRICS_URL = os.environ.get("GUARDRAIL_METRICS_URL", "http://127.0.0.1:8080/metrics")
AUDIT_NDJSON_PATH = os.environ.get("AUDIT_NDJSON_PATH", "/app/guardrail/guardrail-audit.ndjson")
MOCK_UPSTREAM_URL = os.environ.get("MOCK_UPSTREAM_URL", "http://127.0.0.1:9000")

GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "")
GEMINI_OPENAI_BASE_URL = os.environ.get("GEMINI_OPENAI_BASE_URL", "https://generativelanguage.googleapis.com/v1beta/openai")
GEMINI_MODEL = os.environ.get("GEMINI_MODEL", "gemini-flash-latest")

CORS_ORIGINS = os.environ.get("CORS_ORIGINS", "*")
