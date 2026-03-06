"""Pydantic schemas for the Nexus bridge API."""

from __future__ import annotations

from typing import Any

from pydantic import BaseModel


class ZimMemoryHealth(BaseModel):
    status: str = "unknown"
    total_memories: int = 0
    uptime: str | None = None


class ZimMemoryStats(BaseModel):
    total_memories: int = 0
    categories: dict[str, int] = {}


class AgentMessage(BaseModel):
    id: str
    from_agent: str
    to_agent: str
    message: str
    timestamp: str
    read: bool = False

    @classmethod
    def from_zimemory(cls, data: dict[str, Any]) -> "AgentMessage":
        """Create from ZimMemory inbox response format."""
        created = data.get("created_at", "")
        if isinstance(created, (int, float)):
            from datetime import datetime, timezone
            created = datetime.fromtimestamp(created, tz=timezone.utc).isoformat()
        status = data.get("status", "unread")
        return cls(
            id=data["id"],
            from_agent=data.get("from_agent", data.get("from", "")),
            to_agent=data.get("to_agent", data.get("to", "")),
            message=data.get("message", ""),
            timestamp=str(created),
            read=status == "read",
        )


class SendMessageRequest(BaseModel):
    from_agent: str
    to_agent: str
    message: str


class HubTaskCounts(BaseModel):
    total: int = 0
    active: int = 0
    completed: int = 0
    blocked: int = 0


class CortexMetrics(BaseModel):
    retrieval_hit_rate: float | None = None
    corrections_detected: int = 0
    total_prompts: int = 0
    error_rate: float | None = None
    last_consolidation: str | None = None


class NexusOverview(BaseModel):
    memory: ZimMemoryHealth | None = None
    hub: HubTaskCounts | None = None
    cortex: CortexMetrics | None = None
    unread_messages: int = 0
