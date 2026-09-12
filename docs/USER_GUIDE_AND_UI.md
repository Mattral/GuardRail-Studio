# GuardRail Studio — User Guide

A walkthrough of the five pages in the React dashboard, written against the
actual components in `frontend/src/pages/`. There is no Grafana, Airflow, or
Weights & Biases in this project — everything described below is either
rendered directly by this app or comes straight from the `guardrail-rs`
proxy's own metrics/audit log.

**Companion docs:** [System Design](./SYSTEM_DESIGN.md) ·
[Setup & Operations](./SETUP_AND_OPERATIONS.md) · [Security](./SECURITY.md)

---

## Navigation

The sidebar (`frontend/src/components/Layout.jsx`) has five links, matching
the five routes in `App.js`:

| Route | Page | File |
|---|---|---|
| `/` | Overview | `pages/Overview.jsx` |
| `/test` | Test a Prompt | `pages/TestConsole.jsx` |
| `/policy` | Policy Editor | `pages/PolicyEditor.jsx` |
| `/audit` | Audit Log | `pages/AuditLog.jsx` |
| `/settings` | Settings | `pages/Settings.jsx` |

---

## 1. Overview

![Overview dashboard](./screenshots/overview-dashboard.png)

Polls `GET /api/health`, `GET /api/metrics`, and `GET /api/audit-log` every 5
seconds (`react-query`, `refetchInterval: 5000`).

- **Status strip** — proxy health, which upstream is active (`mock` or
  `gemini`), and whether a Gemini API key is configured server-side.
- **Four KPI cards** — cumulative `allow` / `redact` / `block` counters and
  p95 pipeline latency, all parsed from the proxy's own Prometheus
  `/metrics` endpoint (see [`docs/SYSTEM_DESIGN.md` §5](./SYSTEM_DESIGN.md)
  for why these counters reset on proxy restart).
- **Decision trends chart** — a `recharts` line chart built from
  `metrics_snapshots` documents the backend has periodically written to
  MongoDB. If the proxy has just started, this is empty until a few test
  prompts have been sent — there is no historical backfill.
- **Recent activity** — the last 15 audit records, linking to the full
  Audit Log page.

---

## 2. Test a Prompt

![Test console: blocked request](./screenshots/test-console-blocked.png)
![Test console: redacted request](./screenshots/test-console-redacted.png)

This is the only page that sends live traffic. It calls
`POST /api/test-prompt`, which the backend relays to the proxy's
`POST /v1/chat/completions`.

- **Upstream selector** — `mock` or `gemini`. Choosing `gemini` when no key
  is configured returns an error toast; it does not silently fall back.
- **Role selector** and **message content** textarea, plus five one-click
  presets (clean prompt, prompt injection, email/credit-card/SSN PII) that
  fill the textarea with known test strings — the same strings used in
  `guardrail/test_core.py`.
- **Result panel**, once a request completes:
  - A decision badge (`allow` / `redact` / `block`), HTTP status, client-side
    latency, and — when available — the proxy's own reported pipeline
    latency and `request_id`.
  - **Summary tab** — a one-line, decision-specific explanation.
  - **Raw JSON tab** — the exact response body the backend returned.
  - **Redaction proof tab** — only shown when the mock upstream was used and
    PII was redacted. Shows the original text you sent side-by-side with
    `_debug_received_messages`, i.e. what the mock upstream actually saw
    after the proxy redacted it. This is the mechanism the screenshot above
    demonstrates; it only works against the mock upstream, since a real LLM
    provider has no such debug echo.

See [`docs/SYSTEM_DESIGN.md` §3.1](./SYSTEM_DESIGN.md) for the caveat on how
`allow` vs. `redact` is determined for `200` responses (audit-log
correlation by timing, not a header on the response itself).

---

## 3. Policy Editor

Reads `GET /api/policy`, writes via `PUT /api/policy`.

- **Prompt injection detection** — enable/disable switch, and an action
  selector (`block` or `log_only`).
- **PII detection & redaction** — per-entity checkboxes (email, phone,
  credit card, SSN, IP address, API key, AWS key) with an editable
  replacement token for each (e.g. `[EMAIL]`).
- **Toxicity classifier** — a switch and threshold slider are present in the
  UI because they exist in the `guardrail.toml` schema, but the UI itself
  states plainly that this requires an ONNX model not shipped in this repo,
  and it has no effect while disabled.
- **Custom keyword rules** — add/remove rules with a name, keyword list,
  and block message. This is the one part of the policy that is genuinely
  deployment-specific and empty by default.
- **Raw `guardrail.toml` preview** — read-only panel on the right showing
  the config file exactly as currently applied on disk.

On save, the backend writes to a temp file, runs `guardrail validate`
against it, and only replaces the real config and sends `SIGHUP` if
validation succeeds. A failed validation surfaces the validator's own error
text in a destructive alert and leaves the running proxy untouched — nothing
in the frontend re-implements that validation logic.

---

## 4. Audit Log

Reads `GET /api/audit-log` with `search`, `decision`, `skip`, and `limit`
query params, refetching every 5 seconds.

- **Search box** — matches against `request_id`, `reason`, or `code`.
- **Decision filter** — all / allow / redact / block.
- **Table** — timestamp, decision badge, reason, truncated request ID, and
  latency, one row per record ingested from the proxy's audit NDJSON file.
- **Row click** opens a detail drawer with the full record.
- **Pagination** — simple prev/next over `total` count, 20 rows per page.

Every row here originated from a line `guardrail-rs` itself wrote to
`guardrail-audit.ndjson`; the backend's only job is tailing that file into
MongoDB so it can be queried and paginated.

---

## 5. Settings

Reads `GET /api/upstream`, writes via `PUT /api/upstream`.

- **Upstream LLM** — two cards, Mock and Gemini, each showing its target URL
  and whether it's currently active. Switching restarts the
  `guardrail_proxy` supervisor process (not a hot reload — see
  [`docs/SETUP_AND_OPERATIONS.md` §8](./SETUP_AND_OPERATIONS.md)) with the
  new upstream target. The Gemini card is disabled if no key is configured
  server-side; the key itself is never sent to or rendered by the frontend.
- **Proxy connection info** — a read-only summary of the proxy URL, metrics
  URL, config path, and audit log path the backend is currently using.

---

## What is intentionally not in this UI

- No authentication screen — there is none in this system. See
  [`docs/SECURITY.md`](./SECURITY.md).
- No user/tenant management — there is one global policy and one active
  upstream, shared by anyone who can reach the app.
- No charts beyond the single decision-trend line chart on Overview — there
  is no Grafana, Prometheus server, or long-term metrics retention; MongoDB
  snapshots only go back to the last proxy restart.
- No fine-tuning, drift detection, or model-retraining UI — this system does
  not run or manage any ML training pipeline.
