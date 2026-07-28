"use client";

import type { NodeProps } from "reactflow";
import BaseNode from "./BaseNode";
import type { TriggerData } from "../types";

export default function TriggerNode({ data }: NodeProps<TriggerData>) {
  return (
    <BaseNode
      title="Trigger"
      subtitle={data.label}
      tooltip="Entry point for evaluation. The policy starts here and follows outgoing connections."
    />
  );
}
