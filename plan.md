# GuardRail Studio — Development Plan (Updated)

## 1. Objectives

- ✅ **Phase 1 complete (data plane POC):** run the **real `guardrail-rs` data plane** (`guardrail-cli` reverse proxy) locally and prove:
  - **allow** clean prompts (`200`)
  - **block prompt injection** (`403`, `error.code = prompt_injection`)
  - **PII redaction before upstream** (verified via mock upstream `_debug_received_messages`)
  - **real upstream support** (Gemini via OpenAI-compatible endpoint)

- ✅ **Documentation integrity objective complete:** remove overselling / fictional infrastructure claims and make docs match the implemented system.
  - Root `README.md` rewritten to be factual and to embed real UI screenshots.
  - `docs/` rewritten/swept so only implemented components are described.

- ✅ **Phase 2 complete (MVP app):** build and validate **GuardRail Studio** (FastAPI control plane + React dashboard) that:
  - **never reimplements detection** in Python/JS
  - edits/validates/reloads `guardrail.toml` (SIGHUP hot reload)
  - drives “Test a Prompt” traffic through the **Rust proxy**
  - scrapes Prometheus metrics and tails the audit NDJSON for dashboards
  - supports upstream selection:
    - always-available **Mock upstream**
    - optional **Gemini** (OpenAI-compatible) using backend-stored `GEMINI_API_KEY`

- ✅ **Provenance clarification (verified):** this workspace is a clone of:
  - `https://github.com/DavidMacha/Ultra-Low-Latency-High-Throughput-LLM-Firewall-Observability-Platform`
  - confirmed via `git remote -v`

---

## 2. Implementation Steps

### Phase 1 — Core POC (must pass before app work) ✅ COMPLETE

**User stories**
1. ✅ Install `guardrail-cli` from crates.io and start the proxy with a minimal config.
2. ✅ Run a mock upstream and confirm the proxy forwards clean traffic.
3. ✅ Send a prompt injection attempt and see consistent **403** with `error.code=prompt_injection`.
4. ✅ Send PII and prove the upstream received **redacted** content via `_debug_received_messages`.
5. ✅ Switch upstream to Gemini and get a real completion through the proxy (while still enforcing blocks/redactions).

**What was implemented / verified**
- `guardrail-cli v0.1.1` installed via cargo.
  - binary: `/root/.cargo/bin/guardrail` (symlinked to `/usr/local/bin/guardrail`)
- Data plane processes are supervisor-managed:
  - `guardrail_proxy` and `guardrail_mock_upstream`
  - supervisor config: `/etc/supervisor/conf.d/guardrail.conf`
- Paths:
  - config: `/app/guardrail/guardrail.toml`
  - audit log: `/app/guardrail/guardrail-audit.ndjson`
  - mock upstream: `/app/guardrail/mock_upstream.py` (listens on `127.0.0.1:9000`)
  - POC test runner: `/app/guardrail/test_core.py` (re-runnable anytime)
- Metrics behavior correction (empirically validated):
  - metrics are served on the **same port** as the proxy: `http://127.0.0.1:8080/metrics`
  - `observability.metrics_port` is **reserved for a future release** and does not expose `:9090/metrics` today
- Audit NDJSON record shape observed:
  - top-level keys: `timestamp`, `level`, `fields`
  - `fields` contains: `request_id`, `decision` (allow|redact|block), `reason`, `code`, `pii_entities_found`, latency fields, etc.
- Request correlation reality:
  - `403` responses include `error.guardrail_request_id`
  - `200` responses do **not** include a request-id header/body field
  - Studio correlates `200` test requests by reading the **tail of the audit log** right after sending the request.
- Reload semantics verified:
  - `SIGHUP` to the `guardrail run` PID hot-reloads `guardrail.toml` (used for policy edits)
  - upstream changes use `supervisorctl restart guardrail_proxy` (safe re-init)
- Gemini upstream verified:
  - upstream URL: `https://generativelanguage.googleapis.com/v1beta/openai`
  - auth: `Authorization: Bearer <GEMINI_API_KEY>`
  - working model name: `gemini-flash-latest` (note: `gemini-2.0-flash` is retired)

**Exit criteria (hard gate)**
- ✅ All POC assertions pass locally and are repeatable (18/18 passing).

---

### Phase 2 — V1 App Development (FastAPI + React, no auth) ✅ COMPLETE

**User stories**
1. ✅ Proxy and upstream health visible at a glance. (Overview)
2. ✅ Send test prompts and see ALLOWED/BLOCKED/REDACTED with latency and request IDs (when available). (Test a Prompt)
3. ✅ Redaction proof visible using mock upstream `_debug_received_messages`. (Test a Prompt)
4. ✅ Edit policy/stage settings with validation errors shown and invalid edits not applied. (Policy Editor)
5. ✅ Browse/search/filter audit log events. (Audit Log)
6. ✅ Switch upstream mock↔gemini without exposing Gemini API key to the browser. (Settings)

**Backend (FastAPI :8001, /api)**
- Configuration/env (backend-only):
  - `GEMINI_API_KEY` (server-side only)
  - `GUARDRAIL_CONFIG=/app/guardrail/guardrail.toml`
  - `GUARDRAIL_PROXY_URL=http://127.0.0.1:8080`
  - `GUARDRAIL_METRICS_URL=http://127.0.0.1:8080/metrics`
  - `AUDIT_NDJSON_PATH=/app/guardrail/guardrail-audit.ndjson`
  - `MOCK_UPSTREAM_URL=http://127.0.0.1:9000`
