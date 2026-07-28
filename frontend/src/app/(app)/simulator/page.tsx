"use client";

import { useEffect, useMemo, useState } from "react";
import Editor from "@monaco-editor/react";
import { ethers } from "ethers";

import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import TooltipUI from "@/components/ui/Tooltip";
import type { APIError } from "@/services/apiClient";
import { authorize } from "@/services/authorize";
import {
  getBrowserSigner,
  predicateProtectedActionAbi,
  toContractAuth,
} from "@/services/contract";
import { listPolicies } from "@/services/policies";
import { evaluatePolicy } from "@/services/simulator";
import type { Evaluation } from "@/types/evaluation";
import type { Policy } from "@/types/policy";
import type { AuthorizeResponse } from "@/types/authorization";
import { findDemoTemplateByName } from "@/features/demo/demoTemplates";

function safeStringify(v: unknown): string {
  return JSON.stringify(v, null, 2);
}

const defaultTx = {
  amount: 50,
  wallet: {
    address: "0xabc",
    kyc: true,
    country: "US",
    riskScore: 12,
  },
};

export default function PolicySimulatorPage() {
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [selectedPolicyId, setSelectedPolicyId] = useState<string>("");
  const [txText, setTxText] = useState<string>(safeStringify(defaultTx));
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Evaluation | null>(null);
  const [auth, setAuth] = useState<AuthorizeResponse | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const items = await listPolicies();
        if (cancelled) return;
        setPolicies(items);
        if (!selectedPolicyId && items.length > 0) {
          setSelectedPolicyId(items[0]!.id);
        }
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Failed to load policies";
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

  const selectedPolicy = useMemo(
    () => policies.find((p) => p.id === selectedPolicyId) ?? null,
    [policies, selectedPolicyId],
  );

  const selectedTemplate = useMemo(() => {
    if (!selectedPolicy) return null;
    return findDemoTemplateByName(
      "0x58f84dE7f427459Cc5A8aa7c86FA7650A9834724",
      selectedPolicy.name,
    );
  }, [selectedPolicy]);

  const curlExample = useMemo(() => {
    const body = {
      policyId: selectedPolicyId || "<POLICY_ID>",
      transaction: JSON.parse(txText || "{}"),
    };

    return `curl -sS -X POST http://127.0.0.1:8081/evaluate \\
  -H 'Content-Type: application/json' \\
  -d '${JSON.stringify(body).replace(/'/g, "'\\''")}'`;
  }, [selectedPolicyId, txText]);

  const tsExample = useMemo(() => {
    return `import { ethers } from 'ethers'

const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://127.0.0.1:8081'

const res = await fetch(apiBase + '/evaluate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    policyId: '${selectedPolicyId || "<POLICY_ID>"}',
    transaction: ${txText || "{}"}
  })
})

if (!res.ok) throw new Error(await res.text())
const evaluation = await res.json()
console.log(evaluation)`;
  }, [selectedPolicyId, txText]);

  const goExample = useMemo(() => {
    return `package main

import (
  "bytes"
  "encoding/json"
  "fmt"
  "net/http"
)

func main() {
  body := map[string]any{
    "policyId": "${selectedPolicyId || "<POLICY_ID>"}",
    "transaction": ${txText || "map[string]any{}"},
  }

  b, _ := json.Marshal(body)
  res, err := http.Post("http://127.0.0.1:8081/evaluate", "application/json", bytes.NewReader(b))
  if err != nil {
    panic(err)
  }
  defer res.Body.Close()
  fmt.Println(res.Status)
}`;
  }, [selectedPolicyId, txText]);

  async function onRun() {
    if (!selectedPolicyId) {
      setError("Select a policy first");
      return;
    }

    setError(null);
    setResult(null);
    setAuth(null);
    setTxHash(null);

    let tx: Record<string, unknown>;
    try {
      tx = (JSON.parse(txText || "{}") ?? {}) as Record<string, unknown>;
    } catch {
      setError("Transaction JSON is invalid");
      return;
    }

    setRunning(true);
    try {
      const evalRes = await evaluatePolicy({
        policyId: selectedPolicyId,
        transaction: tx,
      });
      setResult(evalRes);
    } catch (e) {
      const msg =
        e && typeof e === "object" && "message" in e
          ? String((e as APIError).message)
          : "Evaluation failed";
      setError(msg);
    } finally {
      setRunning(false);
    }
  }

  async function onGenerateAuth() {
    if (!result) {
      setError("Run a simulation first");
      return;
    }
    if (result.decision !== "APPROVE") {
      setError("Authorization can only be generated for APPROVE decisions");
      return;
    }

    setError(null);
    setAuth(null);
    setTxHash(null);

    try {
      const signer = await getBrowserSigner();
      const subject = await signer.getAddress();
      const out = await authorize({
        evaluationId: result.id,
        subject,
        ttlSeconds: 300,
      });
      setAuth(out);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Authorize failed";
      setError(msg);
    }
  }

  async function onExecute() {
    if (!auth) {
      setError("Generate an authorization first");
      return;
    }
    setError(null);

    try {
      const signer = await getBrowserSigner();
      const contract = new ethers.Contract(
        auth.authorization.contractAddress,
        predicateProtectedActionAbi,
        signer,
      );
      const tx = await contract.execute(
        toContractAuth(auth.authorization),
        auth.signature,
      );
      setTxHash(tx.hash);
      await tx.wait();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Execution failed";
      setError(msg);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold">Policy Simulator</h1>
        <p className="mt-1 text-sm text-slate-400">
          Run a transaction against a policy and inspect a full execution trace.
        </p>
      </div>

      {error ? (
        <Card title="Error">
          <div className="text-sm text-red-300">{error}</div>
        </Card>
      ) : null}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <div className="space-y-4 lg:col-span-4">
          <Card title="Policy">
            {loading ? (
              <div className="text-sm text-slate-400">Loading…</div>
            ) : (
              <div className="space-y-2">
                <div className="text-xs font-medium uppercase tracking-wider text-slate-400">
                  Selected
                </div>
                <select
                  value={selectedPolicyId}
                  onChange={(e) => setSelectedPolicyId(e.target.value)}
                  className="h-9 w-full rounded-md border border-slate-800 bg-slate-950 px-3 text-sm text-slate-100"
                >
                  {policies.length === 0 ? (
                    <option value="">No policies</option>
                  ) : null}
                  {policies.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
                {selectedPolicy ? (
                  <div className="text-xs text-slate-500">
                    {selectedPolicy.id}
                  </div>
                ) : null}
              </div>
            )}
          </Card>

          <Card title="Example Transactions">
            {!selectedTemplate ? (
              <div className="text-sm text-slate-400">
                Select a demo policy to load examples.
              </div>
            ) : (
              <div className="space-y-2">
                <div className="text-sm text-slate-400">
                  Load a known-good example to understand the inputs.
                </div>
                <div className="flex flex-wrap gap-2">
                  {selectedTemplate.examples.map((ex) => (
                    <Button
                      key={ex.label}
                      variant="secondary"
                      onClick={() => {
                        setTxText(safeStringify(ex.tx));
                        setError(null);
                        setResult(null);
                        setAuth(null);
                        setTxHash(null);
                      }}
                    >
                      {ex.label}
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </Card>

          <Card title="Actions">
            <div className="flex items-center gap-2">
              <TooltipUI
                content="Sends the transaction JSON to the backend for evaluation. You'll get a decision and a full trace."
                side="top"
              >
                <span>
                  <Button
                    variant="primary"
                    onClick={() => void onRun()}
                    disabled={running || loading || !selectedPolicyId}
                  >
                    {running ? "Running…" : "Run Simulation"}
                  </Button>
                </span>
              </TooltipUI>

              <TooltipUI
                content="Requests a backend-signed authorization for an APPROVE evaluation. The contract will verify this signature."
                side="top"
              >
                <span>
                  <Button
                    variant="secondary"
                    onClick={() => void onGenerateAuth()}
                    disabled={!result || result.decision !== "APPROVE"}
                  >
                    Generate Auth
                  </Button>
                </span>
              </TooltipUI>

              <TooltipUI
                content="Calls the smart contract using your wallet (MetaMask) and submits the signed authorization on-chain."
                side="top"
              >
                <span>
                  <Button
                    variant="secondary"
                    onClick={() => void onExecute()}
                    disabled={!auth}
                  >
                    Execute On-Chain
                  </Button>
                </span>
              </TooltipUI>
            </div>
            <div className="mt-2 text-xs text-slate-500">
              Phase 7: Generate an authorization then execute via MetaMask.
            </div>
          </Card>

          <Card title="Result">
            {!result ? (
              <div className="text-sm text-slate-400">
                Run a simulation to see results.
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <TooltipUI
                    content="APPROVE means the policy allowed the transaction. DENY means it was blocked by a rule or validation."
                    side="top"
                  >
                    <span className="text-xs font-medium uppercase tracking-wider text-slate-400">
                      Decision
                    </span>
                  </TooltipUI>
                  <div
                    className={
                      result.decision === "APPROVE"
                        ? "text-sm text-emerald-300"
                        : "text-sm text-red-300"
                    }
                  >
                    {result.decision}
                  </div>
                </div>
                <TooltipUI
                  content="A short human-readable explanation of the final decision."
                  side="top"
                >
                  <div className="text-xs text-slate-500">{result.reason}</div>
                </TooltipUI>
                <TooltipUI
                  content="Time spent in the backend evaluation engine. Useful for performance tracking."
                  side="top"
                >
                  <div className="text-xs text-slate-500">
                    Latency: {result.latencyMs} ms
                  </div>
                </TooltipUI>
              </div>
            )}
          </Card>

          <Card title="Authorization">
            {!auth ? (
              <div className="text-sm text-slate-400">
                Generate authorization after an approved evaluation.
              </div>
            ) : (
              <div className="space-y-2">
                <div className="text-xs text-slate-500">Signature</div>
                <pre className="overflow-auto rounded-md border border-slate-800 bg-slate-950 p-2 text-xs text-slate-200">
                  {auth.signature}
                </pre>
                <div className="text-xs text-slate-500">Payload</div>
                <pre className="overflow-auto rounded-md border border-slate-800 bg-slate-950 p-2 text-xs text-slate-200">
                  {JSON.stringify(auth.authorization, null, 2)}
                </pre>
                {txHash ? (
                  <div className="pt-2 text-xs text-slate-300">
                    Tx: {txHash}
                  </div>
                ) : null}
              </div>
            )}
          </Card>
        </div>

        <div className="space-y-4 lg:col-span-8">
          <Card title="Transaction JSON">
            <div className="h-[420px] overflow-hidden rounded-lg border border-slate-800">
              <Editor
                height="420px"
                defaultLanguage="json"
                theme="vs-dark"
                value={txText}
                onChange={(v) => setTxText(v ?? "")}
                options={{
                  minimap: { enabled: false },
                  fontSize: 12,
                  scrollBeyondLastLine: false,
                }}
              />
            </div>
          </Card>

          <Card title="Execution Trace">
            {!result ? (
              <div className="text-sm text-slate-400">—</div>
            ) : result.trace.length === 0 ? (
              <div className="text-sm text-slate-400">No trace events.</div>
            ) : (
              <div className="space-y-2">
                {result.trace.map((t, idx) => (
                  <div
                    key={idx}
                    className="flex items-start justify-between gap-3 rounded-md border border-slate-800 bg-slate-950/40 px-3 py-2"
                  >
                    <div className="min-w-0">
                      <div className="text-sm text-slate-100">
                        {t.type}
                        {t.key ? `: ${t.key}` : ""}
                      </div>
                      <div className="mt-0.5 text-xs text-slate-400">
                        {t.message}
                      </div>
                    </div>
                    <div
                      className={
                        t.outcome === "PASS"
                          ? "text-xs text-emerald-300"
                          : "text-xs text-red-300"
                      }
                    >
                      {t.outcome}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card title="SDK Examples">
            <div className="space-y-4">
              <ExampleBlock title="cURL" code={curlExample} />
              <ExampleBlock title="TypeScript" code={tsExample} />
              <ExampleBlock title="Go" code={goExample} />
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

function ExampleBlock({ title, code }: { title: string; code: string }) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <div className="text-xs font-medium uppercase tracking-wider text-slate-400">
          {title}
        </div>
        <button
          onClick={() => navigator.clipboard.writeText(code)}
          className="text-xs text-slate-300 hover:text-slate-50"
        >
          Copy
        </button>
      </div>
      <pre className="overflow-auto rounded-md border border-slate-800 bg-slate-950 p-3 text-xs text-slate-200">
        {code}
      </pre>
    </div>
  );
}
