# GuardRail Studio — System Design

This document describes the architecture of the system as it actually exists in
this repository. It intentionally avoids describing infrastructure that is not
present (there is no Kubernetes, Triton, Terraform, or message queue here).

**Companion docs:** [Setup & Operations](./SETUP_AND_OPERATIONS.md) ·
[User Guide](./USER_GUIDE_AND_UI.md) · [Security](./SECURITY.md) ·
[Philosophy](./PHILOSOPHY.md)

---

## 1. What this is

GuardRail Studio is a two-part system:

1. **Data plane — `guardrail-rs`.** A real, third-party Rust binary
   (`guardrail-cli`, published on [crates.io](https://crates.io/crates/guardrail-cli),
   source at [github.com/Mattral/guardrail-rs](https://github.com/Mattral/guardrail-rs)).
   It runs as a reverse proxy that sits between a caller and an upstream LLM API.
   It inspects every `POST /v1/chat/completions` request and decides **allow**,
   **redact**, or **block** *before* anything reaches the upstream model. This
   is the component that actually does prompt-injection detection, PII redaction,
   and policy enforcement. It is not written or maintained by this project.

2. **Control plane — GuardRail Studio.** A FastAPI backend and React frontend
   built in this repository. It does not detect or redact anything itself. Its
   job is to drive traffic through the proxy, read its audit log and metrics,
   and edit its configuration file — the same things you could do by hand with
   `curl` and a text editor, wrapped in a dashboard.

This separation is deliberate: the control plane never re-implements the
detection logic that the Rust proxy already provides correctly and quickly.

---

## 2. Runtime topology (as deployed in this environment)

```
                    ┌────────────────────────────┐
                    │   Browser (React SPA)      │
                    │   :3000 (dev server)       │
                    └──────────────┬─────────────┘
                                   │ HTTPS, /api/*
                                   ▼
                    ┌────────────────────────────┐
                    │   FastAPI backend  :8001    │
                    │   (control plane, this repo)│
                    │   - test-prompt relay       │
                    │   - policy read/write/SIGHUP│
                    │   - audit log tailer        │
                    │   - metrics scraper         │
                    └──────┬───────────────┬──────┘
                           │               │
              guardrail.toml         GET :8080/metrics
              read/write/SIGHUP      GET :8080/healthz
                           │         POST :8080/v1/chat/completions
                           ▼               │
                    ┌────────────────────────────┐
                    │  guardrail-rs proxy  :8080  │
                    │  (third-party Rust binary,  │
                    │   data plane, does the real │
                    │   detection/redaction work)  │
                    └──────────────┬─────────────┘
                                   │ forwards allowed/redacted requests only
                     ┌─────────────┴─────────────┐
                     ▼                           ▼
          ┌────────────────────┐      ┌───────────────────────────┐
          │ Mock upstream :9000 │      │ Gemini (OpenAI-compatible) │
          │ (python stdlib http, │      │ generativelanguage.        │
          │  this repo, for demo) │      │ googleapis.com/v1beta/openai│
          └────────────────────┘      └───────────────────────────┘

                    ┌────────────────────────────┐
                    │   MongoDB (local)          │
                    │   audit_logs               │
                    │   metrics_snapshots        │
                    │   policy_history           │
                    └────────────────────────────┘
```

All five processes (`backend`, `frontend`, `mongodb`, `guardrail_proxy`,
`guardrail_mock_upstream`) run under `supervisord` in this container. There is
no separate deployment target, no cloud infrastructure, and no orchestration
layer — this is a single-host system.

---

## 3. Request flow — "Test a Prompt"

```
Browser              FastAPI backend           guardrail-rs proxy        Upstream
  │                        │                          │                     │
  │─ POST /api/test-prompt→│                          │                     │
  │                        │── POST /v1/chat/completions ─→│                 │
  │                        │   (Authorization header set    │                │
  │                        │    only when upstream=gemini)  │                │
  │                        │                          │─ pipeline: regex ──▶│ (only if allowed)
  │                        │                          │  injection → PII    │
  │                        │                          │  redactor → policy  │
  │                        │                          │                     │
  │                        │◀── 200 OK  or  403 Blocked ────│                │
  │                        │                          │                     │
  │                        │  if 200: poll audit_logs (Mongo) for the       │
  │                        │  record the tailer just ingested, to learn    │
  │                        │  whether it was "allow" or "redact"            │
  │◀── decision + reason + latency + raw response ─────│                     │
```

### 3.1 A real limitation worth stating plainly

The proxy's HTTP response does **not** include a request ID or decision label
on a `200 OK` (only `403 Blocked` responses carry `error.guardrail_request_id`
and `error.code`). To tell "allowed unchanged" apart from "allowed after PII
redaction" for a `200` response, the backend polls its own MongoDB copy of the
audit log (ingested by a 1.5-second tailer loop) for up to 3 seconds after
sending the request, and reads the `decision` field guardrail-rs wrote there.

This works correctly for the interactive "Test a Prompt" console (one request
at a time), but it is a **correlation-by-timing** heuristic, not a
guaranteed-atomic mapping. Under concurrent traffic from multiple callers, two
requests landing inside the same ~200ms poll window could theoretically be
misattributed. This is acceptable for a single-operator test console; it would
need a real request-ID header from the proxy (not currently emitted for `200`
responses) to be safe for concurrent production traffic.

---

## 4. What the Rust proxy actually enforces

This is configured in `/app/guardrail/guardrail.toml` and is entirely owned by
`guardrail-rs`, not by this repository's Python code:

| Stage | Enabled by default | What it does |
|---|---|---|
| `regex_injection` | yes | Blocks requests matching a bundled set of prompt-injection regex signatures (e.g. "ignore previous instructions"). |
| `pii_redactor` | yes | Detects and replaces email, phone, credit card (Luhn-validated), SSN, IP address, API key, and AWS key patterns with configurable tokens (e.g. `[EMAIL]`), then forwards the redacted text. |
| `policy` | yes (rules list starts empty) | User-defined keyword-match rules (`content_contains` → `block`), editable from the Policy Editor. |
| `onnx_injection` | no | Semantic (ML) injection classifier. Requires a locally-built ONNX model file. **Not shipped in this repo** — left disabled. |
| `toxicity` | no | ONNX toxicity classifier. Same limitation — **not enabled**, because no model file is provided. |

The proxy's default `on_error` policy is `allow` (fail-open): if a pipeline
stage errors unexpectedly, the request is forwarded rather than blocked. This
is a `guardrail-rs` default, not something this project changed.

---

## 5. Metrics — one correction worth documenting

The upstream project's example config comments say metrics are "reserved for a
future release" to be served on a separate `metrics_port` (9090). In the
version actually installed here (`guardrail-cli` v0.1.1), Prometheus metrics
are served on the **same port as the proxy itself** — `GET :8080/metrics` —
regardless of the `metrics_port` value in the config. The backend scrapes that
URL, not a separate port. This was confirmed empirically before wiring the
backend; see `docs/SETUP_AND_OPERATIONS.md`.

Counters (`guardrail_requests_total{decision=...}`) are **in-process and
reset to zero whenever the proxy process restarts** (e.g. when switching
upstream, which requires a restart). The `metrics_snapshots` Mongo collection
only has data from the point a scrape loop started after the most recent
proxy restart — it is not a durable, restart-safe counter.

---

## 6. Backend components (this repo)

| File | Responsibility |
|---|---|
| `backend/guardrail_bridge.py` | HTTP client to the proxy: health checks, chat-completion relay, raw metrics fetch. No detection logic. |
| `backend/policy_manager.py` | Reads/writes `guardrail.toml` with `tomlkit` (preserves formatting), calls `guardrail validate`, and sends `SIGHUP` to hot-reload or restarts the supervised process for upstream switches. |
| `backend/audit_service.py` | Tails the NDJSON audit log file by byte offset, parses each line, and upserts into MongoDB by `request_id`. Also serves the query/filter API used by the Audit Log page. |
| `backend/metrics_service.py` | Parses the Prometheus text format (`prometheus_client.parser`) into a JSON summary and periodically snapshots it into MongoDB. |
| `backend/routes_*.py` | Thin FastAPI route modules, one per resource (health, test-prompt, policy, audit, metrics, upstream). |

---

## 7. Known limitations (stated for honesty, not as a roadmap promise)

- **Single proxy instance, no HA.** If `guardrail_proxy` is down, all firewall
  traffic fails; there is no load balancing or failover.
- **No authentication anywhere.** Per the current requirements this is a
  single-operator internal tool. See [`SECURITY.md`](./SECURITY.md).
- **Toxicity detection is present in the config schema but not active** —
  it requires an ONNX model that is not part of this repository.
- **Metrics are volatile** across proxy restarts (see §5).
- **Decision correlation for `200` responses is timing-based**, not
  guaranteed-atomic under concurrent load (see §3.1).
