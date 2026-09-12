# Contributing to GuardRail Studio

A practical guide to working on this codebase, matching how it is actually
structured and tested today.

**Companion docs:** [Philosophy](./PHILOSOPHY.md) · [System Design](./SYSTEM_DESIGN.md)

---

## 1. Repository layout

```
/app
├── backend/            # FastAPI control plane
│   ├── server.py       # app + lifespan (starts the two background loops)
│   ├── config.py       # env var loading
│   ├── db.py           # Mongo collections
│   ├── guardrail_bridge.py   # HTTP client to the guardrail-rs proxy
│   ├── policy_manager.py     # guardrail.toml read/write/validate/reload
│   ├── audit_service.py      # NDJSON tailer + audit query API
│   ├── metrics_service.py    # Prometheus scrape + snapshot storage
│   └── routes_*.py           # one module per resource
├── frontend/           # React control-plane UI (Overview, Test Console,
│                         Policy Editor, Audit Log, Settings)
├── guardrail/          # the data-plane config + mock upstream + POC test
│   ├── guardrail.toml
│   ├── mock_upstream.py
│   └── test_core.py    # isolated verification of the Rust proxy
├── backend_test.py     # verification of the FastAPI backend's public API
└── docs/               # this documentation set
```

---

## 2. Making a change to the firewall behavior

If you want to change what counts as an injection, what PII entities are
redacted, or what custom rules exist — **do this in `guardrail.toml`** (or via
the Policy Editor UI, which writes the same file). Do not add Python code that
matches regexes or scores prompts; that logic belongs to `guardrail-rs` and
duplicating it in the control plane is exactly the anti-pattern this project
is structured to avoid.

After any manual edit to `guardrail.toml`:

```bash
guardrail validate --config /app/guardrail/guardrail.toml
kill -HUP $(pgrep -f "guardrail run")   # or: supervisorctl restart guardrail_proxy
```

---

## 3. Making a change to the control plane

- Backend: FastAPI with hot reload already enabled under supervisor
  (`uvicorn ... --reload`). Edit and the process restarts automatically.
- Frontend: CRA dev server with hot reload, same mechanism.
- Both talk to Mongo directly (`motor`), no ORM/migration tooling is present.

---

## 4. Testing

There is no CI pipeline, coverage gate, or linter enforced in this repository.
What exists and is real:

| Script | What it checks | Last known result |
|---|---|---|
| `guardrail/test_core.py` | The Rust proxy in isolation: allow/block/redact, metrics, audit log, real Gemini upstream swap | 18/18 passed |
| `backend_test.py` | The FastAPI backend's public HTTP API against a running deployment | 50/50 passed |

Run both after any change that touches the proxy config or the backend API:

```bash
python3 /app/guardrail/test_core.py
python3 /app/backend_test.py
```

There is no frontend automated test suite; UI changes are currently verified
manually and via browser screenshots.

---

## 5. Style

No formatter or linter is enforced by tooling. Match the existing style in the
file you are editing (the backend follows straightforward, mostly-flat FastAPI
modules; the frontend follows the existing shadcn/ui + Tailwind conventions in
`frontend/src/components/ui`).
