"use client";

import Link from "next/link";
import { useAuth } from "@/auth/clerk";
import { ApiError } from "@/api/mutator";
import {
  type listAgentsApiV1AgentsGetResponse,
  useListAgentsApiV1AgentsGet,
} from "@/api/generated/agents/agents";
import { cn } from "@/lib/utils";

type AgentStatus = "online" | "idle" | "offline" | "provisioning" | "error";

const STATUS_COLORS: Record<AgentStatus, string> = {
  online: "bg-emerald-500",
  idle: "bg-amber-400",
  offline: "bg-slate-300",
  provisioning: "bg-blue-400",
  error: "bg-rose-500",
};

const STATUS_LABELS: Record<AgentStatus, string> = {
  online: "Online",
  idle: "Idle",
  offline: "Offline",
  provisioning: "Provisioning",
  error: "Error",
};

const ROLE_COLORS: Record<string, string> = {
  Architect: "text-violet-600 bg-violet-50",
  Orchestrator: "text-blue-600 bg-blue-50",
  Research: "text-emerald-600 bg-emerald-50",
  Creative: "text-pink-600 bg-pink-50",
  Operations: "text-amber-600 bg-amber-50",
  Security: "text-red-600 bg-red-50",
};

function normalizeStatus(raw: string | null | undefined): AgentStatus {
  if (!raw) return "offline";
  const s = raw.toLowerCase();
  if (s === "online" || s === "active") return "online";
  if (s === "idle" || s === "standby") return "idle";
  if (s === "provisioning") return "provisioning";
  if (s === "error" || s === "failed") return "error";
  return "offline";
}

export function AgentStatusGrid() {
  const { isSignedIn } = useAuth();
  const agentsQuery = useListAgentsApiV1AgentsGet<
    listAgentsApiV1AgentsGetResponse,
    ApiError
  >(
    { limit: 50 },
    {
      query: {
        enabled: Boolean(isSignedIn),
        refetchInterval: 15_000,
        refetchOnMount: "always",
      },
    },
  );

  const agents = agentsQuery.data?.status === 200
    ? (agentsQuery.data.data.items ?? [])
    : [];

  if (agentsQuery.isLoading && agents.length === 0) {
    return (
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="h-24 animate-pulse rounded-xl border border-slate-200 bg-slate-100"
          />
        ))}
      </div>
    );
  }

  if (agents.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-500">
        No agents registered yet.{" "}
        <Link href="/agents/new" className="font-medium text-violet-600 hover:underline">
          Create one
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
      {agents.map((agent) => {
        const status = normalizeStatus(agent.status);
        const role = String(agent.identity_profile?.role ?? "Agent");
        return (
          <Link
            key={agent.id}
            href={`/agents/${agent.id}`}
            className="relative rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <div className="flex items-start justify-between">
              <div>
                <h4 className="font-heading text-base font-semibold text-slate-900">
                  {agent.name}
                </h4>
                <span
                  className={cn(
                    "mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-medium",
                    ROLE_COLORS[role] ?? "text-slate-600 bg-slate-50",
                  )}
                >
                  {role}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className={cn("h-2.5 w-2.5 rounded-full", STATUS_COLORS[status])} />
                <span className="text-xs text-slate-500">{STATUS_LABELS[status]}</span>
              </div>
            </div>
            {agent.is_board_lead && (
              <span className="absolute -right-1.5 -top-1.5 flex h-5 items-center rounded-full bg-blue-600 px-1.5 text-[10px] font-bold text-white">
                Lead
              </span>
            )}
          </Link>
        );
      })}
    </div>
  );
}
