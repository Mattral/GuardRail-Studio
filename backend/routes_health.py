from fastapi import APIRouter
import config
import guardrail_bridge

router = APIRouter()


@router.get("/health")
async def health():
    proxy = await guardrail_bridge.get_proxy_health()
    mock = await guardrail_bridge.get_mock_upstream_health()
    mode = guardrail_bridge.get_current_upstream_mode()
    return {
        "backend": "ok",
        "proxy": proxy,
        "mock_upstream": mock,
        "active_upstream": mode,
        "gemini_configured": bool(config.GEMINI_API_KEY),
    }
