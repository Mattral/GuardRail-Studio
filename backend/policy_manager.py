"""Read / write / validate / hot-reload guardrail.toml.

The ONLY thing this module does with policy content is move it between a
structured JSON shape (for the React form editor) and the real TOML file
that guardrail-rs itself parses and enforces. It never evaluates a prompt.
"""
import os
import signal
import subprocess
import time
import tomlkit
import config


def _read_doc():
    with open(config.GUARDRAIL_CONFIG, "r") as f:
        return tomlkit.parse(f.read())


def get_raw_toml() -> str:
    with open(config.GUARDRAIL_CONFIG, "r") as f:
        return f.read()


def load_policy() -> dict:
    doc = _read_doc()
    stages = doc.get("stages", {})
    regex_injection = stages.get("regex_injection", {})
    pii = stages.get("pii_redactor", {})
    toxicity = stages.get("toxicity", {})
    replacements = pii.get("replacements", {})
    pipeline = doc.get("pipeline", {})

    custom_rules = []
    policy_tbl = doc.get("policy", {})
    for rule in policy_tbl.get("rules", []):
        when = rule.get("when", {})
        then = rule.get("then", {})
        custom_rules.append({
            "name": rule.get("name", ""),
            "enabled": bool(rule.get("enabled", False)),
            "keywords": list(when.get("content_contains", [])),
            "action": then.get("action", "block"),
            "message": then.get("message", ""),
        })

    return {
        "on_error": pipeline.get("on_error", "allow"),
        "regex_injection": {
            "enabled": bool(regex_injection.get("enabled", True)),
            "action": regex_injection.get("action", "block"),
        },
        "pii_redactor": {
            "enabled": bool(pii.get("enabled", True)),
            "entities": list(pii.get("entities", [])),
            "validate_luhn": bool(pii.get("validate_luhn", True)),
            "replacements": dict(replacements),
        },
        "toxicity": {
            "enabled": bool(toxicity.get("enabled", False)),
            "threshold": float(toxicity.get("threshold", 0.9)),
            "action": toxicity.get("action", "block"),
        },
        "custom_rules": custom_rules,
        "upstream_url": doc.get("upstream", {}).get("url", ""),
    }


def _apply_policy_to_doc(doc, policy: dict):
    stages = doc.setdefault("stages", tomlkit.table())

    ri = stages.setdefault("regex_injection", tomlkit.table())
    ri["enabled"] = bool(policy["regex_injection"]["enabled"])
    ri["action"] = policy["regex_injection"]["action"]

    pii = stages.setdefault("pii_redactor", tomlkit.table())
    pii["enabled"] = bool(policy["pii_redactor"]["enabled"])
    entities_arr = tomlkit.array()
    entities_arr.extend(policy["pii_redactor"]["entities"])
    pii["entities"] = entities_arr
    pii["validate_luhn"] = bool(policy["pii_redactor"]["validate_luhn"])
    pii["action"] = "redact"
    repl_tbl = tomlkit.table()
    for k, v in policy["pii_redactor"]["replacements"].items():
        repl_tbl[k] = v
    pii["replacements"] = repl_tbl

    tox = stages.setdefault("toxicity", tomlkit.table())
    tox["enabled"] = bool(policy["toxicity"]["enabled"])
    tox["threshold"] = float(policy["toxicity"]["threshold"])
    tox["action"] = policy["toxicity"]["action"]
    if "scan_roles" not in tox:
        roles_arr = tomlkit.array()
        roles_arr.extend(["user"])
        tox["scan_roles"] = roles_arr

    pipeline = doc.setdefault("pipeline", tomlkit.table())
    pipeline["on_error"] = policy.get("on_error", "allow")

    rules_aot = tomlkit.aot()
    for rule in policy.get("custom_rules", []):
        t = tomlkit.table()
        t["name"] = rule["name"]
        t["enabled"] = bool(rule["enabled"])
        when_t = tomlkit.table()
        kw_arr = tomlkit.array()
        kw_arr.extend(rule.get("keywords", []))
        when_t["content_contains"] = kw_arr
        t["when"] = when_t
        then_t = tomlkit.table()
        then_t["action"] = rule.get("action", "block")
        then_t["message"] = rule.get("message", "")
        t["then"] = then_t
        rules_aot.append(t)
    policy_tbl = doc.setdefault("policy", tomlkit.table())
    policy_tbl["rules"] = rules_aot

    return doc


def validate_config_at(path: str):
    result = subprocess.run(
        ["guardrail", "validate", "--config", path],
        capture_output=True, text=True, timeout=15,
    )
    return result.returncode == 0, (result.stdout + result.stderr).strip()


def sighup_reload():
    try:
        pid_out = subprocess.run(["pgrep", "-f", "guardrail run"], capture_output=True, text=True).stdout.strip()
        pid = int(pid_out.splitlines()[0])
        os.kill(pid, signal.SIGHUP)
        return True
    except Exception:
        return False


def save_policy(policy: dict):
    """Validate-then-apply. Never writes the real config unless valid."""
    doc = _read_doc()
    doc = _apply_policy_to_doc(doc, policy)
    new_text = tomlkit.dumps(doc)

    tmp_path = config.GUARDRAIL_CONFIG + ".tmp"
    with open(tmp_path, "w") as f:
        f.write(new_text)

    ok, output = validate_config_at(tmp_path)
    if not ok:
        os.remove(tmp_path)
        return {"success": False, "validation_output": output}

    os.replace(tmp_path, config.GUARDRAIL_CONFIG)
    reloaded = sighup_reload()
    return {"success": True, "validation_output": output, "reloaded": reloaded, "applied_at": time.time()}


def switch_upstream(mode: str):
    """mode: 'mock' or 'gemini'. Rewrites [upstream].url and restarts the proxy
    (a full restart is used here rather than SIGHUP because swapping upstream
    also changes connection-pool targets).
    """
    doc = _read_doc()
    upstream = doc.setdefault("upstream", tomlkit.table())
    upstream["url"] = config.MOCK_UPSTREAM_URL if mode == "mock" else config.GEMINI_OPENAI_BASE_URL
    new_text = tomlkit.dumps(doc)

    tmp_path = config.GUARDRAIL_CONFIG + ".tmp"
    with open(tmp_path, "w") as f:
        f.write(new_text)

    ok, output = validate_config_at(tmp_path)
    if not ok:
        os.remove(tmp_path)
        return {"success": False, "validation_output": output}

    os.replace(tmp_path, config.GUARDRAIL_CONFIG)
    subprocess.run(["supervisorctl", "restart", "guardrail_proxy"], capture_output=True, text=True)
    return {"success": True, "validation_output": output, "mode": mode}
