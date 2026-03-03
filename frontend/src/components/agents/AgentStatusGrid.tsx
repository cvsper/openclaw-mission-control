"use client";

import { cn } from "@/lib/utils";

type AgentInfo = {
  name: string;
  role: string;
  status: "online" | "idle" | "offline";
  unread: number;
  lastSeen: string | null;
};

const AGENT_FAMILY: AgentInfo[] = [
  { name: "Dommo", role: "Architect", status: "online", unread: 0, lastSeen: null },
  { name: "Zim", role: "Orchestrator", status: "online", unread: 0, lastSeen: null },
  { name: "Zion", role: "Research", status: "idle", unread: 0, lastSeen: null },
  { name: "Banksy", role: "Creative", status: "idle", unread: 0, lastSeen: null },
  { name: "Vivi", role: "Operations", status: "idle", unread: 0, lastSeen: null },
  { name: "Neo", role: "Security", status: "idle", unread: 0, lastSeen: null },
];

const STATUS_COLORS = {
  online: "bg-emerald-500",
  idle: "bg-amber-400",
  offline: "bg-slate-300",
} as const;

const STATUS_LABELS = {
  online: "Online",
  idle: "Idle",
  offline: "Offline",
} as const;

const ROLE_COLORS: Record<string, string> = {
  Architect: "text-violet-600 bg-violet-50",
  Orchestrator: "text-blue-600 bg-blue-50",
  Research: "text-emerald-600 bg-emerald-50",
  Creative: "text-pink-600 bg-pink-50",
  Operations: "text-amber-600 bg-amber-50",
  Security: "text-red-600 bg-red-50",
};

export function AgentStatusGrid({ unreadCounts }: { unreadCounts?: Record<string, number> }) {
  const agents = AGENT_FAMILY.map((a) => ({
    ...a,
    unread: unreadCounts?.[a.name.toLowerCase()] ?? a.unread,
  }));

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
      {agents.map((agent) => (
        <div
          key={agent.name}
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
                  ROLE_COLORS[agent.role] ?? "text-slate-600 bg-slate-50",
                )}
              >
                {agent.role}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className={cn("h-2.5 w-2.5 rounded-full", STATUS_COLORS[agent.status])} />
              <span className="text-xs text-slate-500">{STATUS_LABELS[agent.status]}</span>
            </div>
          </div>
          {agent.unread > 0 && (
            <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-violet-600 px-1 text-[10px] font-bold text-white">
              {agent.unread}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}
