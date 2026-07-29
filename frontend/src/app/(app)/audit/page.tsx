"use client";

import { useEffect, useMemo, useState } from "react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import TooltipUI from "@/components/ui/Tooltip";
import { getEvaluation, listEvaluations } from "@/services/evaluations";
import type { Evaluation } from "@/types/evaluation";
import TraceReplayFlow from "@/features/trace/TraceReplayFlow";

type PersistedPolicy = {
  graph?: { nodes: any[]; edges: any[] };
  compiled?: unknown;
};

function formatTs(ts: string): string {
  const d = new Date(ts);
  if (Number.isNaN(d.getTime())) return ts;
  return d.toLocaleString();
}

export default function AuditExplorerPage() {
  const [items, setItems] = useState<Evaluation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selected, setSelected] = useState<Evaluation | null>(null);
  const [selectedPolicy, setSelectedPolicy] = useState<null>(null);

  const [tab, setTab] = useState<"details" | "compiled" | "replay">("details");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const evs = await listEvaluations();
        if (cancelled) return;
        setItems(evs);
        if (!selectedId && evs.length > 0) setSelectedId(evs[0]!.id);
      } catch (e) {
        const msg =
          e instanceof Error ? e.message : "Failed to load evaluations";
        if (!cancelled) setError(msg);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function loadSelected() {
      if (!selectedId) {
        setSelected(null);
        setSelectedPolicy(null);
        return;
      }
      setError(null);
      try {
        const ev = await getEvaluation(selectedId);
        if (cancelled) return;
        setSelected(ev);
        if (!cancelled) setSelectedPolicy(null);
      } catch (e) {
        const msg =
          e instanceof Error ? e.message : "Failed to load evaluation";
        if (!cancelled) setError(msg);
      }
    }
    void loadSelected();
    return () => {
      cancelled = true;
    };
  }, [selectedId]);

  const snapshot = useMemo<PersistedPolicy | null>(() => {
    const s = (selected?.policySnapshot ?? null) as any;
    if (!s || typeof s !== "object") return null;
    return s as PersistedPolicy;
  }, [selected?.policySnapshot]);

  const canReplay = Boolean(snapshot?.graph && selected?.trace);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-lg font-semibold">Audit Explorer</h1>
          <p className="mt-1 text-sm text-slate-400">
            Browse historical evaluations and replay execution traces.
          </p>
        </div>
        <Button
          variant="secondary"
          onClick={() => {
            window.location.reload();
          }}
        >
          <TooltipUI
            content="Reloads evaluation history from the backend."
            side="top"
          >
            <span>Refresh</span>
          </TooltipUI>
        </Button>
      </div>

      {error ? (
        <Card title="Error">
          <div className="text-sm text-red-300">{error}</div>
        </Card>
      ) : null}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <Card title="Evaluations">
            {loading ? (
              <div className="text-sm text-slate-400">Loading…</div>
            ) : items.length === 0 ? (
              <div className="text-sm text-slate-400">No evaluations yet.</div>
            ) : (
              <div className="max-h-[calc(100vh-260px)] overflow-auto">
                <table className="w-full text-sm">
                  <thead className="text-left text-xs text-slate-400">
                    <tr>
                      <th className="py-2">
                        <TooltipUI
                          content="The policy name that was evaluated."
                          side="top"
                        >
                          <span>Policy</span>
                        </TooltipUI>
                      </th>
                      <th className="py-2">
                        <TooltipUI
                          content="The final decision for this evaluation."
                          side="top"
                        >
                          <span>Decision</span>
                        </TooltipUI>
                      </th>
                      <th className="py-2">
                        <TooltipUI
                          content="Backend time spent evaluating the policy."
                          side="top"
                        >
                          <span>Latency</span>
                        </TooltipUI>
                      </th>
                      <th className="py-2">
                        <TooltipUI
                          content="When the evaluation was created."
                          side="top"
                        >
                          <span>Time</span>
                        </TooltipUI>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="text-slate-200">
                    {items.map((e) => {
                      const active = e.id === selectedId;
                      return (
                        <tr
                          key={e.id}
                          className={
                            active ? "bg-slate-900/40" : "hover:bg-slate-900/20"
                          }
                          onClick={() => setSelectedId(e.id)}
                          style={{ cursor: "pointer" }}
                        >
                          <td className="py-2 pr-2">
                            <div className="truncate font-medium">
                              {e.policyName}
                            </div>
                            <div className="truncate text-xs text-slate-500">
                              {e.id}
                            </div>
                          </td>
                          <td
                            className={
                              e.decision === "APPROVE"
                                ? "py-2 text-emerald-300"
                                : "py-2 text-red-300"
                            }
                          >
                            {e.decision}
                          </td>
                          <td className="py-2 text-slate-400">
                            {e.latencyMs}ms
                          </td>
                          <td className="py-2 text-slate-400">
                            {formatTs(e.createdAt)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>

        <div className="lg:col-span-7">
          <Card>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="text-sm font-semibold text-slate-100">
                Evaluation
              </div>
              <div className="flex items-center gap-1 rounded-lg border border-slate-800 bg-slate-950/40 p-1">
                <button
                  className={[
                    "rounded-md px-2 py-1 text-xs font-medium",
                    tab === "details"
                      ? "bg-slate-800 text-slate-50"
                      : "text-slate-300 hover:bg-slate-900/40",
                  ].join(" ")}
                  onClick={() => setTab("details")}
                  type="button"
                >
                  Details
                </button>
                <button
                  className={[
                    "rounded-md px-2 py-1 text-xs font-medium",
                    tab === "compiled"
                      ? "bg-slate-800 text-slate-50"
                      : "text-slate-300 hover:bg-slate-900/40",
                  ].join(" ")}
                  onClick={() => setTab("compiled")}
                  type="button"
                >
                  Compiled
                </button>
                <button
                  className={[
                    "rounded-md px-2 py-1 text-xs font-medium",
                    tab === "replay"
                      ? "bg-slate-800 text-slate-50"
                      : "text-slate-300 hover:bg-slate-900/40",
                  ].join(" ")}
                  onClick={() => setTab("replay")}
                  type="button"
                >
                  Replay
                </button>
              </div>
            </div>

            <div className="mt-3 max-h-[calc(100vh-260px)] overflow-auto">
              {!selected ? (
                <div className="text-sm text-slate-400">
                  Select an evaluation.
                </div>
              ) : tab === "details" ? (
                <div className="space-y-2">
                  <div className="text-sm text-slate-100">
                    {selected.policyName}
                  </div>
                  <TooltipUI
                    content="Unique ID of the evaluation record."
                    side="top"
                  >
                    <div className="text-xs text-slate-500">
                      Evaluation: {selected.id}
                    </div>
                  </TooltipUI>
                  <TooltipUI
                    content="Version number of the policy at the time of evaluation."
                    side="top"
                  >
                    <div className="text-xs text-slate-500">
                      Policy version: v{selected.policyVersion}
                    </div>
                  </TooltipUI>
                  <TooltipUI
                    content="Human-readable explanation of the decision."
                    side="top"
                  >
                    <div className="text-xs text-slate-500">
                      Reason: {selected.reason}
                    </div>
                  </TooltipUI>
                </div>
              ) : tab === "compiled" ? (
                <div>
                  <div className="mb-2 text-xs font-medium uppercase tracking-wider text-slate-400">
                    <TooltipUI
                      content="The compiled policy logic captured at evaluation time. Useful for replay and debugging."
                      side="top"
                    >
                      <span>Snapshot</span>
                    </TooltipUI>
                  </div>
                  <pre className="overflow-auto rounded-md border border-slate-800 bg-slate-950 p-3 text-xs text-slate-200">
                    {JSON.stringify(snapshot?.compiled ?? null, null, 2)}
                  </pre>
                </div>
              ) : !canReplay ? (
                <div className="text-sm text-slate-400">
                  Missing `policySnapshot.graph` or `trace`.
                </div>
              ) : (
                <div>
                  <div className="mb-2 text-xs text-slate-400">
                    <TooltipUI
                      content="Animates the policy graph while stepping through the evaluation trace events."
                      side="top"
                    >
                      <span>
                        Hover nodes to understand the path taken during
                        evaluation.
                      </span>
                    </TooltipUI>
                  </div>
                  <TraceReplayFlow
                    graph={snapshot!.graph!}
                    trace={selected.trace}
                  />
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
