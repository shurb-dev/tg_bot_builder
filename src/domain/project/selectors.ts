import type { InlineButton, Project, ReplyKeyboardButton, Screen } from "./types";

export type DerivedFlowEdge = {
  id: string;
  source: string;
  target: string;
  buttonId: string;
  label: string;
  sourceType: "inline-button" | "reply-button";
};

export function getScreen(project: Project, screenId: string): Screen | undefined {
  return project.screens.find((screen) => screen.id === screenId);
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

export function deriveFlowEdges(project: Project): DerivedFlowEdge[] {
  return project.screens.flatMap((screen) => {
    const inlineEdges = screen.inlineKeyboard.flatMap((row) => row.buttons.flatMap((button) => button.action.type === "screen" ? [{
      id: `inline:${button.id}`,
      source: screen.id,
      target: button.action.screenId,
      buttonId: button.id,
      label: button.text,
      sourceType: "inline-button" as const,
    }] : []));
    const replyEdges = screen.replyKeyboard.mode === "show"
      ? screen.replyKeyboard.config.rows.flatMap((row) => row.buttons.flatMap((button) => button.action.type === "screen" ? [{
          id: `reply:${button.id}`,
          source: screen.id,
          target: button.action.screenId,
          buttonId: button.id,
          label: button.text,
          sourceType: "reply-button" as const,
        }] : []))
      : [];
    return [...inlineEdges, ...replyEdges];
  });
}
