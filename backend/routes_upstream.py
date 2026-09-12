from fastapi import APIRouter
from pydantic import BaseModel

import config
import guardrail_bridge
import policy_manager

router = APIRouter()


class UpstreamSwitchRequest(BaseModel):
    mode: str  # 'mock' or 'gemini'


@router.get("/upstream")
async def get_upstream():
    mode = guardrail_bridge.get_current_upstream_mode()
    return {
        "mode": mode,
        "gemini_configured": bool(config.GEMINI_API_KEY),
        "mock_url": config.MOCK_UPSTREAM_URL,
        "gemini_url": config.GEMINI_OPENAI_BASE_URL,
        "proxy_url": config.GUARDRAIL_PROXY_URL,
        "metrics_url": config.GUARDRAIL_METRICS_URL,
        "config_path": config.GUARDRAIL_CONFIG,
        "audit_log_path": config.AUDIT_NDJSON_PATH,
    }


@router.put("/upstream")
async def put_upstream(req: UpstreamSwitchRequest):
    if req.mode not in ("mock", "gemini"):
        return {"success": False, "validation_output": "mode must be 'mock' or 'gemini'"}
    if req.mode == "gemini" and not config.GEMINI_API_KEY:
        return {"success": False, "validation_output": "GEMINI_API_KEY is not configured on the server"}
    result = policy_manager.switch_upstream(req.mode)
    return result
