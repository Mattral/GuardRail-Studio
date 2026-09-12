"""All interaction with the REAL guardrail-rs Rust proxy (data plane).

This module never re-implements regex / PII / injection detection. It only:
  - checks proxy + mock-upstream health
  - forwards chat-completion requests to the proxy (the same way any OpenAI
    SDK client would) so the proxy's pipeline makes the allow/redact/block
    decision
  - fetches the raw Prometheus /metrics text for parsing elsewhere
"""
import time
import httpx
import config


async def get_proxy_health():
    start = time.perf_counter()
    try:
        async with httpx.AsyncClient(timeout=5) as client:
            resp = await client.get(f"{config.GUARDRAIL_PROXY_URL}/healthz")
        latency_ms = round((time.perf_counter() - start) * 1000, 2)
        return {"status": "up" if resp.status_code == 200 else "degraded", "latency_ms": latency_ms}
    except Exception:
        return {"status": "down", "latency_ms": None}


async def get_mock_upstream_health():
    try:
        async with httpx.AsyncClient(timeout=5) as client:
            resp = await client.get(f"{config.MOCK_UPSTREAM_URL}/healthz")
        return {"status": "up" if resp.status_code == 200 else "degraded"}
    except Exception:
        return {"status": "down"}


def get_current_upstream_mode():
    """Inspect guardrail.toml to see which upstream is currently configured."""
    try:
        with open(config.GUARDRAIL_CONFIG) as f:
            content = f.read()
        if "generativelanguage.googleapis.com" in content:
            return "gemini"
        return "mock"
    except FileNotFoundError:
        return "unknown"


async def send_chat_completion(content: str, role: str = "user", upstream: str = "mock", model: str = None):
    """Send a single-message chat completion THROUGH the guardrail-rs proxy.

    The proxy decides allow / redact / block. We just relay the HTTP call and
    return the raw response + status code; decision correlation with the
    audit log happens in audit_service.
    """
    headers = {"Content-Type": "application/json"}
    if upstream == "gemini":
        headers["Authorization"] = f"Bearer {config.GEMINI_API_KEY}"
        model = model or config.GEMINI_MODEL
    else:
        model = model or "gpt-4o"

    payload = {"model": model, "messages": [{"role": role, "content": content}]}
    start = time.perf_counter()
    async with httpx.AsyncClient(timeout=60) as client:
        resp = await client.post(
            f"{config.GUARDRAIL_PROXY_URL}/v1/chat/completions",
            headers=headers,
            json=payload,
        )
    latency_ms = round((time.perf_counter() - start) * 1000, 2)
    try:
        body = resp.json()
    except Exception:
        body = {"raw_text": resp.text}
    return {"status_code": resp.status_code, "body": body, "client_latency_ms": latency_ms}


async def fetch_metrics_text():
    async with httpx.AsyncClient(timeout=5) as client:
        resp = await client.get(config.GUARDRAIL_METRICS_URL)
    resp.raise_for_status()
    return resp.text
