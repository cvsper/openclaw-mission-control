"use client";

import { useMemo, useState } from "react";
import { SignedIn, SignedOut, useAuth } from "@/auth/clerk";
import { DashboardSidebar } from "@/components/organisms/DashboardSidebar";
import { DashboardShell } from "@/components/templates/DashboardShell";
import { SignedOutPanel } from "@/components/auth/SignedOutPanel";
import { useAgentMessages } from "@/hooks/use-bridge-data";
import { ApiError } from "@/api/mutator";
import {
  type listAgentsApiV1AgentsGetResponse,
  useListAgentsApiV1AgentsGet,
} from "@/api/generated/agents/agents";
import { Send } from "lucide-react";
import { cn } from "@/lib/utils";

export default function MessagesPage() {
  const { isSignedIn } = useAuth();
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const [composerText, setComposerText] = useState("");
  const [sending, setSending] = useState(false);

  const agentsQuery = useListAgentsApiV1AgentsGet<
    listAgentsApiV1AgentsGetResponse,
    ApiError
  >(
    { limit: 50 },
    {
      query: {
        enabled: Boolean(isSignedIn),
        refetchInterval: 30_000,
        refetchOnMount: "always",
      },
    },
  );

  const agents = useMemo(
    () =>
      agentsQuery.data?.status === 200
        ? (agentsQuery.data.data.items ?? [])
        : [],
    [agentsQuery.data],
  );

  const selectedAgent = useMemo(
    () => agents.find((a) => a.id === selectedAgentId) ?? agents[0] ?? null,
    [agents, selectedAgentId],
  );
  const effectiveAgentId = selectedAgent?.id ?? null;
  const agentNameLower = selectedAgent?.name?.toLowerCase() ?? null;
  const { data: messages, isLoading, refetch } = useAgentMessages(agentNameLower);

  const handleSend = async () => {
    if (!composerText.trim() || !agentNameLower) return;
    setSending(true);
    try {
      const token = localStorage.getItem("nexus_local_auth_token") ?? "";
      const baseUrl =
        process.env.NEXT_PUBLIC_API_URL === "auto"
          ? `${window.location.protocol}//${window.location.hostname}:8100`
          : process.env.NEXT_PUBLIC_API_URL || "";
      await fetch(`${baseUrl}/api/v1/bridge/messages/send`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          from_agent: "dommo",
          to_agent: agentNameLower,
          message: composerText.trim(),
        }),
      });
      setComposerText("");
      refetch();
    } finally {
      setSending(false);
    }
  };

  return (
    <DashboardShell>
      <SignedOut>
        <SignedOutPanel message="Sign in to access messages." forceRedirectUrl="/messages" />
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
              {agentsQuery.isLoading && agents.length === 0 && (
                <p className="px-3 py-2 text-xs text-slate-400">Loading...</p>
              )}
              {agents.map((agent) => {
                const role = String(agent.identity_profile?.role ?? "Agent");
                return (
                  <button
                    key={agent.id}
                    type="button"
                    onClick={() => setSelectedAgentId(agent.id)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition",
                      effectiveAgentId === agent.id
                        ? "bg-violet-100 text-violet-800 font-medium"
                        : "text-slate-700 hover:bg-slate-100",
                    )}
                  >
                    <span className="font-medium">{agent.name}</span>
                    <span className="text-xs text-slate-400">{role}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Message area */}
          <div className="flex flex-1 flex-col bg-slate-50">
            <div className="border-b border-slate-200 bg-white px-6 py-3">
              <h2 className="font-heading text-lg font-semibold text-slate-900">
                {selectedAgent ? selectedAgent.name : "Select an agent"}
              </h2>
              {selectedAgent?.identity_profile?.role ? (
                <p className="text-xs text-slate-500">
                  {String(selectedAgent.identity_profile.role)}
                </p>
              ) : null}
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

            {/* Composer */}
            {selectedAgent && (
              <div className="border-t border-slate-200 bg-white p-4">
                <form
                  className="flex gap-3"
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSend();
                  }}
                >
                  <input
                    type="text"
                    value={composerText}
                    onChange={(e) => setComposerText(e.target.value)}
                    placeholder={`Message ${selectedAgent.name}...`}
                    className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-100"
                    disabled={sending}
                  />
                  <button
                    type="submit"
                    disabled={sending || !composerText.trim()}
                    className="inline-flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-violet-700 disabled:opacity-50"
                  >
                    <Send className="h-4 w-4" />
                    Send
                  </button>
                </form>
              </div>
            )}
          </div>
        </main>
      </SignedIn>
    </DashboardShell>
  );
}
