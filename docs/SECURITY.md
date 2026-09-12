# GuardRail Studio — Security Notes

This is an honest description of the security posture of the system as it
exists today, written for someone deciding whether/how to use it. It is not a
compliance document and it does not claim controls that are not implemented.

**Companion docs:** [System Design](./SYSTEM_DESIGN.md) ·
[Setup & Operations](./SETUP_AND_OPERATIONS.md)

---

## 1. What this system actually protects against

The protection comes entirely from `guardrail-rs` (the Rust data plane), not
from any code in this repository:

| Threat | Mechanism | Status |
|---|---|---|
| Prompt injection ("ignore previous instructions", etc.) | Bundled regex rule set, `action = block` | **Active by default** |
| PII leaking to the upstream model | Regex-based entity detection (email, phone, credit card with Luhn check, SSN, IP address, API key, AWS key) + token substitution | **Active by default** |
| Custom, deployment-specific banned phrases | User-defined `[[policy.rules]]` (keyword match → block), editable from the Policy Editor | **Active, empty by default** |
| Semantic (non-regex) injection attempts | ONNX classifier stage (`onnx_injection`) | **Not active** — no model file is shipped |
| Toxic content | ONNX toxicity classifier stage | **Not active** — no model file is shipped |

The regex-based approach can be evaded by anyone who rephrases an attack to
avoid the bundled patterns. This is a known, general limitation of
signature-based detection and is not specific to this deployment — see the
upstream project's own `docs/threat-model.md` for what it explicitly does not
claim to cover (e.g. adversarial ML evasion).

---

## 2. What this system does NOT do

Being explicit about this matters more than listing what it does do:

- **No authentication or authorization anywhere** — not on the FastAPI
  backend's API, not on the `guardrail-rs` proxy (`auth.require_key = false`),
  and not on the React dashboard. Anyone who can reach the URLs can read the
  full audit log, change the firewall policy, and switch the upstream target.
  This was an explicit choice for a single-operator internal tool, not an
  oversight — but it means this should not be exposed on a shared or public
  network without adding an auth layer first.
- **No rate limiting** on the backend or the proxy.
- **No TLS termination owned by this repository** — whatever TLS exists comes
  from the hosting platform's own ingress in front of the dev servers; nothing
  in this codebase manages certificates.
- **No secrets manager integration** — the Gemini API key lives in a plain
  `.env` file read by `python-dotenv`. It is never sent to the frontend and
  never logged, but it is not encrypted at rest beyond normal filesystem
  permissions.
- **No multi-tenancy.** There is one firewall policy and one upstream
  selection, global to the whole system.
- **No data-loss-prevention on outbound model responses** — the proxy's
  `output_pii_redactor` response stage exists in the pipeline config, but this
  project has not separately verified redaction of PII coming *back* from an
  LLM response (only inbound request redaction was tested).

---

## 3. Data handled

- **Audit log** (`guardrail-audit.ndjson`, mirrored into MongoDB): contains
  the *decision metadata* guardrail-rs emits (decision, matched rule, latency,
  which PII entity types were found) — it does **not** contain the raw prompt
  text of blocked/redacted requests, because guardrail-rs itself does not
  write full payloads to that log by default.
- **Test-prompt requests** you send from the "Test a Prompt" console do pass
  through the real Gemini API when that upstream is selected, using your
  configured key — treat test content accordingly.
- **Gemini API key**: stored server-side only, forwarded as a bearer token on
  outbound requests when Gemini is the active upstream, never rendered in the
  frontend.

---

## 4. If you wanted to harden this for shared use

In order of what would matter most first:

1. Put a real authentication layer in front of the FastAPI backend and the
   React app (this system deliberately has none right now).
2. Set `auth.require_key = true` and a generated key in `guardrail.toml`'s
   `[auth]` section, and have the backend forward `X-Guardrail-Key`.
3. Add per-caller rate limiting in front of `/api/test-prompt` — a single
   caller can currently trigger unlimited real Gemini calls.
4. Move the Gemini API key into a real secrets manager instead of a `.env`
   file, if this ever runs somewhere with weaker filesystem isolation.
5. Enable and validate the `onnx_injection` / `toxicity` stages with real
   models if semantic (non-regex) detection is required.
