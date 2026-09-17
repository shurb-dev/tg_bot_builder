export type Project = {
  schemaVersion: 3;
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  botSettings: BotSettings;
  screens: Screen[];
  logicNodes: LogicNode[];
  variables: ProjectVariable[];
  environmentVariables: EnvironmentVariableDefinition[];
};

export type BotSettings = { commands: BotCommand[]; menuButton: BotMenuButton };
export type BotCommand = { id: string; command: string; description: string };
export type BotMenuButton = { type: "commands" } | { type: "default" } | { type: "webApp"; text: string; url: string };
export type ScreenTrigger = { type: "command"; command: string };
export type TelegramMessage = { text: string; parseMode: "none" | "HTML" | "MarkdownV2"; media: null | { type: "photo"; url: string } };
export type FlowPosition = { x: number; y: number };

export type FlowTarget =
  | { type: "screen"; screenId: string; nodeId?: never }
  | { type: "node"; nodeId: string; screenId?: never };

export type Screen = {
  id: string;
  name: string;
  trigger: ScreenTrigger | null;
  message: TelegramMessage;
  inlineKeyboard: InlineKeyboardRow[];
  replyKeyboard: ReplyKeyboardState;
  editor: { flowPosition: FlowPosition };
};

export type InlineKeyboardRow = { id: string; buttons: InlineButton[] };
export type ButtonAction =
  | { type: "screen"; screenId: string }
  | { type: "node"; nodeId: string }
  | { type: "callback"; callbackData: string }
  | { type: "url"; url: string };
export type InlineButton = { id: string; text: string; action: ButtonAction };

export type ReplyKeyboardState = { mode: "inherit" } | { mode: "remove" } | { mode: "show"; config: ReplyKeyboardConfig };
export type ReplyKeyboardConfig = { rows: ReplyKeyboardRow[]; resizeKeyboard: boolean; oneTimeKeyboard: boolean; isPersistent: boolean; selective: boolean; inputFieldPlaceholder: string | null };
export type ReplyKeyboardRow = { id: string; buttons: ReplyKeyboardButton[] };
export type ReplyKeyboardAction =
  | { type: "screen"; screenId: string }
  | { type: "node"; nodeId: string }
  | { type: "text" }
  | { type: "requestContact" }
  | { type: "requestLocation" }
  | { type: "webApp"; url: string };
export type ReplyKeyboardButton = { id: string; text: string; action: ReplyKeyboardAction };

export type ProjectVariableType = "string" | "number" | "boolean";
export type ProjectVariableValue = string | number | boolean | null;
export type ProjectVariable = { id: string; key: string; type: ProjectVariableType; defaultValue: ProjectVariableValue };
export type EnvironmentVariableDefinition = { id: string; key: string };

export type InputType = "text" | "number" | "email" | "phone";
export type InputValidation = { minLength?: number; maxLength?: number; min?: number; max?: number; pattern?: string };
export type ConditionOperator = "equals" | "notEquals" | "contains" | "notContains" | "greaterThan" | "greaterThanOrEqual" | "lessThan" | "lessThanOrEqual" | "exists" | "notExists";
export type ConditionRule = { id: string; left: string; operator: ConditionOperator; right: string };
export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
export type KeyValueTemplate = { id: string; key: string; value: string };
export type HttpMock = { enabled: boolean; status: number; body: string };
export type LogicNodeBase = { id: string; name: string; editor: { flowPosition: FlowPosition } };
export type InputNode = LogicNodeBase & { type: "input"; prompt: string; variable: string; inputType: InputType; required: boolean; validation: InputValidation; invalidMessage: string; next: FlowTarget | null };
export type ConditionNode = LogicNodeBase & { type: "condition"; combinator: "and" | "or"; rules: ConditionRule[]; trueTarget: FlowTarget | null; falseTarget: FlowTarget | null };
export type SetVariableNode = LogicNodeBase & { type: "setVariable"; variable: string; value: string; next: FlowTarget | null };
export type HttpRequestBody = { type: "none" } | { type: "json"; value: string } | { type: "text"; value: string };
export type HttpRequestNode = LogicNodeBase & { type: "http"; method: HttpMethod; url: string; headers: KeyValueTemplate[]; query: KeyValueTemplate[]; body: HttpRequestBody; resultKey: string; timeoutMs: number; mock: HttpMock; successTarget: FlowTarget | null; errorTarget: FlowTarget | null };
export type SendMessageNode = LogicNodeBase & { type: "sendMessage"; text: string; parseMode: "none" | "HTML" | "MarkdownV2"; next: FlowTarget | null };
export type LogicNode = InputNode | ConditionNode | SetVariableNode | HttpRequestNode | SendMessageNode;
export type LogicNodeType = LogicNode["type"];

export type EditorMode = "design" | "flow" | "test" | "code";
export type EditorSelection =
  | { type: "screen"; screenId: string }
  | { type: "logicNode"; nodeId: string }
  | { type: "inlineButton"; screenId: string; rowId: string; buttonId: string }
  | { type: "replyButton"; screenId: string; rowId: string; buttonId: string }
  | { type: "botSettings" }
  | null;
export type KeyboardRow = InlineKeyboardRow;
