from fastapi import APIRouter, Query
from typing import Optional

import audit_service

router = APIRouter()


@router.get("/audit-log")
async def audit_log(
    decision: Optional[str] = Query(default=None),
    search: Optional[str] = Query(default=None),
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=50, ge=1, le=200),
):
    items, total = await audit_service.list_audit_logs(decision=decision, search=search, skip=skip, limit=limit)
    return {"items": items, "total": total, "skip": skip, "limit": limit}


@router.get("/audit-log/recent")
async def audit_log_recent(limit: int = 20):
    return await audit_service.get_recent(limit=limit)


@router.get("/audit-log/{request_id}")
async def audit_log_detail(request_id: str):
    doc = await audit_service.get_by_request_id(request_id)
    if not doc:
        return {"error": "not_found"}
    return doc