- Process supervision assumptions:
  - proxy and mock upstream are managed by supervisor
  - policy changes use **SIGHUP hot reload**
  - upstream swaps use **supervisorctl restart**
- MongoDB collections:
  - `audit_logs` (ingested from NDJSON tail)
  - `metrics_snapshots` (periodic scrape snapshots)
  - `policy_history` (store applied configs and validation results)
- APIs (MVP scope):
  - `GET /api/health`
  - `POST /api/test-prompt`
  - `GET /api/metrics`
  - `GET /api/policy` + `PUT /api/policy`
  - `GET /api/audit-log`
  - `GET /api/upstream` + `PUT /api/upstream`
- Background tasks:
  - tail `guardrail-audit.ndjson` and ingest into Mongo (`audit_logs`)
  - periodic scrape of `/metrics` into Mongo (`metrics_snapshots`)

**Frontend (React)**
- Design: security/ops dashboard aesthetic, minimal, “non-AI-slop”.
- Pages implemented:
  - Overview
  - Test a Prompt
  - Policy Editor
  - Audit Log
  - Settings

**Phase 2 validation (now complete)**
- ✅ Ran comprehensive end-to-end validation with `testing_agent_v3` across:
  - Overview: health strip, KPIs, trend chart, recent audit feed
  - Test a Prompt: allow/block/redact flows, presets, tabs, redaction proof (mock)
  - Policy Editor: validation failure path, successful save/apply, raw TOML preview
  - Audit Log: table rendering, filters, detail drawer, pagination
  - Settings: upstream switch mock↔gemini, toast notifications, active-state indicators, proxy connection info
  - Navigation: all sidebar links and active state
- ✅ Results:
  - backend: **50/50 passing**
  - frontend: **100% UI flows passing**
  - **zero bugs found**, no code changes required
- ✅ Gemini upstream switching verified working (a key was already configured in this environment).

---

### Phase 2.5 — Documentation overhaul ✅ COMPLETE

This phase was added after user request to remove overselling/factual errors and to include real screenshots.

**Completed work**
- ✅ Verified repo provenance via git remotes.
- ✅ Fact-checked and retained the rewritten docs as accurate and non-overselling:
  - `docs/SYSTEM_DESIGN.md`
  - `docs/SETUP_AND_OPERATIONS.md`
  - `docs/SECURITY.md`
  - `docs/CONTRIBUTING.md`
  - `docs/PHILOSOPHY.md`
- ✅ Rewrote `README.md` to match the actual system:
  - removed fictional infra/benchmarks/badges
  - embedded real screenshots
  - stated tested evidence (18/18 POC, 50/50 backend tests)
  - added “Honest status” section and explicit limitations
- ✅ Fixed screenshot filename/content mismatch; screenshots live at `docs/screenshots/*` and are correctly referenced.
- ✅ Rewrote `frontend/README.md` to reflect actual yarn workflow and real pages.
- ✅ Rewrote `docs/USER_GUIDE_AND_UI.md` to document the real 5-page UI.
- ✅ Repo-wide sweep confirms no remaining fictional infra claims in README/docs except explicit negations (“there is no …”).

---

### Phase 3 — Hardening + UX upgrades (optional; post-MVP) ⏳

Phase 3 is intentionally optional. It is not required for MVP completeness.

**User stories**
1. As a user, I can see time-range charts (15m/1h/24h) for allow/block/redact rates.
2. As a user, I can export filtered audit logs to NDJSON/CSV.
3. As a user, I can version policy changes and roll back to a previous config.
4. As a user, I can see detailed stage-level block reasons and rule names in the UI.
5. As a user, I can safely restart/reload the proxy from the UI and see status/progress.

**Steps**
- Improve Prometheus parsing + charting (histograms, derived rates; use stored `metrics_snapshots`).
- Policy history UI + rollback endpoint (use `policy_history`).
- Better redaction UX: side-by-side diff (original vs redacted), when mock is used.
- Add safe “Reload proxy” action (SIGHUP) and “Restart proxy” action (supervisorctl) with status feedback.
- Run another end-to-end testing pass with `testing_agent_v3` after changes.

---

## 3. Next Actions

1. ✅ Phase 1 complete; keep `/app/guardrail/test_core.py` as the isolated data-plane regression tool.
2. ✅ Phase 2 complete; keep `/app/backend_test.py` as the backend API regression tool.
3. ✅ Docs are aligned with implementation and include real screenshots.
4. (Optional) If continuing development, start Phase 3 hardening tasks.

---

## 4. Success Criteria

- ✅ POC: clean=200, injection=403 with `prompt_injection`, PII redaction proven via mock `_debug_received_messages`; Gemini upstream works using `gemini-flash-latest`.
- ✅ Docs/README: no overselling; no fictional infra; screenshots reflect the real UI; limitations clearly stated.
- ✅ Studio V1 (MVP): verified end-to-end via `testing_agent_v3` across all 5 pages with zero defects.
- ✅ No Python reimplementation of regex/PII/injection checks; all decisions come from `guardrail-rs` proxy + audit log + metrics.
