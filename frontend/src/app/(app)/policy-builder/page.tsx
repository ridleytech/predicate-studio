"use client";

import { useEffect, useMemo, useState } from "react";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import { APIError } from "@/services/apiClient";
import {
  createPolicy,
  deletePolicy,
  listPolicies,
  updatePolicy,
} from "@/services/policies";
import type { Policy } from "@/types/policy";
import PolicyFlow, {
  createDefaultPersistedPolicy,
} from "@/features/policy-builder/PolicyFlow";
import type { PersistedPolicy } from "@/features/policy-builder/types";
import { validatePolicyGraph } from "@/features/policy-builder/validatePolicyGraph";

function isPersistedPolicy(v: unknown): v is PersistedPolicy {
  if (!v || typeof v !== "object") return false;
  const o = v as Record<string, unknown>;
  return (
    o.schemaVersion === 1 &&
    typeof o.graph === "object" &&
    typeof o.compiled === "object"
  );
}

export default function PolicyBuilderPage() {
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const selected = useMemo(
    () => policies.find((p) => p.id === selectedId) ?? null,
    [policies, selectedId],
  );

  const [draftName, setDraftName] = useState("");
  const [draftPolicy, setDraftPolicy] = useState<PersistedPolicy | null>(null);

  async function refresh() {
    setLoading(true);
    setError(null);
    try {
      const items = await listPolicies();
      setPolicies(items);
      if (items.length > 0 && !selectedId) {
        setSelectedId(items[0].id);
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to load policies";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!selected) return;
    setDraftName(selected.name);

    if (isPersistedPolicy(selected.policy)) {
      setDraftPolicy(selected.policy);
      return;
    }

    setDraftPolicy(null);
  }, [selected]);

  async function onCreate() {
    setError(null);
    try {
      const p = await createPolicy({
        name: "New Policy",
        policy: createDefaultPersistedPolicy() as any,
      });
      setPolicies((prev) => [p, ...prev]);
      setSelectedId(p.id);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Create failed";
      setError(msg);
    }
  }

  async function onSave() {
    if (!selected) return;
    setError(null);

    if (!draftPolicy) {
      setError("Policy graph is not ready yet");
      return;
    }

    const issues = validatePolicyGraph(draftPolicy.graph);
    const hasError = issues.some((i) => i.level === "error");
    if (hasError) {
      setError("Fix validation errors before saving");
      return;
    }

    try {
      const updated = await updatePolicy(selected.id, {
        name: draftName,
        policy: draftPolicy as any,
      });
      setPolicies((prev) =>
        prev.map((p) => (p.id === updated.id ? updated : p)),
      );
    } catch (e) {
      const msg =
        e instanceof APIError
          ? e.message
          : e instanceof Error
            ? e.message
            : "Save failed";
      setError(msg);
    }
  }

  async function onDelete() {
    if (!selected) return;
    setError(null);
    try {
      await deletePolicy(selected.id);
      const next = policies.filter((p) => p.id !== selected.id);
      setPolicies(next);
      setSelectedId(next[0]?.id ?? null);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Delete failed";
      setError(msg);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-lg font-semibold">Policy Builder</h1>
          <p className="mt-1 text-sm text-slate-400">
            Phase 4: visual policy builder.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            onClick={() => void refresh()}
            disabled={loading}
          >
            Refresh
          </Button>
          <Button variant="primary" onClick={() => void onCreate()}>
            New Policy
          </Button>
        </div>
      </div>

      {error ? (
        <Card title="Error">
          <div className="text-sm text-red-300">{error}</div>
        </Card>
      ) : null}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-12">
        <div className="md:col-span-4">
          <Card title="Policies">
            {loading ? (
              <div className="text-sm text-slate-400">Loading…</div>
            ) : policies.length === 0 ? (
              <div className="text-sm text-slate-400">No policies yet.</div>
            ) : (
              <div className="space-y-1">
                {policies.map((p) => {
                  const active = p.id === selectedId;
                  return (
                    <button
                      key={p.id}
                      onClick={() => setSelectedId(p.id)}
                      className={[
                        "w-full rounded-md px-3 py-2 text-left text-sm",
                        active
                          ? "bg-slate-800 text-slate-50"
                          : "text-slate-300 hover:bg-slate-900",
                      ].join(" ")}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="truncate font-medium">{p.name}</div>
                        <div className="shrink-0 text-xs text-slate-500">
                          v{p.version}
                        </div>
                      </div>
                      <div className="mt-1 truncate text-xs text-slate-500">
                        {p.id}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </Card>

          <div className="mt-4">
            <Card title="Selected">
              {!selected ? (
                <div className="text-sm text-slate-400">
                  Select a policy to edit.
                </div>
              ) : (
                <div className="space-y-3">
                  <div>
                    <div className="mb-1 text-xs font-medium uppercase tracking-wider text-slate-400">
                      Name
                    </div>
                    <Input
                      value={draftName}
                      onChange={(e) => setDraftName(e.target.value)}
                    />
                  </div>

                  <div className="flex items-center justify-end gap-2">
                    <Button variant="danger" onClick={() => void onDelete()}>
                      Delete
                    </Button>
                    <Button variant="primary" onClick={() => void onSave()}>
                      Save
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          </div>
        </div>

        <div className="md:col-span-8">
          <Card title="Visual Builder">
            {!selected ? (
              <div className="text-sm text-slate-400">
                Select a policy to edit.
              </div>
            ) : (
              <PolicyFlow
                value={draftPolicy ?? undefined}
                onChange={(next) => {
                  setDraftPolicy(next);
                }}
              />
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
