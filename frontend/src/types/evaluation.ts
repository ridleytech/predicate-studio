import type { TraceEvent } from "./trace";

export type Evaluation = {
  id: string;
  policyName: string;
  policyVersion: number;
  policySnapshot?: Record<string, unknown>;
  decision: string;
  reason: string;
  latencyMs: number;
  trace: TraceEvent[];
  tx: Record<string, unknown>;
  createdAt: string;
};
