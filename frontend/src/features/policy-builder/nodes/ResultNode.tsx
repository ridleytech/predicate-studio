"use client";

import type { NodeProps } from "reactflow";
import BaseNode from "./BaseNode";
import type { ResultData } from "../types";

export default function ResultNode({ data }: NodeProps<ResultData>) {
  const tone = data.decision === "APPROVE" ? "success" : "danger";
  const tooltip =
    data.decision === "APPROVE"
      ? "Final decision: the transaction is allowed if the evaluation reaches this node."
      : "Final decision: the transaction is blocked if the evaluation reaches this node.";
  return (
    <BaseNode
      title="Result"
      subtitle={data.decision}
      tone={tone}
      tooltip={tooltip}
    />
  );
}
