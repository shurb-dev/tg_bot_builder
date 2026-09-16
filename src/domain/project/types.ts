export type Project = {
  schemaVersion: 1;
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  screens: Screen[];
};

export type ScreenTrigger = {
  type: "command";
  command: string;
};

export type TelegramMessage = {
  text: string;
  parseMode: "none" | "HTML" | "MarkdownV2";
  media: null | {
    type: "photo";
    url: string;
  };
};

export type FlowPosition = { x: number; y: number };

export type Screen = {
  id: string;
  name: string;
  trigger: ScreenTrigger | null;
  message: TelegramMessage;
  keyboard: KeyboardRow[];
  editor: { flowPosition: FlowPosition };
};

export type KeyboardRow = {
  id: string;
  buttons: InlineButton[];
};

export type ButtonAction =
  | { type: "screen"; screenId: string }
  | { type: "callback"; callbackData: string }
  | { type: "url"; url: string };

export type InlineButton = {
  id: string;
  text: string;
  action: ButtonAction;
};

export type EditorMode = "design" | "flow" | "code";

export type EditorSelection =
  | { type: "screen"; screenId: string }
  | { type: "button"; screenId: string; rowId: string; buttonId: string }
  | null;
