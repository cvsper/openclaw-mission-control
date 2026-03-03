"use client";

import { useQuery } from "@tanstack/react-query";
import { getLocalAuthToken } from "@/auth/localAuth";

const BRIDGE_BASE = "/api/v1/bridge";

async function bridgeFetch<T>(path: string): Promise<T> {
  const token = getLocalAuthToken();
  const baseUrl = process.env.NEXT_PUBLIC_API_URL === "auto"
    ? `${window.location.protocol}//${window.location.hostname}:8100`
    : process.env.NEXT_PUBLIC_API_URL || "";

  const res = await fetch(`${baseUrl}${BRIDGE_BASE}${path}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) throw new Error(`Bridge ${path}: ${res.status}`);
  return res.json();
}

export type NexusOverview = {
  memory: { status: string; total_memories: number; uptime: string | null } | null;
  hub: { total: number; active: number; completed: number; blocked: number } | null;
  cortex: {
    retrieval_hit_rate: number | null;
    corrections_detected: number;
    total_prompts: number;
    error_rate: number | null;
    last_consolidation: string | null;
  } | null;
  unread_messages: number;
};

export type AgentMessage = {
  id: string;
  from_agent: string;
  to_agent: string;
  message: string;
  timestamp: string;
  read: boolean;
};

export function useNexusOverview() {
  return useQuery<NexusOverview>({
    queryKey: ["nexus-overview"],
    queryFn: () => bridgeFetch("/overview"),
    refetchInterval: 30_000,
    retry: false,
  });
}

export function useAgentMessages(agentId: string | null) {
  return useQuery<AgentMessage[]>({
    queryKey: ["agent-messages", agentId],
    queryFn: () => bridgeFetch(`/messages/${agentId}`),
    enabled: Boolean(agentId),
    refetchInterval: 15_000,
  });
}

export function useMemoryHealth() {
  return useQuery({
    queryKey: ["memory-health"],
    queryFn: () => bridgeFetch<{ status: string; total_memories: number } | null>("/memory/health"),
    refetchInterval: 30_000,
  });
}

export function useHubTaskCounts() {
  return useQuery({
    queryKey: ["hub-task-counts"],
    queryFn: () => bridgeFetch<{ total: number; active: number; completed: number } | null>("/hub/task-counts"),
    refetchInterval: 30_000,
  });
}

export function useCortexMetrics() {
  return useQuery({
    queryKey: ["cortex-metrics"],
    queryFn: () => bridgeFetch<{
      retrieval_hit_rate: number | null;
      corrections_detected: number;
      total_prompts: number;
      error_rate: number | null;
    } | null>("/cortex/metrics"),
    refetchInterval: 30_000,
  });
}

export function useMemorySearch(query: string) {
  return useQuery({
    queryKey: ["memory-search", query],
    queryFn: () => bridgeFetch<Array<{ content: string; score: number }>>(`/memory/search?q=${encodeURIComponent(query)}`),
    enabled: query.length > 0,
  });
}
