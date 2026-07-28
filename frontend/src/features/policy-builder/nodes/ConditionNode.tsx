"use client";

import type { NodeProps } from "reactflow";
import BaseNode from "./BaseNode";
import type { ConditionData } from "../types";

export default function ConditionNode({ data }: NodeProps<ConditionData>) {
  const tooltipByType: Record<string, string> = {
    wallet_kyc: "Checks transaction.wallet.kyc is true.",
    country: "Checks transaction.wallet.country equals params.country.",
    risk_score: "Checks transaction.wallet.riskScore <= params.max.",
    max_amount: "Checks transaction.amount <= params.max.",
    wallet_allow_list:
      "Checks transaction.wallet.address is in params.addresses (allow-list).",
    wallet_deny_list:
      "Denies if transaction.wallet.address is in params.addresses (deny-list).",
  };

  const tooltip = tooltipByType[data.conditionType] ?? "Condition node";

  return (
    <BaseNode title="Condition" subtitle={data.label} tooltip={tooltip}>
      <div className="text-slate-400">{data.conditionType}</div>
    </BaseNode>
  );
}
