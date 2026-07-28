"use client";

import type { NodeProps } from "reactflow";
import BaseNode from "./BaseNode";
import type { LogicData } from "../types";

export default function LogicNode({ data }: NodeProps<LogicData>) {
  const tooltip =
    data.logicType === "and"
      ? "AND: every connected branch must pass for the policy to approve."
      : "OR: any connected branch can approve the policy.";

  return (
    <BaseNode
      title="Logic"
      subtitle={data.logicType.toUpperCase()}
      tooltip={tooltip}
    />
  );
}
