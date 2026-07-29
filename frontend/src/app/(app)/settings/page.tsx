"use client";

import { useEffect, useMemo, useState } from "react";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import TooltipUI from "@/components/ui/Tooltip";

type Health = {
  ok: boolean;
  status: number;
  error?: string;
};

function normalizeUrl(v: string): string {
  return v.trim().replace(/\/$/, "");
}

export default function SettingsPage() {
  const envApiBase = useMemo(
    () => process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:8081",
    [],
  );

  const [apiOverride, setApiOverride] = useState<string>("");
  const [health, setHealth] = useState<Health>({ ok: false, status: 0 });
  const [hasWallet, setHasWallet] = useState<boolean>(false);

  const effectiveApiBase = useMemo(() => {
    const v = apiOverride.trim();
    return v ? normalizeUrl(v) : normalizeUrl(envApiBase);
  }, [apiOverride, envApiBase]);

  useEffect(() => {
    try {
      const cur = window.localStorage.getItem("pds_api_base_url") ?? "";
      setApiOverride(cur);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      try {
        const res = await fetch(`${effectiveApiBase}/health`);
        if (cancelled) return;
        setHealth({ ok: res.ok, status: res.status });
      } catch (e) {
        if (cancelled) return;
        const msg = e instanceof Error ? e.message : "Health check failed";
        setHealth({ ok: false, status: 0, error: msg });
      }
    }
    void run();
    return () => {
      cancelled = true;
    };
  }, [effectiveApiBase]);

  useEffect(() => {
    setHasWallet(Boolean((window as any).ethereum));
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-lg font-semibold">Settings</h1>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <div className="space-y-4 lg:col-span-6">
          <Card title="Environment Status">
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between gap-3">
                <TooltipUI
                  content="Base URL used by the frontend to call the Go API. You can override it below."
                  side="top"
                >
                  <span className="text-slate-400">API base URL</span>
                </TooltipUI>
                <span className="truncate text-slate-100">
                  {effectiveApiBase}
                </span>
              </div>

              <div className="flex items-center justify-between gap-3">
                <TooltipUI content="Live check against GET /health" side="top">
                  <span className="text-slate-400">API health</span>
                </TooltipUI>
                <span
                  className={
                    health.ok
                      ? "text-emerald-300"
                      : health.status
                        ? "text-red-300"
                        : "text-slate-400"
                  }
                >
                  {health.ok
                    ? `OK (${health.status})`
                    : health.error
                      ? `Error (${health.error})`
                      : health.status
                        ? `Not OK (${health.status})`
                        : "Unavailable"}
                </span>
              </div>

              <div className="flex items-center justify-between gap-3">
                <TooltipUI
                  content="Whether a browser wallet is available (MetaMask, etc.)."
                  side="top"
                >
                  <span className="text-slate-400">Wallet detected</span>
                </TooltipUI>
                <span
                  className={hasWallet ? "text-emerald-300" : "text-slate-400"}
                >
                  {hasWallet ? "Yes" : "No"}
                </span>
              </div>

              <div className="rounded-md border border-slate-800 bg-slate-950/40 p-3 text-xs text-slate-400">
                Frontend env:{" "}
                <span className="text-slate-200">NEXT_PUBLIC_API_BASE_URL</span>{" "}
                {process.env.NEXT_PUBLIC_API_BASE_URL ? (
                  <span className="text-slate-200">(set)</span>
                ) : (
                  <span>(not set)</span>
                )}
              </div>
            </div>
          </Card>

          <Card title="Configuration">
            <div className="space-y-2">
              <TooltipUI
                content="Overrides the API base URL at runtime (stored in localStorage as pds_api_base_url)."
                side="top"
              >
                <div className="text-xs font-medium uppercase tracking-wider text-slate-400">
                  API base URL override
                </div>
              </TooltipUI>
              <Input
                value={apiOverride}
                onChange={(e) => setApiOverride(e.target.value)}
                placeholder={envApiBase}
              />
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  variant="secondary"
                  onClick={() => {
                    try {
                      const v = apiOverride.trim();
                      if (!v) {
                        window.localStorage.removeItem("pds_api_base_url");
                        setApiOverride("");
                      } else {
                        window.localStorage.setItem(
                          "pds_api_base_url",
                          normalizeUrl(v),
                        );
                        setApiOverride(normalizeUrl(v));
                      }
                    } catch {
                      // ignore
                    }
                  }}
                >
                  Save
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => {
                    try {
                      window.localStorage.removeItem("pds_api_base_url");
                      setApiOverride("");
                    } catch {
                      // ignore
                    }
                  }}
                >
                  Clear
                </Button>
                <div className="text-xs text-slate-400">
                  Refresh other pages after changing this.
                </div>
              </div>
            </div>
          </Card>
        </div>

        <div className="space-y-4 lg:col-span-6">
          <Card title="Demo Controls">
            <div className="space-y-3">
              <TooltipUI
                content="Shows the onboarding modal again on next visit."
                side="top"
              >
                <span className="text-sm text-slate-400">Onboarding</span>
              </TooltipUI>
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  variant="secondary"
                  onClick={() => {
                    try {
                      window.localStorage.setItem(
                        "pds_onboarding_v1_completed",
                        "false",
                      );
                      window.location.reload();
                    } catch {
                      // ignore
                    }
                  }}
                >
                  Reset onboarding
                </Button>
              </div>

              <div className="rounded-md border border-slate-800 bg-slate-950/40 p-3">
                <div className="text-sm text-slate-200">Seed demo data</div>
                <div className="mt-1 text-xs text-slate-400">
                  Run this from the repo root to populate policies/evaluations
                  for screenshots:
                </div>
                <pre className="mt-2 overflow-auto rounded-md border border-slate-800 bg-slate-950 p-2 text-xs text-slate-200">
                  node web/scripts/seed-demo.mjs
                </pre>
              </div>

              <div className="rounded-md border border-slate-800 bg-slate-950/40 p-3">
                <div className="text-sm text-slate-200">
                  Generate screenshots
                </div>
                <div className="mt-1 text-xs text-slate-400">
                  From <span className="text-slate-200">web/frontend</span>:
                </div>
                <pre className="mt-2 overflow-auto rounded-md border border-slate-800 bg-slate-950 p-2 text-xs text-slate-200">
                  SEED_DEMO_DATA=false npm run screenshots
                </pre>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
