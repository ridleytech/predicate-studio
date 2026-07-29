"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import ReactFlow, {
  addEdge,
  Background,
  Controls,
  MiniMap,
  type Connection,
  type Edge,
  type Node,
  type NodeTypes,
  useEdgesState,
  useNodesState,
} from "reactflow";

import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import Tooltip from "@/components/ui/Tooltip";

import { compilePolicy } from "./compilePolicy";
import type {
  ConditionType,
  LogicType,
  PersistedPolicy,
  PolicyGraph,
  PolicyNode,
  PolicyNodeData,
  ResultDecision,
} from "./types";
import { validatePolicyGraph } from "./validatePolicyGraph";

import ConditionNode from "./nodes/ConditionNode";
import LogicNode from "./nodes/LogicNode";
import ResultNode from "./nodes/ResultNode";
import TriggerNode from "./nodes/TriggerNode";

const nodeTypes: NodeTypes = {
  trigger: TriggerNode,
  condition: ConditionNode,
  logic: LogicNode,
  result: ResultNode,
};

function newId(prefix: string): string {
  return `${prefix}_${Math.random().toString(16).slice(2)}${Date.now().toString(16)}`;
}

function initialGraph(): PolicyGraph {
  const triggerId = newId("trigger");
  const approveId = newId("result");

  const nodes: PolicyNode[] = [
    {
      id: triggerId,
      type: "trigger",
      position: { x: 80, y: 120 },
      data: { kind: "trigger", label: "Transaction Trigger" },
    },
    {
      id: approveId,
      type: "result",
      position: { x: 520, y: 120 },
      data: { kind: "result", label: "Result", decision: "APPROVE" },
    },
  ];

  const edges: Edge[] = [
    {
      id: newId("edge"),
      source: triggerId,
      target: approveId,
    },
  ];

  return { nodes, edges };
}

export function createDefaultPersistedPolicy(): PersistedPolicy {
  const graph = initialGraph();
  return {
    schemaVersion: 1,
    graph,
    compiled: compilePolicy(graph),
  };
}

type Props = {
  value?: PersistedPolicy;
  onChange?: (next: PersistedPolicy) => void;
};

