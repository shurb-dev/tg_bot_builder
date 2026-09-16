"use client";

import { Handle, Position, type NodeProps } from "@xyflow/react";
import { Command, MousePointerClick } from "lucide-react";

export type ScreenNodeData = {
  name: string;
  trigger: string | null;
  excerpt: string;
  buttonCount: number;
};

export function ScreenNode({ data, selected }: NodeProps) {
  const node = data as ScreenNodeData;
  return (
    <div className={`min-w-52 rounded-2xl border bg-slate-950 p-3 shadow-xl transition ${selected ? "border-sky-400 ring-2 ring-sky-400/20" : "border-slate-700"}`}>
      <Handle type="target" position={Position.Left} className="!h-2 !w-2 !border-0 !bg-sky-400" />
      <div className="flex items-center justify-between gap-3">
        <div className="truncate text-sm font-semibold text-slate-100">{node.name}</div>
        <div className="flex items-center gap-1 text-[10px] text-slate-500"><MousePointerClick size={11} /> {node.buttonCount}</div>
      </div>
      {node.trigger ? <div className="mt-2 inline-flex items-center gap-1 rounded bg-sky-500/10 px-1.5 py-1 text-[10px] text-sky-300"><Command size={10} />/{node.trigger}</div> : null}
      <div className="mt-2 max-w-52 truncate text-[11px] text-slate-500">{node.excerpt || "Empty message"}</div>
      <Handle type="source" position={Position.Right} className="!h-2 !w-2 !border-0 !bg-sky-400" />
    </div>
  );
}
