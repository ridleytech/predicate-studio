"use client";

import type { ReactNode } from "react";
import { Handle, Position } from "reactflow";
import TooltipUI from "@/components/ui/Tooltip";

type Props = {
  title: string;
  subtitle?: string;
  children?: ReactNode;
  tone?: "neutral" | "success" | "danger";
  tooltip?: ReactNode;
};

const toneStyles: Record<NonNullable<Props["tone"]>, string> = {
  neutral: "border-slate-700 bg-slate-950",
  success: "border-emerald-800 bg-slate-950",
  danger: "border-red-800 bg-slate-950",
};

export default function BaseNode({
  title,
  subtitle,
  children,
  tone = "neutral",
  tooltip,
}: Props) {
  const body = (
    <div
      className={[
        "min-w-[200px] rounded-lg border px-3 py-2 shadow-sm",
        toneStyles[tone],
      ].join(" ")}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="!h-2 !w-2 !bg-slate-400"
      />
      <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">
        {title}
      </div>
      {subtitle ? (
        <div className="mt-0.5 text-sm font-medium text-slate-100">
          {subtitle}
        </div>
      ) : null}
      {children ? (
        <div className="mt-2 text-xs text-slate-300">{children}</div>
      ) : null}
      <Handle
        type="source"
        position={Position.Right}
        className="!h-2 !w-2 !bg-slate-200"
      />
    </div>
  );

  return tooltip ? (
    <TooltipUI content={tooltip} side="top">
      <span>{body}</span>
    </TooltipUI>
  ) : (
    body
  );
}
