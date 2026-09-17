export type Project = {
  schemaVersion: 2;
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  botSettings: BotSettings;
  screens: Screen[];
};

export type BotSettings = {
  commands: BotCommand[];
  menuButton: BotMenuButton;
};

export type BotCommand = {
  id: string;
  command: string;
  description: string;
};

export type BotMenuButton =
  | { type: "commands" }
  | { type: "default" }
  | { type: "webApp"; text: string; url: string };

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
  inlineKeyboard: InlineKeyboardRow[];
  replyKeyboard: ReplyKeyboardState;
  editor: { flowPosition: FlowPosition };
};

export type InlineKeyboardRow = {
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

export type ReplyKeyboardState =
  | { mode: "inherit" }
  | { mode: "remove" }
  | { mode: "show"; config: ReplyKeyboardConfig };

export type ReplyKeyboardConfig = {
  rows: ReplyKeyboardRow[];
  resizeKeyboard: boolean;
  oneTimeKeyboard: boolean;
  isPersistent: boolean;
  selective: boolean;
  inputFieldPlaceholder: string | null;
};

export type ReplyKeyboardRow = {
  id: string;
  buttons: ReplyKeyboardButton[];
};

export type ReplyKeyboardAction =
  | { type: "screen"; screenId: string }
  | { type: "text" }
  | { type: "requestContact" }
  | { type: "requestLocation" }
  | { type: "webApp"; url: string };

export type ReplyKeyboardButton = {
  id: string;
  text: string;
  action: ReplyKeyboardAction;
};

export type EditorMode = "design" | "flow" | "code";

export type EditorSelection =
  | { type: "screen"; screenId: string }
  | { type: "inlineButton"; screenId: string; rowId: string; buttonId: string }
  | { type: "replyButton"; screenId: string; rowId: string; buttonId: string }
  | { type: "botSettings" }
  | null;

// Compatibility aliases for internal modules that still use the older naming.
export type KeyboardRow = InlineKeyboardRow;
