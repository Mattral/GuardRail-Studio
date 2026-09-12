# GuardRail Studio — Setup & Operations

This is the actual, verified procedure used to bring this system up in this
environment. Every command here has been run and its real output is shown
where it adds value.

**Companion docs:** [System Design](./SYSTEM_DESIGN.md) ·
[User Guide](./USER_GUIDE_AND_UI.md) · [Security](./SECURITY.md)

---

## 1. Prerequisites

| Tool | Used here | Why |
|---|---|---|
| Rust toolchain (rustup, ≥1.75) | 1.98.1 | to build/install `guardrail-cli` |
| Python | 3.11 | FastAPI backend |
| Node.js / Yarn | current LTS | React frontend |
| MongoDB | local `mongod` | audit log + metrics persistence |
| `supervisord` | pre-installed in this container | process management |

---

## 2. Installing the data plane (`guardrail-rs`)

```bash
# 1. Install Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y --default-toolchain stable --profile minimal
source "$HOME/.cargo/env"

# 2. Install the published crate (compiles from source, ~4 minutes)
cargo install guardrail-cli --locked

# 3. Make it available on PATH for supervisor/subprocess calls
ln -sf /root/.cargo/bin/guardrail /usr/local/bin/guardrail
guardrail --version   # guardrail 0.1.1
```

---

## 3. Configuration and mock upstream

The live config is at `/app/guardrail/guardrail.toml`. A minimal mock upstream
(`/app/guardrail/mock_upstream.py`) is a stdlib `http.server` that echoes back
whatever `messages` array it received under a `_debug_received_messages` key —
this is how the UI proves PII was stripped *before* an "LLM" ever saw it.

Validate before starting:

```bash
guardrail validate --config /app/guardrail/guardrail.toml
# ✓ configuration is valid
#   server:               127.0.0.1:8080
#   upstream.url:         http://127.0.0.1:9000
#   regex_injection:      enabled
#   pii_redactor:         enabled
#   policy rules:         0
#   audit_log:            enabled → /app/guardrail/guardrail-audit.ndjson/100
```

---

## 4. Process supervision

Both the proxy and the mock upstream are supervised alongside the existing
`backend` / `frontend` / `mongodb` programs, defined in
`/etc/supervisor/conf.d/guardrail.conf`:

```ini
[program:guardrail_mock_upstream]
command=/usr/bin/python3 /app/guardrail/mock_upstream.py 9000
autostart=true
autorestart=true

[program:guardrail_proxy]
command=/root/.cargo/bin/guardrail run --config /app/guardrail/guardrail.toml
autostart=true
autorestart=true
```

```bash
supervisorctl status
# backend                          RUNNING
# frontend                         RUNNING
# guardrail_mock_upstream          RUNNING
# guardrail_proxy                  RUNNING
# mongodb                          RUNNING
```

---

## 5. Environment variables

**`backend/.env`** (never committed with real secrets in a public repo — the
key below is illustrative of the variable name, not a live credential):

```env
MONGO_URL=mongodb://localhost:27017
DB_NAME=guardrail_studio

GUARDRAIL_CONFIG=/app/guardrail/guardrail.toml
GUARDRAIL_PROXY_URL=http://127.0.0.1:8080
GUARDRAIL_METRICS_URL=http://127.0.0.1:8080/metrics
AUDIT_NDJSON_PATH=/app/guardrail/guardrail-audit.ndjson
MOCK_UPSTREAM_URL=http://127.0.0.1:9000

GEMINI_API_KEY=<your key, server-side only>
GEMINI_OPENAI_BASE_URL=https://generativelanguage.googleapis.com/v1beta/openai
GEMINI_MODEL=gemini-flash-latest
```

**`frontend/.env`**:

```env
REACT_APP_BACKEND_URL=<the public URL this app is served from>
```

---

## 6. Verifying the data plane in isolation

Before any control-plane code was written, the proxy was verified standalone
with `/app/guardrail/test_core.py`. It is safe to re-run at any time:

```bash
GEMINI_API_KEY=<your key> python3 /app/guardrail/test_core.py
```

It asserts, against the **real** running proxy (no mocking):

- `GET /healthz` → `200`
- A clean prompt is forwarded (`200`)
- A prompt-injection payload is blocked (`403`, `error.code == "prompt_injection"`)
- An email is redacted to `[EMAIL]` before the mock upstream sees it
- A Luhn-valid card number is redacted to `[CARD]`
- `/metrics` exposes Prometheus counters
- The audit NDJSON file receives structured decision records
- Swapping `[upstream].url` to Gemini's OpenAI-compatible endpoint, validating,
  restarting the proxy, and sending a real prompt through it works end-to-end
- Prompt injection is **still blocked** even when the real Gemini upstream is
  configured

Last verified run: **18/18 checks passed.**

---

## 7. Verifying the control plane (backend API)

`/app/backend_test.py` exercises the FastAPI backend's public HTTP API
(health, test-prompt for allow/block/redact, audit log) against the deployed
preview URL:

```bash
python3 /app/backend_test.py
# RESULTS: 50/50 tests passed
```

---

## 8. Common operational tasks

### Switch the active upstream (Mock ↔ Gemini)

Done from the **Settings** page, or directly:

```bash
curl -X PUT http://localhost:8001/api/upstream -H 'Content-Type: application/json' -d '{"mode":"gemini"}'
```

This rewrites `[upstream].url` in `guardrail.toml`, runs `guardrail validate`,
and — only if valid — runs `supervisorctl restart guardrail_proxy`. A restart
(not a `SIGHUP`) is used here because changing the upstream target also means
re-establishing the proxy's outbound connection pool.

### Edit policy (injection/PII/custom rules) and hot-reload

Done from the **Policy Editor** page, or directly:

```bash
curl -X PUT http://localhost:8001/api/policy -H 'Content-Type: application/json' -d '{ ... }'
```

The backend writes to a temp file, runs `guardrail validate` against it, and
only on success replaces the real config and sends `SIGHUP` to the running
`guardrail run` process — verified to hot-reload without dropping the
listening socket. If validation fails, the real config file is left untouched
and the validator's error text is returned to the caller.

### Inspect the raw audit log

```bash
tail -f /app/guardrail/guardrail-audit.ndjson
```

Each line is one JSON decision record with `request_id`, `decision`
(`allow`/`redact`/`block`), `reason`, `pii_entities_found`, and latency
fields — written by `guardrail-rs` itself.

---

## 9. Logs

```bash
tail -n 50 /var/log/supervisor/guardrail_proxy.*.log
tail -n 50 /var/log/supervisor/guardrail_mock_upstream.*.log
tail -n 50 /var/log/supervisor/backend.*.log
tail -n 50 /var/log/supervisor/frontend.*.log
```
