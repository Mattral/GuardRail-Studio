from fastapi import APIRouter
from pydantic import BaseModel
from typing import List, Dict
import time

import policy_manager
from db import policy_history

router = APIRouter()


class RegexInjectionPolicy(BaseModel):
    enabled: bool
    action: str


class PiiPolicy(BaseModel):
    enabled: bool
    entities: List[str]
    validate_luhn: bool
    replacements: Dict[str, str]


class ToxicityPolicy(BaseModel):
    enabled: bool
    threshold: float
    action: str


class CustomRule(BaseModel):
    name: str
    enabled: bool
    keywords: List[str]
    action: str
    message: str = ""


class PolicyPayload(BaseModel):
    on_error: str = "allow"
    regex_injection: RegexInjectionPolicy
    pii_redactor: PiiPolicy
    toxicity: ToxicityPolicy
    custom_rules: List[CustomRule] = []


@router.get("/policy")
async def get_policy():
    policy = policy_manager.load_policy()
    raw = policy_manager.get_raw_toml()
    return {"policy": policy, "raw_toml": raw}


@router.put("/policy")
async def put_policy(payload: PolicyPayload):
    policy_dict = payload.dict()
    result = policy_manager.save_policy(policy_dict)
    if result.get("success"):
        await policy_history.insert_one({
            "applied_at": time.time(),
            "policy": policy_dict,
            "raw_toml": policy_manager.get_raw_toml(),
        })
        result["raw_toml"] = policy_manager.get_raw_toml()
    return result


@router.get("/policy/history")
async def policy_history_list(limit: int = 20):
    cursor = policy_history.find({}, {"_id": 0}).sort("applied_at", -1).limit(limit)
    return await cursor.to_list(length=limit)
