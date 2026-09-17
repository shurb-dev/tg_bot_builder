"use client";

import { useMemo, useRef, useState } from "react";
import { Background, Controls, MiniMap, ReactFlow, type Node, type NodeChange, type NodeTypes } from "@xyflow/react";
import { deriveFlowEdges } from "@/domain/project/selectors";
import { useProjectStore } from "@/store/project-store";
import { ScreenNode, type ScreenNodeData } from "./ScreenNode";
import { useTranslations } from "@/i18n/use-translations";

const nodeTypes: NodeTypes = { screen: ScreenNode };
type Position = { x: number; y: number };

export function FlowEditor() {
  const t = useTranslations();
  const project = useProjectStore((state) => state.project);
  const setFlowPosition = useProjectStore((state) => state.setFlowPosition);
  const selectScreen = useProjectStore((state) => state.selectScreen);
  const setMode = useProjectStore((state) => state.setMode);
  const [draftPositions, setDraftPositions] = useState<Record<string, Position>>({});
  const draftPositionsRef = useRef<Record<string, Position>>({});

  const nodes = useMemo<Node<ScreenNodeData>[]>(() => project.screens.map((screen) => ({
    id: screen.id,
    type: "screen",
    position: draftPositions[screen.id] ?? screen.editor.flowPosition,
    data: {
      name: screen.name,
      trigger: screen.trigger?.command ?? null,
      excerpt: screen.message.text.slice(0, 60),
      buttonCount: screen.inlineKeyboard.reduce((sum, row) => sum + row.buttons.length, 0)
        + (screen.replyKeyboard.mode === "show" ? screen.replyKeyboard.config.rows.reduce((sum, row) => sum + row.buttons.length, 0) : 0),
      emptyMessageLabel: t.flow.emptyMessage,
    },
  })), [project, draftPositions, t]);

  const edges = useMemo(() => deriveFlowEdges(project).map((edge) => ({
    id: edge.id,
    source: edge.source,
    target: edge.target,
    label: edge.label,
    animated: false,
    style: { stroke: "#38bdf8" },
    labelStyle: { fill: "#94a3b8", fontSize: 10 },
  })), [project]);

  function onNodesChange(changes: NodeChange<Node<ScreenNodeData>>[]) {
    const positionChanges = changes.filter((change) => change.type === "position" && change.position);
    if (!positionChanges.length) return;

    const nextRef = { ...draftPositionsRef.current };
    for (const change of positionChanges) {
      if (change.type === "position" && change.position) nextRef[change.id] = change.position;
    }
    draftPositionsRef.current = nextRef;
    setDraftPositions(nextRef);
  }

  function finishNodeDrag(node: Node<ScreenNodeData>) {
    const finalPosition = draftPositionsRef.current[node.id] ?? node.position;
    setFlowPosition(node.id, finalPosition);

    const next = { ...draftPositionsRef.current };
    delete next[node.id];
    draftPositionsRef.current = next;
    setDraftPositions(next);
  }

  return (
    <div className="h-full w-full bg-slate-950">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onNodeDragStop={(_, node) => finishNodeDrag(node)}
        onNodeDoubleClick={(_, node) => {
          selectScreen(node.id);
          setMode("design");
        }}
        fitView
        minZoom={0.2}
        maxZoom={1.8}
      >
        <Background color="#26374a" gap={24} size={1} />
        <Controls />
        <MiniMap nodeColor="#0ea5e9" maskColor="rgba(2,6,23,.75)" />
      </ReactFlow>
    </div>
  );
}
