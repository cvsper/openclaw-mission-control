"""Bridge service — proxies requests to ZimMemory, Hub, and Cortex."""

from __future__ import annotations

import json
from pathlib import Path

import httpx

from app.core.config import settings
from app.core.logging import get_logger
from app.schemas.bridge import (
    AgentMessage,
    CortexMetrics,
    HubTaskCounts,
    NexusOverview,
    ZimMemoryHealth,
    ZimMemoryStats,
)

logger = get_logger(__name__)

_client: httpx.AsyncClient | None = None


def _get_client() -> httpx.AsyncClient:
    global _client
    if _client is None or _client.is_closed:
        _client = httpx.AsyncClient(timeout=5.0)
    return _client


# ---------------------------------------------------------------------------
# ZimMemory
# ---------------------------------------------------------------------------

async def get_memory_health() -> ZimMemoryHealth | None:
    if not settings.zimemory_url:
        return None
    try:
        client = _get_client()
        resp = await client.get(f"{settings.zimemory_url}/health")
        resp.raise_for_status()
        data = resp.json()
        return ZimMemoryHealth(
            status=data.get("status", "ok"),
            total_memories=data.get("memories", data.get("total_memories", 0)),
            uptime=data.get("uptime"),
        )
    except Exception:
        logger.warning("bridge.zimemory.health_failed")
        return None


async def get_memory_stats() -> ZimMemoryStats | None:
    if not settings.zimemory_url:
        return None
    try:
        client = _get_client()
        resp = await client.get(f"{settings.zimemory_url}/stats")
        resp.raise_for_status()
        data = resp.json()
        return ZimMemoryStats(
            total_memories=data.get("total_memories", 0),
            categories=data.get("categories", {}),
        )
    except Exception:
        logger.warning("bridge.zimemory.stats_failed")
        return None


async def search_memory(query: str) -> list[dict]:
    if not settings.zimemory_url:
        return []
    try:
        client = _get_client()
        resp = await client.post(
            f"{settings.zimemory_url}/search",
            json={"query": query},
        )
        resp.raise_for_status()
        data = resp.json()
        return data.get("results", [])
    except Exception:
        logger.warning("bridge.zimemory.search_failed")
        return []


async def get_agent_messages(agent_id: str) -> list[AgentMessage]:
    if not settings.zimemory_url:
        return []
    try:
        client = _get_client()
        resp = await client.get(
            f"{settings.zimemory_url}/messages/inbox",
            params={"agent_id": agent_id},
        )
        resp.raise_for_status()
        data = resp.json()
        messages = data if isinstance(data, list) else data.get("messages", [])
        return [AgentMessage.from_zimemory(m) for m in messages]
    except Exception:
        logger.warning("bridge.zimemory.messages_failed agent=%s", agent_id)
        return []


async def get_unread_count(agent_id: str = "dommo") -> int:
    if not settings.zimemory_url:
        return 0
    try:
        client = _get_client()
        resp = await client.get(
            f"{settings.zimemory_url}/messages/unread-count",
            params={"agent_id": agent_id},
        )
        resp.raise_for_status()
        data = resp.json()
        return data.get("unread", 0)
    except Exception:
        logger.warning("bridge.zimemory.unread_count_failed")
        return 0


async def send_message(from_agent: str, to_agent: str, message: str) -> bool:
    if not settings.zimemory_url:
        return False
    try:
        client = _get_client()
        resp = await client.post(
            f"{settings.zimemory_url}/messages/send",
            json={
                "from_agent": from_agent,
                "to_agent": to_agent,
                "message": message,
            },
        )
        resp.raise_for_status()
        return True
    except Exception:
        logger.warning("bridge.zimemory.send_failed")
        return False


# ---------------------------------------------------------------------------
# Hub
# ---------------------------------------------------------------------------

async def get_hub_tasks() -> list[dict]:
    if not settings.hub_url:
        return []
    try:
        client = _get_client()
        resp = await client.get(f"{settings.hub_url}/tasks")
        resp.raise_for_status()
        data = resp.json()
        return data if isinstance(data, list) else data.get("tasks", [])
    except Exception:
        logger.warning("bridge.hub.tasks_failed")
        return []


async def get_hub_task_counts() -> HubTaskCounts | None:
    if not settings.hub_url:
        return None
    try:
        client = _get_client()
        resp = await client.get(f"{settings.hub_url}/tasks/counts")
        resp.raise_for_status()
        data = resp.json()
        return HubTaskCounts(**data)
    except Exception:
        logger.warning("bridge.hub.task_counts_failed")
        return None


# ---------------------------------------------------------------------------
# Cortex
# ---------------------------------------------------------------------------

async def get_cortex_metrics() -> CortexMetrics | None:
    metrics_path = Path(settings.cortex_metrics_path)
    if not metrics_path.exists():
        # Try default location
        fallback = Path.home() / ".cortex" / "metrics" / "latest.json"
        if not fallback.exists():
            return None
        metrics_path = fallback
    try:
        data = json.loads(metrics_path.read_text())
        return CortexMetrics(
            retrieval_hit_rate=data.get("retrieval_hit_rate"),
            corrections_detected=data.get("corrections_detected", 0),
            total_prompts=data.get("total_prompts", 0),
            error_rate=data.get("error_rate"),
            last_consolidation=data.get("last_consolidation"),
        )
    except Exception:
        logger.warning("bridge.cortex.metrics_failed")
        return None


# ---------------------------------------------------------------------------
# Composite
# ---------------------------------------------------------------------------

async def get_overview() -> NexusOverview:
    import asyncio

    memory_task = asyncio.create_task(get_memory_health())
    hub_task = asyncio.create_task(get_hub_task_counts())
    cortex_task = asyncio.create_task(get_cortex_metrics())
    unread_task = asyncio.create_task(get_unread_count())

    memory, hub, cortex, unread = await asyncio.gather(
        memory_task, hub_task, cortex_task, unread_task,
        return_exceptions=True,
    )

    return NexusOverview(
        memory=memory if isinstance(memory, ZimMemoryHealth) else None,
        hub=hub if isinstance(hub, HubTaskCounts) else None,
        cortex=cortex if isinstance(cortex, CortexMetrics) else None,
        unread_messages=unread if isinstance(unread, int) else 0,
    )
