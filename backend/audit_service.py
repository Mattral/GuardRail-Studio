"""Tails the REAL guardrail-rs audit NDJSON file into MongoDB, and serves
queries over that ingested history. This is purely an ingestion/read layer -
it never decides allow/redact/block; that decision already happened in Rust
and was written to the audit log by guardrail-rs itself.
"""
import asyncio
import json
import os
import time

import config
from db import audit_logs

_state = {"offset": 0}


def _parse_line(line: str):
    try:
        rec = json.loads(line)
    except json.JSONDecodeError:
        return None
    fields = rec.get("fields", rec)
    request_id = fields.get("request_id")
    if not request_id:
        return None

    def _unwrap(val):
        # Rust Option<T> debug strings look like Some("...") / None
        if isinstance(val, str) and val.startswith("Some(") and val.endswith(")"):
            inner = val[5:-1]
            if inner.startswith('"') and inner.endswith('"'):
                inner = inner[1:-1]
            return inner
        if val == "None":
            return None
        return val

    pii_entities = fields.get("pii_entities_found", "[]")
    try:
        pii_list = json.loads(pii_entities) if isinstance(pii_entities, str) else pii_entities
    except Exception:
        pii_list = []

    return {
        "request_id": request_id,
        "timestamp": fields.get("timestamp") or rec.get("timestamp"),
        "decision": fields.get("decision", "unknown"),
        "stage": _unwrap(fields.get("stage")),
        "reason": _unwrap(fields.get("reason")),
        "code": _unwrap(fields.get("code")),
        "model": fields.get("model"),
        "provider": fields.get("provider"),
        "message_count": fields.get("message_count"),
        "pii_entities_found": pii_list,
        "latency_pipeline_ms": fields.get("latency_pipeline_ms"),
        "latency_total_ms": fields.get("latency_total_ms"),
        "ingested_at": time.time(),
    }


async def _ingest_new_lines():
    path = config.AUDIT_NDJSON_PATH
    if not os.path.exists(path):
        return
    size = os.path.getsize(path)
    if size < _state["offset"]:
        _state["offset"] = 0  # rotation/truncation
    if size == _state["offset"]:
        return
    with open(path, "r") as f:
        f.seek(_state["offset"])
        new_data = f.read()
        _state["offset"] = f.tell()

    docs = []
    for line in new_data.splitlines():
        line = line.strip()
        if not line:
            continue
        parsed = _parse_line(line)
        if parsed:
            docs.append(parsed)

    for doc in docs:
        await audit_logs.update_one(
            {"request_id": doc["request_id"]}, {"$set": doc}, upsert=True,
        )


async def audit_tailer_loop():
    while True:
        try:
            await _ingest_new_lines()
        except Exception:
            pass
        await asyncio.sleep(1.5)


async def list_audit_logs(decision: str = None, search: str = None, skip: int = 0, limit: int = 50):
    query = {}
    if decision and decision != "all":
        query["decision"] = decision
    if search:
        query["$or"] = [
            {"request_id": {"$regex": search, "$options": "i"}},
            {"reason": {"$regex": search, "$options": "i"}},
            {"code": {"$regex": search, "$options": "i"}},
        ]
    cursor = audit_logs.find(query, {"_id": 0}).sort("ingested_at", -1).skip(skip).limit(limit)
    items = await cursor.to_list(length=limit)
    total = await audit_logs.count_documents(query)
    return items, total


async def get_recent(limit: int = 20):
    cursor = audit_logs.find({}, {"_id": 0}).sort("ingested_at", -1).limit(limit)
    return await cursor.to_list(length=limit)


async def get_latest_since(min_ingested_at: float, timeout_s: float = 3.0):
    """Poll briefly for the audit record produced by a just-sent test prompt."""
    deadline = time.time() + timeout_s
    while time.time() < deadline:
        await _ingest_new_lines()
        doc = await audit_logs.find_one(
            {"ingested_at": {"$gte": min_ingested_at}}, {"_id": 0}, sort=[("ingested_at", -1)],
        )
        if doc:
            return doc
        await asyncio.sleep(0.2)
    return None


async def get_by_request_id(request_id: str):
    return await audit_logs.find_one({"request_id": request_id}, {"_id": 0})
