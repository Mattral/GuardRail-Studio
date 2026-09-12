"""GuardRail Studio - control-plane FastAPI application.

This backend NEVER re-implements prompt-injection / PII / toxicity detection.
All of that happens in the real guardrail-rs Rust proxy (data plane). This
service only:
  - drives test traffic through the proxy and correlates results with the
    audit log
  - reads / writes / validates / hot-reloads guardrail.toml
  - tails the proxy's audit NDJSON + scrapes its Prometheus metrics into
    Mongo for the dashboard
"""
import asyncio
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

import config
from db import ensure_indexes
import audit_service
import metrics_service
from routes_health import router as health_router
from routes_test_prompt import router as test_prompt_router
from routes_policy import router as policy_router
from routes_audit import router as audit_router
from routes_metrics import router as metrics_router
from routes_upstream import router as upstream_router

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("guardrail_studio")

background_tasks = []


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("GuardRail Studio control plane starting up")
    await ensure_indexes()
    background_tasks.append(asyncio.create_task(audit_service.audit_tailer_loop()))
    background_tasks.append(asyncio.create_task(metrics_service.snapshot_loop()))
    yield
    logger.info("GuardRail Studio control plane shutting down")
    for task in background_tasks:
        task.cancel()


app = FastAPI(title="GuardRail Studio", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"] if config.CORS_ORIGINS == "*" else config.CORS_ORIGINS.split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health_router, prefix="/api")
app.include_router(test_prompt_router, prefix="/api")
app.include_router(policy_router, prefix="/api")
app.include_router(audit_router, prefix="/api")
app.include_router(metrics_router, prefix="/api")
app.include_router(upstream_router, prefix="/api")


@app.get("/api")
async def root():
    return {"service": "GuardRail Studio", "status": "operational"}
