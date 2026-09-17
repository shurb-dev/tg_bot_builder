"use client";

import { Handle, Position, type NodeProps } from "@xyflow/react";
import { Braces, GitBranch, Globe2, MessageSquareText, TextCursorInput } from "lucide-react";
import type { LogicNodeType } from "@/domain/project/types";

export type LogicNodeData = { name: string; logicType: LogicNodeType; subtitle: string };

function Icon({ type }: { type: LogicNodeType }) {
  if (type === "input") return <TextCursorInput size={14} />;
  if (type === "condition") return <GitBranch size={14} />;
  if (type === "http") return <Globe2 size={14} />;
  if (type === "sendMessage") return <MessageSquareText size={14} />;
  return <Braces size={14} />;
}

function Output({ id, label, top }: { id: string; label: string; top: string }) {
  return <><span className="absolute right-3 text-[9px] font-semibold text-slate-500" style={{ top }}>{label}</span><Handle id={id} type="source" position={Position.Right} style={{ top }} className="!h-2.5 !w-2.5 !border-0 !bg-violet-400" /></>;
}

export function LogicNodeCard({ data, selected }: NodeProps) {
  const node = data as LogicNodeData;
  return (
    <div className={`relative min-w-56 rounded-2xl border bg-slate-950 p-3 shadow-xl ${selected ? "border-violet-400 ring-2 ring-violet-400/20" : "border-slate-700"}`}>
      <Handle type="target" position={Position.Left} className="!h-2.5 !w-2.5 !border-0 !bg-violet-400" />
      <div className="flex items-center gap-2 text-violet-300"><Icon type={node.logicType} /><span className="text-[10px] font-semibold uppercase tracking-wider">{node.logicType}</span></div>
      <div className="mt-2 max-w-44 truncate text-sm font-semibold text-slate-100">{node.name}</div>
      <div className="mt-1 max-w-44 truncate text-[11px] text-slate-500">{node.subtitle}</div>
      {node.logicType === "condition" ? <><Output id="true" label="TRUE" top="40%" /><Output id="false" label="FALSE" top="72%" /></> : null}
      {node.logicType === "http" ? <><Output id="success" label="SUCCESS" top="40%" /><Output id="error" label="ERROR" top="72%" /></> : null}
      {node.logicType !== "condition" && node.logicType !== "http" ? <Output id="next" label="NEXT" top="50%" /> : null}
    </div>
  );
}
