"""Parses the REAL Prometheus metrics exposed by guardrail-rs (:8080/metrics)
and persists periodic snapshots to Mongo for trend charts. No detection
logic lives here - just observability plumbing.
"""
import asyncio
import time
from prometheus_client.parser import text_string_to_metric_families

import guardrail_bridge
from db import metrics_snapshots


def parse_metrics(text: str) -> dict:
    counters = {"allow": 0.0, "redact": 0.0, "block": 0.0}
    active_connections = 0.0
    pipeline_sum, pipeline_count = 0.0, 0.0
    request_sum, request_count = 0.0, 0.0
    pipeline_buckets = {}

    for family in text_string_to_metric_families(text):
        for sample in family.samples:
            if sample.name == "guardrail_requests_total":
                decision = sample.labels.get("decision")
                if decision in counters:
                    counters[decision] += sample.value
            elif sample.name == "guardrail_active_connections":
                active_connections = sample.value
            elif sample.name == "guardrail_pipeline_duration_seconds_sum":
                pipeline_sum = sample.value
            elif sample.name == "guardrail_pipeline_duration_seconds_count":
                pipeline_count = sample.value
            elif sample.name == "guardrail_pipeline_duration_seconds_bucket":
                le = sample.labels.get("le")
                pipeline_buckets[le] = sample.value
            elif sample.name == "guardrail_request_duration_seconds_sum" and sample.labels.get("decision") == "total":
                request_sum = sample.value
            elif sample.name == "guardrail_request_duration_seconds_count" and sample.labels.get("decision") == "total":
                request_count = sample.value

    avg_pipeline_ms = round((pipeline_sum / pipeline_count) * 1000, 3) if pipeline_count else 0.0
    avg_request_ms = round((request_sum / request_count) * 1000, 3) if request_count else 0.0

    p95_pipeline_ms = None
    if pipeline_count:
        threshold = 0.95 * pipeline_count
        for le_str, cum in sorted(pipeline_buckets.items(), key=lambda kv: float(kv[0]) if kv[0] != "+Inf" else float("inf")):
            if cum >= threshold:
                p95_pipeline_ms = round(float(le_str) * 1000, 3) if le_str != "+Inf" else None
                break

    total = sum(counters.values())
    return {
        "allow_total": counters["allow"],
        "redact_total": counters["redact"],
        "block_total": counters["block"],
        "total_requests": total,
        "active_connections": active_connections,
        "avg_pipeline_latency_ms": avg_pipeline_ms,
        "avg_request_latency_ms": avg_request_ms,
        "p95_pipeline_latency_ms": p95_pipeline_ms,
    }


async def get_current_metrics():
    text = await guardrail_bridge.fetch_metrics_text()
    return parse_metrics(text)


async def snapshot_loop():
    while True:
        try:
            parsed = await get_current_metrics()
            parsed["timestamp"] = time.time()
            await metrics_snapshots.insert_one(parsed)
        except Exception:
            pass
        await asyncio.sleep(10)


async def get_history(minutes: int = 60):
    since = time.time() - minutes * 60
    cursor = metrics_snapshots.find({"timestamp": {"$gte": since}}, {"_id": 0}).sort("timestamp", 1)
    return await cursor.to_list(length=2000)