export default function PolicyFlow({ value, onChange }: Props) {
  const seed = value?.graph ?? initialGraph();

  const [nodes, setNodes, onNodesChange] = useNodesState(seed.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(seed.edges);

  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selectedNode = useMemo(
    () => nodes.find((n) => n.id === selectedId) ?? null,
    [nodes, selectedId],
  );
  const issues = useMemo(
    () => validatePolicyGraph({ nodes: nodes as PolicyNode[], edges }),
    [nodes, edges],
  );

  const compiled = useMemo(() => {
    try {
      return compilePolicy({ nodes: nodes as PolicyNode[], edges });
    } catch {
      return null;
    }
  }, [nodes, edges]);

  const persisted: PersistedPolicy | null = useMemo(() => {
    if (!compiled) return null;
    return {
      schemaVersion: 1,
      graph: { nodes: nodes as PolicyNode[], edges },
      compiled,
    };
  }, [compiled, edges, nodes]);

  useEffect(() => {
    if (!persisted) return;
    onChange?.(persisted);
  }, [onChange, persisted]);

  const onConnect = useCallback(
    (connection: Connection) => {
      setEdges((eds) => addEdge({ ...connection, id: newId("edge") }, eds));
    },
    [setEdges],
  );

  const onSelectionChange = useCallback((sel: { nodes?: Node[] }) => {
    const id = sel.nodes?.[0]?.id;
    setSelectedId(id ?? null);
  }, []);

  const addCondition = useCallback(
    (conditionType: ConditionType) => {
      const id = newId("cond");
      const node: PolicyNode = {
        id,
        type: "condition",
        position: { x: 280, y: 80 + nodes.length * 20 },
        data: {
          kind: "condition",
          label: "Condition",
          conditionType,
          params: {},
        },
      };
      setNodes((ns) => ns.concat(node));
    },
    [nodes.length, setNodes],
  );

  const addLogic = useCallback(
    (logicType: LogicType) => {
      const id = newId("logic");
      const node: PolicyNode = {
        id,
        type: "logic",
        position: { x: 280, y: 80 + nodes.length * 20 },
        data: {
          kind: "logic",
          label: "Logic",
          logicType,
        },
      };
      setNodes((ns) => ns.concat(node));
    },
    [nodes.length, setNodes],
  );

  const addResult = useCallback(
    (decision: ResultDecision) => {
      const id = newId("result");
      const node: PolicyNode = {
        id,
        type: "result",
        position: { x: 560, y: 80 + nodes.length * 20 },
        data: {
          kind: "result",
          label: "Result",
          decision,
        },
      };
      setNodes((ns) => ns.concat(node));
    },
    [nodes.length, setNodes],
  );

  const duplicateSelected = useCallback(() => {
    if (!selectedNode) return;
    const id = newId("dup");
    const node: PolicyNode = {
      ...(selectedNode as PolicyNode),
      id,
      position: {
        x: selectedNode.position.x + 40,
        y: selectedNode.position.y + 40,
      },
      selected: false,
    };
    setNodes((ns) => ns.concat(node));
  }, [selectedNode, setNodes]);

  const deleteSelected = useCallback(() => {
    if (!selectedId) return;
    setNodes((ns) => ns.filter((n) => n.id !== selectedId));
    setEdges((es) =>
      es.filter((e) => e.source !== selectedId && e.target !== selectedId),
    );
    setSelectedId(null);
  }, [selectedId, setEdges, setNodes]);

  const updateSelected = useCallback(
    (nextData: PolicyNodeData) => {
      if (!selectedId) return;
      setNodes((ns) =>
        ns.map((n) => (n.id === selectedId ? { ...n, data: nextData } : n)),
      );
    },
    [selectedId, setNodes],
  );

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
      <div className="space-y-4 lg:col-span-3">
        <Card title="Palette">
          <div className="space-y-4">
            <div>
              <div className="mb-2 text-xs font-medium uppercase tracking-wider text-slate-400">
                Conditions
              </div>
              <div className="grid grid-cols-1 gap-3">
                <Tooltip
                  content="Checks transaction.wallet.kyc. If false, the policy will deny (in an AND chain)."
                  side="top"
                >
                  <span className="w-full">
                    <Button
                      onClick={() => addCondition("wallet_kyc")}
                      className="h-10 w-full"
                    >
                      Wallet KYC
                    </Button>
                  </span>
                </Tooltip>

                <Tooltip
                  content="Checks transaction.wallet.country equals the configured country (e.g. US)."
                  side="top"
                >
                  <span className="w-full">
                    <Button
                      onClick={() => addCondition("country")}
                      className="h-10 w-full"
                    >
                      Country
                    </Button>
                  </span>
                </Tooltip>

                <Tooltip
                  content="Checks transaction.wallet.riskScore is less than or equal to a max threshold."
                  side="top"
                >
                  <span className="w-full">
                    <Button
                      onClick={() => addCondition("risk_score")}
                      className="h-10 w-full"
                    >
                      Risk Score
                    </Button>
                  </span>
                </Tooltip>

                <Tooltip
                  content="Checks transaction.amount is less than or equal to a max value."
                  side="top"
                >
                  <span className="w-full">
                    <Button
                      onClick={() => addCondition("max_amount")}
                      className="h-10 w-full"
                    >
                      Max Amount
                    </Button>
                  </span>
                </Tooltip>

                <Tooltip
                  content="Approves only if transaction.wallet.address is in the configured allow-list."
                  side="top"
                >
                  <span className="w-full">
                    <Button
                      onClick={() => addCondition("wallet_allow_list")}
                      className="h-10 w-full"
                    >
                      Wallet Allow List
                    </Button>
                  </span>
                </Tooltip>

                <Tooltip
                  content="Denies if transaction.wallet.address is in the configured deny-list."
                  side="top"
                >
                  <span className="w-full">
                    <Button
                      onClick={() => addCondition("wallet_deny_list")}
                      className="h-10 w-full"
                    >
                      Wallet Deny List
                    </Button>
                  </span>
                </Tooltip>
              </div>
            </div>

            <div>
              <div className="mb-2 text-xs font-medium uppercase tracking-wider text-slate-400">
                Logic
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Tooltip
                  content="AND means every connected branch must pass for the policy to approve."
                  side="top"
                >
                  <span className="w-full">
                    <Button
                      onClick={() => addLogic("and")}
                      className="h-10 w-full"
                    >
                      AND
                    </Button>
                  </span>
                </Tooltip>
                <Tooltip
                  content="OR means any connected branch can approve the policy."
                  side="top"
                >
                  <span className="w-full">
                    <Button
                      onClick={() => addLogic("or")}
                      className="h-10 w-full"
                    >
                      OR
                    </Button>
                  </span>
                </Tooltip>
              </div>
            </div>

            <div>
              <div className="mb-2 text-xs font-medium uppercase tracking-wider text-slate-400">
                Result
              </div>
              <div className="flex flex-col gap-3">
                <Tooltip
                  content="Final decision node: approves the transaction if reached."
                  side="top"
                >
                  <span className="w-full">
                    <Button
                      onClick={() => addResult("APPROVE")}
                      variant="primary"
                      className="h-10 w-full px-4"
                    >
                      Approve
                    </Button>
                  </span>
                </Tooltip>
                <Tooltip
                  content="Final decision node: denies the transaction if reached."
                  side="top"
                >
                  <span className="w-full">
                    <Button
                      onClick={() => addResult("DENY")}
                      variant="danger"
                      className="h-10 w-full px-4"
                    >
                      Deny
                    </Button>
                  </span>
                </Tooltip>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Button
                onClick={duplicateSelected}
                disabled={!selectedNode}
                className="h-10 w-full"
              >
                Duplicate
              </Button>
              <Button
                onClick={deleteSelected}
                disabled={!selectedNode}
                variant="danger"
                className="h-10 w-full"
              >
                Delete
              </Button>
            </div>

            <Button
              onClick={() => {
                if (!persisted) return;
                navigator.clipboard.writeText(
                  JSON.stringify(persisted, null, 2),
                );
              }}
              disabled={!persisted}
              variant="secondary"
              className="h-10 w-full"
            >
              Copy JSON
            </Button>
          </div>
        </Card>

        <Card title="Validation">
          {issues.length === 0 ? (
            <div className="text-sm text-emerald-300">Valid</div>
          ) : (
            <div className="space-y-2">
              {issues.map((i, idx) => (
                <div
                  key={idx}
                  className={
                    i.level === "error"
                      ? "text-sm text-red-300"
                      : "text-sm text-amber-300"
                  }
                >
                  {i.message}
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card title="Compiled">
          <pre className="overflow-auto rounded-md border border-slate-800 bg-slate-950 p-2 text-xs text-slate-200">
            {compiled ? JSON.stringify(compiled, null, 2) : "—"}
          </pre>
        </Card>
      </div>

      <div className="lg:col-span-6">
        <Card title="Graph">
          <div className="h-[640px] rounded-lg border border-slate-800 overflow-hidden">
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={(ch) => {
                onNodesChange(ch);
              }}
              onEdgesChange={(ch) => {
                onEdgesChange(ch);
              }}
              onConnect={onConnect}
              onSelectionChange={onSelectionChange}
              nodeTypes={nodeTypes}
              fitView
            >
              <Background gap={16} size={1} color="#1f2937" />
              <Controls />
              <MiniMap />
            </ReactFlow>
          </div>
        </Card>
      </div>

      <div className="space-y-4 lg:col-span-3">
        <Card title="Inspector">
          {!selectedNode ? (
            <div className="text-sm text-slate-400">Select a node to edit.</div>
          ) : (
            <Inspector
              node={selectedNode as PolicyNode}
              onChange={updateSelected}
            />
          )}
        </Card>
      </div>
    </div>
  );
}

function Inspector({
  node,
  onChange,
}: {
  node: PolicyNode;
  onChange: (d: PolicyNodeData) => void;
}) {
  const data = node.data as PolicyNodeData;

  if (data.kind === "trigger") {
    return (
      <div className="space-y-2">
        <div className="text-xs font-medium uppercase tracking-wider text-slate-400">
          Label
        </div>
        <Input
          value={data.label}
          onChange={(e) => onChange({ ...data, label: e.target.value })}
        />
      </div>
    );
  }

  if (data.kind === "logic") {
    return (
      <div className="space-y-2">
        <div className="text-xs font-medium uppercase tracking-wider text-slate-400">
          Logic
        </div>
        <div className="text-sm text-slate-200">
          {data.logicType.toUpperCase()}
        </div>
      </div>
    );
  }

  if (data.kind === "result") {
    return (
      <div className="space-y-2">
        <div className="text-xs font-medium uppercase tracking-wider text-slate-400">
          Decision
        </div>
        <div className="text-sm text-slate-200">{data.decision}</div>
      </div>
    );
  }

  // condition
  const paramsText = JSON.stringify(data.params ?? {}, null, 2);

  return (
    <div className="space-y-3">
      <div>
        <div className="mb-1 text-xs font-medium uppercase tracking-wider text-slate-400">
          Label
        </div>
        <Input
          value={data.label}
          onChange={(e) => onChange({ ...data, label: e.target.value })}
        />
      </div>

      <div>
        <div className="mb-1 text-xs font-medium uppercase tracking-wider text-slate-400">
          Type
        </div>
        <div className="text-sm text-slate-200">{data.conditionType}</div>
      </div>

      <div>
        <div className="mb-1 text-xs font-medium uppercase tracking-wider text-slate-400">
          Params (JSON)
        </div>
        <textarea
          value={paramsText}
          onChange={(e) => {
            try {
              const parsed = JSON.parse(e.target.value) as Record<
                string,
                unknown
              >;
              onChange({ ...data, params: parsed });
            } catch {
              // ignore invalid edits
            }
          }}
          className="h-48 w-full rounded-md border border-slate-800 bg-slate-950 p-3 font-mono text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-600"
        />
      </div>
    </div>
  );
}
