"use client";

import { useState } from "react";
import { SignedIn, SignedOut, useAuth } from "@/auth/clerk";
import { DashboardSidebar } from "@/components/organisms/DashboardSidebar";
import { DashboardShell } from "@/components/templates/DashboardShell";
import { SignedOutPanel } from "@/components/auth/SignedOutPanel";
import { useAgentMessages } from "@/hooks/use-bridge-data";
import { cn } from "@/lib/utils";

const AGENTS = [
  { id: "dommo", name: "Dommo", role: "Architect" },
  { id: "zim", name: "Zim", role: "Orchestrator" },
  { id: "zion", name: "Zion", role: "Research" },
  { id: "banksy", name: "Banksy", role: "Creative" },
  { id: "vivi", name: "Vivi", role: "Operations" },
  { id: "neo", name: "Neo", role: "Security" },
];

export default function MessagesPage() {
  const { isSignedIn } = useAuth();
  const [selectedAgent, setSelectedAgent] = useState<string | null>("dommo");
  const { data: messages, isLoading } = useAgentMessages(selectedAgent);

  return (
    <DashboardShell>
      <SignedOut>
        <SignedOutPanel message="Sign in to access messages." />
      </SignedOut>
      <SignedIn>
        <DashboardSidebar />
        <main className="flex flex-1 overflow-hidden">
          {/* Agent list */}
          <div className="w-56 shrink-0 border-r border-slate-200 bg-white">
            <div className="border-b border-slate-200 px-4 py-3">
              <h3 className="font-heading text-sm font-semibold text-slate-900">
                Agents
              </h3>
            </div>
            <div className="space-y-0.5 p-2">
              {AGENTS.map((agent) => (
                <button
                  key={agent.id}
                  type="button"
                  onClick={() => setSelectedAgent(agent.id)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition",
                    selectedAgent === agent.id
                      ? "bg-violet-100 text-violet-800 font-medium"
                      : "text-slate-700 hover:bg-slate-100",
                  )}
                >
                  <span className="font-medium">{agent.name}</span>
                  <span className="text-xs text-slate-400">{agent.role}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Message area */}
          <div className="flex flex-1 flex-col bg-slate-50">
            <div className="border-b border-slate-200 bg-white px-6 py-3">
              <h2 className="font-heading text-lg font-semibold text-slate-900">
                {selectedAgent
                  ? AGENTS.find((a) => a.id === selectedAgent)?.name ?? "Messages"
                  : "Select an agent"}
              </h2>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              {isLoading && (
                <p className="text-sm text-slate-500">Loading messages...</p>
              )}
              {!isLoading && messages && messages.length === 0 && (
                <p className="text-sm text-slate-500">No messages yet.</p>
              )}
              {messages && messages.length > 0 && (
                <div className="space-y-3">
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={cn(
                        "rounded-lg border p-4 text-sm",
                        msg.read
                          ? "border-slate-200 bg-white"
                          : "border-violet-200 bg-violet-50",
                      )}
                    >
                      <div className="flex items-center justify-between text-xs text-slate-500">
                        <span className="font-medium text-slate-700">
                          {msg.from_agent}
                        </span>
                        <span>{msg.timestamp}</span>
                      </div>
                      <p className="mt-1.5 text-slate-700 whitespace-pre-wrap">
                        {msg.message}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </main>
      </SignedIn>
    </DashboardShell>
  );
}
