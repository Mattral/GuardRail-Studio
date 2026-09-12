from fastapi import APIRouter

import metrics_service

router = APIRouter()


@router.get("/metrics")
async def metrics():
    try:
        current = await metrics_service.get_current_metrics()
        available = True
    except Exception:
        current = None
        available = False
    history = await metrics_service.get_history(minutes=60)
    return {"available": available, "current": current, "history": history}
