import type { FlowTarget, InlineButton, LogicNode, Project, ReplyKeyboardButton, Screen } from "./types";

export type DerivedFlowEdge = {
  id: string;
  source: string;
  target: string;
  label: string;
  sourceType: "inline-button" | "reply-button" | "logic-node";
  buttonId?: string;
  port?: string;
};

export function getScreen(project: Project, screenId: string): Screen | undefined {
  return project.screens.find((screen) => screen.id === screenId);
}
export function getLogicNode(project: Project, nodeId: string): LogicNode | undefined {
  return project.logicNodes.find((node) => node.id === nodeId);
}
export function getButton(project: Project, screenId: string, rowId: string, buttonId: string): InlineButton | undefined {
  return getScreen(project, screenId)?.inlineKeyboard.find((row) => row.id === rowId)?.buttons.find((button) => button.id === buttonId);
}
export const getInlineButton = getButton;
export function getReplyButton(project: Project, screenId: string, rowId: string, buttonId: string): ReplyKeyboardButton | undefined {
  const keyboard = getScreen(project, screenId)?.replyKeyboard;
  if (!keyboard || keyboard.mode !== "show") return undefined;
  return keyboard.config.rows.find((row) => row.id === rowId)?.buttons.find((button) => button.id === buttonId);
}

export function flowTargetId(target: FlowTarget | null): string | null {
  if (!target) return null;
  return target.type === "screen" ? target.screenId : target.nodeId;
}

function edgeFromTarget(source: string, target: FlowTarget | null, id: string, label: string, port?: string): DerivedFlowEdge[] {
  const targetId = flowTargetId(target);
  return targetId ? [{ id, source, target: targetId, label, sourceType: "logic-node", port }] : [];
}

export function deriveFlowEdges(project: Project): DerivedFlowEdge[] {
  const screenEdges = project.screens.flatMap((screen) => {
    const inline = screen.inlineKeyboard.flatMap((row) => row.buttons.flatMap((button) => {
      if (button.action.type === "screen") return [{ id: `inline:${button.id}`, source: screen.id, target: button.action.screenId, buttonId: button.id, label: button.text, sourceType: "inline-button" as const }];
      if (button.action.type === "node") return [{ id: `inline:${button.id}`, source: screen.id, target: button.action.nodeId, buttonId: button.id, label: button.text, sourceType: "inline-button" as const }];
      return [];
    }));
    const reply = screen.replyKeyboard.mode === "show" ? screen.replyKeyboard.config.rows.flatMap((row) => row.buttons.flatMap((button) => {
      if (button.action.type === "screen") return [{ id: `reply:${button.id}`, source: screen.id, target: button.action.screenId, buttonId: button.id, label: button.text, sourceType: "reply-button" as const }];
      if (button.action.type === "node") return [{ id: `reply:${button.id}`, source: screen.id, target: button.action.nodeId, buttonId: button.id, label: button.text, sourceType: "reply-button" as const }];
      return [];
    })) : [];
    return [...inline, ...reply];
  });

  const logicEdges = project.logicNodes.flatMap((node) => {
    if (node.type === "condition") return [
      ...edgeFromTarget(node.id, node.trueTarget, `node:${node.id}:true`, "TRUE", "true"),
      ...edgeFromTarget(node.id, node.falseTarget, `node:${node.id}:false`, "FALSE", "false"),
    ];
    if (node.type === "http") return [
      ...edgeFromTarget(node.id, node.successTarget, `node:${node.id}:success`, "SUCCESS", "success"),
      ...edgeFromTarget(node.id, node.errorTarget, `node:${node.id}:error`, "ERROR", "error"),
    ];
    return edgeFromTarget(node.id, node.next, `node:${node.id}:next`, "NEXT", "next");
  });
  return [...screenEdges, ...logicEdges];
}

export function targetExists(project: Project, target: FlowTarget | null): boolean {
  if (!target) return true;
  return target.type === "screen" ? Boolean(getScreen(project, target.screenId)) : Boolean(getLogicNode(project, target.nodeId));
}
