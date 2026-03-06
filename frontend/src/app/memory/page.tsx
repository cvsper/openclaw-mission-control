"use client";

import { useState } from "react";
import { SignedIn, SignedOut, useAuth } from "@/auth/clerk";
import { DashboardSidebar } from "@/components/organisms/DashboardSidebar";
import { DashboardShell } from "@/components/templates/DashboardShell";
import { SignedOutPanel } from "@/components/auth/SignedOutPanel";
import { useMemoryHealth, useMemorySearch } from "@/hooks/use-bridge-data";
import { cn } from "@/lib/utils";

export default function MemoryPage() {
  const { isSignedIn } = useAuth();
  const { data: health } = useMemoryHealth();
  const [query, setQuery] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const { data: results, isLoading: searching } = useMemorySearch(searchTerm);

  return (
    <DashboardShell>
      <SignedOut>
        <SignedOutPanel message="Sign in to access memory." forceRedirectUrl="/memory" />
      </SignedOut>
      <SignedIn>
        <DashboardSidebar />
        <main className="flex-1 overflow-y-auto bg-slate-50">
          <div className="border-b border-slate-200 bg-white px-8 py-6">
            <h2 className="font-heading text-2xl font-semibold text-slate-900 tracking-tight">
              Memory
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              ZimMemory health and search
            </p>
          </div>

          <div className="p-8 space-y-6">
            {/* Health card */}
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="font-heading text-base font-semibold text-slate-900">
                Health Status
              </h3>
              {health ? (
                <div className="mt-4 flex items-center gap-6">
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        "h-3 w-3 rounded-full",
                        health.status === "ok" || health.status === "healthy"
                          ? "bg-emerald-500"
                          : "bg-rose-500",
                      )}
                    />
                    <span className="text-sm font-medium text-slate-700 capitalize">
                      {health.status}
                    </span>
                  </div>
                  <div className="text-sm text-slate-500">
                    <span className="font-semibold text-slate-900">
                      {health.total_memories}
                    </span>{" "}
                    memories stored
                  </div>
                </div>
              ) : (
                <p className="mt-4 text-sm text-slate-500">
                  Unable to reach ZimMemory
                </p>
              )}
            </div>

            {/* Search */}
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="font-heading text-base font-semibold text-slate-900">
                Search Memories
              </h3>
              <form
                className="mt-4 flex gap-3"
                onSubmit={(e) => {
                  e.preventDefault();
                  setSearchTerm(query);
                }}
              >
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search ZimMemory..."
                  className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-100"
                />
                <button
                  type="submit"
                  className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-violet-700"
                >
                  Search
                </button>
              </form>

              {searching && (
                <p className="mt-4 text-sm text-slate-500">Searching...</p>
              )}
              {results && results.length > 0 && (
                <div className="mt-4 space-y-2">
                  {results.map((r, i) => (
                    <div
                      key={i}
                      className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700"
                    >
                      <p className="whitespace-pre-wrap">{r.content}</p>
                      <span className="mt-1 block text-xs text-slate-400">
                        Score: {r.score?.toFixed(3) ?? "N/A"}
                      </span>
                    </div>
                  ))}
                </div>
              )}
              {results && results.length === 0 && searchTerm && (
                <p className="mt-4 text-sm text-slate-500">No results found.</p>
              )}
            </div>
          </div>
        </main>
      </SignedIn>
    </DashboardShell>
  );
}
