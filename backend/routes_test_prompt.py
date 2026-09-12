import time
from fastapi import APIRouter
from pydantic import BaseModel

import guardrail_bridge
import audit_service
import policy_manager

router = APIRouter()


class TestPromptRequest(BaseModel):
    content: str
    role: str = "user"
    upstream: str = "mock"  # 'mock' or 'gemini'


@router.post("/test-prompt")
async def test_prompt(req: TestPromptRequest):
    current_mode = guardrail_bridge.get_current_upstream_mode()
    switched = False
    if req.upstream in ("mock", "gemini") and req.upstream != current_mode:
        switch_result = policy_manager.switch_upstream(req.upstream)
        if not switch_result.get("success"):
            return {"error": "upstream_switch_failed", "detail": switch_result.get("validation_output")}
        switched = True
        # give the proxy a brief moment to come back up after restart
        import asyncio
        for _ in range(20):
            h = await guardrail_bridge.get_proxy_health()
            if h["status"] == "up":
                break
            await asyncio.sleep(0.3)

    sent_at = time.time()
    result = await guardrail_bridge.send_chat_completion(req.content, req.role, req.upstream)

    status_code = result["status_code"]
    body = result["body"]

    if status_code == 403:
        error = body.get("error", {}) if isinstance(body, dict) else {}
        decision_payload = {
            "decision": "block",
            "reason": error.get("message"),
            "code": error.get("code"),
            "request_id": error.get("guardrail_request_id"),
            "latency_pipeline_ms": None,
            "latency_total_ms": None,
            "pii_entities_found": [],
        }
    else:
        audit_record = await audit_service.get_latest_since(sent_at, timeout_s=3.0)
        if audit_record:
            decision_payload = {
                "decision": audit_record.get("decision", "allow"),
                "reason": audit_record.get("reason"),
                "code": audit_record.get("code"),
                "request_id": audit_record.get("request_id"),
                "latency_pipeline_ms": audit_record.get("latency_pipeline_ms"),
                "latency_total_ms": audit_record.get("latency_total_ms"),
                "pii_entities_found": audit_record.get("pii_entities_found", []),
            }
        else:
            decision_payload = {
                "decision": "allow", "reason": None, "code": None, "request_id": None,
                "latency_pipeline_ms": None, "latency_total_ms": None, "pii_entities_found": [],
            }

    return {
        "status_code": status_code,
        "upstream_used": req.upstream,
        "upstream_switched": switched,
        "client_latency_ms": result["client_latency_ms"],
        "raw_response": body,
        "debug_received_messages": body.get("_debug_received_messages") if isinstance(body, dict) else None,
        **decision_payload,
    }
