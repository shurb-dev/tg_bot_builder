"use client";

import { useMemo, useRef, useState } from "react";
import { Background, Controls, MiniMap, ReactFlow, type Connection, type Node, type NodeChange, type NodeTypes } from "@xyflow/react";
import { Plus } from "lucide-react";
import { deriveFlowEdges } from "@/domain/project/selectors";
import type { FlowTarget, LogicNodeType } from "@/domain/project/types";
import { useProjectStore } from "@/store/project-store";
import { ScreenNode, type ScreenNodeData } from "./ScreenNode";
import { LogicNodeCard, type LogicNodeData } from "./LogicNode";
import { LogicProperties } from "./LogicProperties";
import { useTranslations } from "@/i18n/use-translations";
import { usePreferencesStore } from "@/store/preferences-store";
import { getV12Translations } from "@/i18n/v12-translations";

const nodeTypes: NodeTypes = { screen: ScreenNode, logic: LogicNodeCard };
type Position = { x: number; y: number };

export function FlowEditor() {
  const base = useTranslations();
  const locale = usePreferencesStore((state) => state.locale);
  const t = getV12Translations(locale);
  const project = useProjectStore((state) => state.project);
  const selection = useProjectStore((state) => state.selection);
  const createLogicNode = useProjectStore((state) => state.createLogicNode);
  const setScreenPosition = useProjectStore((state) => state.setFlowPosition);
  const setLogicPosition = useProjectStore((state) => state.setLogicNodePosition);
  const setLogicTarget = useProjectStore((state) => state.setLogicNodeTarget);
  const selectScreen = useProjectStore((state) => state.selectScreen);
  const selectLogicNode = useProjectStore((state) => state.selectLogicNode);
  const setMode = useProjectStore((state) => state.setMode);
  const [draftPositions, setDraftPositions] = useState<Record<string, Position>>({});
  const draftPositionsRef = useRef<Record<string, Position>>({});

  const nodes = useMemo<Node[]>(() => [
    ...project.screens.map((screen) => ({
      id: screen.id,
      type: "screen",
      position: draftPositions[screen.id] ?? screen.editor.flowPosition,
      data: {
        name: screen.name,
        trigger: screen.trigger?.command ?? null,
        excerpt: screen.message.text.slice(0, 60),
        buttonCount: screen.inlineKeyboard.reduce((sum, row) => sum + row.buttons.length, 0) + (screen.replyKeyboard.mode === "show" ? screen.replyKeyboard.config.rows.reduce((sum, row) => sum + row.buttons.length, 0) : 0),
        emptyMessageLabel: base.flow.emptyMessage,
      } satisfies ScreenNodeData,
    })),
    ...project.logicNodes.map((node) => ({
      id: node.id,
      type: "logic",
      position: draftPositions[node.id] ?? node.editor.flowPosition,
      data: {
        name: node.name,
        logicType: node.type,
        subtitle: node.type === "input" ? node.prompt : node.type === "http" ? `${node.method} ${node.url}` : node.type === "condition" ? `${node.rules.length} rule(s)` : node.type === "setVariable" ? node.variable : node.text,
      } satisfies LogicNodeData,
    })),
  ], [project, draftPositions, base]);

  const edges = useMemo(() => deriveFlowEdges(project).map((edge) => ({
    id: edge.id, source: edge.source, target: edge.target, sourceHandle: edge.port, label: edge.label, animated: false,
    style: { stroke: edge.sourceType === "logic-node" ? "#a78bfa" : "#38bdf8" }, labelStyle: { fill: "#94a3b8", fontSize: 10 },
  })), [project]);

  function onNodesChange(changes: NodeChange[]) {
    const positionChanges = changes.filter((change) => change.type === "position" && change.position);
    if (!positionChanges.length) return;
    const next = { ...draftPositionsRef.current };
    for (const change of positionChanges) if (change.type === "position" && change.position) next[change.id] = change.position;
    draftPositionsRef.current = next; setDraftPositions(next);
  }

  function finishDrag(node: Node) {
    const finalPosition = draftPositionsRef.current[node.id] ?? node.position;
    if (project.logicNodes.some((item) => item.id === node.id)) setLogicPosition(node.id, finalPosition); else setScreenPosition(node.id, finalPosition);
    const next = { ...draftPositionsRef.current }; delete next[node.id]; draftPositionsRef.current = next; setDraftPositions(next);
  }

  function connect(connection: Connection) {
    if (!connection.source || !connection.target || !connection.sourceHandle) return;
    if (!project.logicNodes.some((node) => node.id === connection.source)) return;
    const target: FlowTarget = project.screens.some((screen) => screen.id === connection.target) ? { type: "screen", screenId: connection.target } : { type: "node", nodeId: connection.target };
    const port = connection.sourceHandle as "next" | "true" | "false" | "success" | "error";
    setLogicTarget(connection.source, port, target);
  }

  const selectedNode = selection?.type === "logicNode" ? project.logicNodes.find((node) => node.id === selection.nodeId) : undefined;
  const addTypes: { type: LogicNodeType; label: string }[] = [
    { type: "input", label: t.input }, { type: "condition", label: t.condition }, { type: "setVariable", label: t.setVariable }, { type: "http", label: t.http }, { type: "sendMessage", label: t.sendMessage },
  ];

  return (
    <div className="flex h-full min-h-0 bg-slate-950">
      <div className="relative min-w-0 flex-1">
        <div className="absolute left-3 top-3 z-20 flex max-w-[calc(100%-24px)] flex-wrap items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-950/95 p-2 shadow-xl">
          <span className="mr-1 text-xs font-semibold text-slate-400">{t.addNode}</span>
          {addTypes.map((item) => <button key={item.type} onClick={() => createLogicNode(item.type)} className="flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-900 px-2 py-1.5 text-[11px] text-slate-300 hover:border-violet-500/60 hover:text-violet-200"><Plus size={11} />{item.label}</button>)}
        </div>
        <div className="absolute bottom-3 left-3 z-20 max-w-lg rounded-lg bg-slate-950/85 px-3 py-2 text-[10px] text-slate-500">{t.flowHint}</div>
        <ReactFlow
          nodes={nodes} edges={edges} nodeTypes={nodeTypes} onNodesChange={onNodesChange} onNodeDragStop={(_, node) => finishDrag(node)} onConnect={connect}
          onNodeClick={(_, node) => { if (project.logicNodes.some((item) => item.id === node.id)) selectLogicNode(node.id); else selectScreen(node.id); }}
          onNodeDoubleClick={(_, node) => { if (project.screens.some((item) => item.id === node.id)) { selectScreen(node.id); setMode("design"); } else selectLogicNode(node.id); }}
          fitView minZoom={0.2} maxZoom={1.8}
        >
          <Background color="#26374a" gap={24} size={1} /><Controls /><MiniMap nodeColor={(node) => node.type === "logic" ? "#8b5cf6" : "#0ea5e9"} maskColor="rgba(2,6,23,.75)" />
        </ReactFlow>
      </div>
      {selectedNode ? <LogicProperties node={selectedNode} /> : null}
    </div>
  );
}
