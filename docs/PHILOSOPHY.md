# GuardRail Studio — Design Philosophy

This document explains the one architectural decision that everything else in
this repository follows from.

**Companion docs:** [Contributing](./CONTRIBUTING.md) · [System Design](./SYSTEM_DESIGN.md)

---

## The core decision: control plane and data plane are different programs

The original brief for this project (`instruction.md` in the project history)
was explicit about a failure mode it wanted to avoid: a dashboard that *looks*
like a firewall but actually contains a Python function doing
`if "ignore previous instructions" in text: block()`, dressed up with metrics
and a nice UI. That pattern is common, and it is fragile — every new attack
phrase requires a code change to the app itself, and the "firewall" logic
cannot be reused by anything other than that one app.

So the rule this codebase follows is:

> **If a decision about whether to allow, redact, or block a prompt needs to
> be made, it is made by `guardrail-rs`, not by this repository's Python or
> JavaScript.**

Concretely, that means:

- There is no regex, keyword list, or ML classifier for injection/PII/toxicity
  detection anywhere in `backend/`.
- The "Test a Prompt" console does not simulate a response — it sends a real
  HTTP request to the real proxy and shows you the real proxy's real decision.
- The Policy Editor does not maintain its own copy of "the rules" — it reads
  and writes the exact TOML file the proxy parses, and asks the proxy itself
  (`guardrail validate`) whether an edit is even valid before applying it.
- Metrics and audit history shown in the dashboard are not computed by this
  app — they are the proxy's own Prometheus counters and its own audit log,
  merely persisted and displayed.

The practical cost of this decision is that the control plane is *more work*
to build than a self-contained mock would have been — it has to correlate
asynchronous audit-log writes, handle `guardrail validate` failures
gracefully, and restart a real OS process when the upstream changes. The
benefit is that everything the dashboard reports is true of the actual traffic
path, not a simulation of it.

---

## Why this matters beyond "it's more correct"

A dashboard that mocks its own backend will always demo well and then fail
the first time someone points a real attack at it, because the mock's
author is guessing at what a firewall would say, not asking one. Building on
top of a real (if simple) Rust proxy means the hard part — actually parsing
and judging text at the wire level — was solved once, correctly, outside of
this application, and this application's only job is to make that real thing
observable and configurable.
