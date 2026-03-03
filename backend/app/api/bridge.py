"""Bridge API router — proxies to ZimMemory, Hub, and Cortex."""

from __future__ import annotations

from fastapi import APIRouter, Query

from app.schemas.bridge import (
    AgentMessage,
    CortexMetrics,
    HubTaskCounts,
    NexusOverview,
    SendMessageRequest,
    ZimMemoryHealth,
    ZimMemoryStats,
)
from app.services import bridge

router = APIRouter(prefix="/bridge", tags=["bridge"])


@router.get("/overview", response_model=NexusOverview)
async def overview():
    """Composite overview: memory health + hub tasks + cortex metrics."""
    return await bridge.get_overview()


@router.get("/memory/stats", response_model=ZimMemoryStats | None)
async def memory_stats():
    return await bridge.get_memory_stats()


@router.get("/memory/health", response_model=ZimMemoryHealth | None)
async def memory_health():
    return await bridge.get_memory_health()


@router.get("/memory/search")
async def memory_search(q: str = Query(..., min_length=1)):
    return await bridge.search_memory(q)


@router.get("/messages/{agent_id}", response_model=list[AgentMessage])
async def agent_messages(agent_id: str):
    return await bridge.get_agent_messages(agent_id)


@router.post("/messages/send")
async def send_message(body: SendMessageRequest):
    success = await bridge.send_message(body.from_agent, body.to_agent, body.message)
    return {"ok": success}


@router.get("/hub/task-counts", response_model=HubTaskCounts | None)
async def hub_task_counts():
    return await bridge.get_hub_task_counts()


@router.get("/cortex/metrics", response_model=CortexMetrics | None)
async def cortex_metrics():
    return await bridge.get_cortex_metrics()
