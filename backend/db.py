"""MongoDB connection + collection accessors for GuardRail Studio.

Collections:
  audit_logs        - every firewall decision, ingested from the guardrail-rs
                       audit NDJSON file (never generated in Python)
  metrics_snapshots  - periodic scrapes of the proxy's /metrics endpoint
  policy_history     - every applied guardrail.toml version (for audit/rollback)
"""
from motor.motor_asyncio import AsyncIOMotorClient
import config

client = AsyncIOMotorClient(config.MONGO_URL)
db = client[config.DB_NAME]

audit_logs = db["audit_logs"]
metrics_snapshots = db["metrics_snapshots"]
policy_history = db["policy_history"]


async def ensure_indexes():
    await audit_logs.create_index("request_id", unique=True)
    await audit_logs.create_index("timestamp")
    await audit_logs.create_index("decision")
    await metrics_snapshots.create_index("timestamp")
    await policy_history.create_index("applied_at")
