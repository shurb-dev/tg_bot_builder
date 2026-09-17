import type {
  BotCommand,
  ButtonAction,
  EnvironmentVariableDefinition,
  InlineButton,
  InlineKeyboardRow,
  LogicNode,
  LogicNodeType,
  Project,
  ProjectVariable,
  ReplyKeyboardAction,
  ReplyKeyboardButton,
  ReplyKeyboardConfig,
  ReplyKeyboardRow,
  Screen,
} from "./types";

export const createId = (): string => crypto.randomUUID();
const isoNow = (): string => new Date().toISOString();

export function createButton(text = "Новая кнопка", action?: ButtonAction): InlineButton {
  return { id: createId(), text, action: action ?? { type: "callback", callbackData: "action" } };
}
export function createRow(buttons: InlineButton[] = []): InlineKeyboardRow { return { id: createId(), buttons }; }
export function createReplyButton(text = "Новая кнопка", action?: ReplyKeyboardAction): ReplyKeyboardButton {
  return { id: createId(), text, action: action ?? { type: "text" } };
}
export function createReplyRow(buttons: ReplyKeyboardButton[] = []): ReplyKeyboardRow { return { id: createId(), buttons }; }
export function createReplyKeyboardConfig(): ReplyKeyboardConfig {
  return { rows: [], resizeKeyboard: true, oneTimeKeyboard: false, isPersistent: true, selective: false, inputFieldPlaceholder: null };
}
export function createBotCommand(command = "start", description = "Start bot"): BotCommand { return { id: createId(), command, description }; }
export function createScreen(name = "New Screen", position = { x: 0, y: 0 }): Screen {
  return {
    id: createId(), name, trigger: null,
    message: { text: "", parseMode: "none", media: null },
    inlineKeyboard: [], replyKeyboard: { mode: "inherit" }, editor: { flowPosition: position },
  };
}

export function createVariable(key = "variable"): ProjectVariable {
  return { id: createId(), key, type: "string", defaultValue: "" };
}
export function createEnvironmentVariable(key = "API_KEY"): EnvironmentVariableDefinition { return { id: createId(), key }; }

export function createLogicNode(type: LogicNodeType, position = { x: 160, y: 160 }): LogicNode {
  const base = { id: createId(), name: "", editor: { flowPosition: position } };
  switch (type) {
    case "input": return {
      ...base, type, name: "Ask input", prompt: "Введите значение", variable: "input.value", inputType: "text", required: true,
      validation: {}, invalidMessage: "Пожалуйста, введите корректное значение.", next: null,
    };
    case "condition": return {
      ...base, type, name: "Condition", combinator: "and", rules: [{ id: createId(), left: "{{vars.value}}", operator: "equals", right: "true" }],
      trueTarget: null, falseTarget: null,
    };
    case "setVariable": return { ...base, type, name: "Set variable", variable: "vars.value", value: "", next: null };
    case "http": return {
      ...base, type, name: "HTTP request", method: "GET", url: "https://example.com", headers: [], query: [], body: { type: "none" },
      resultKey: "request", timeoutMs: 10000, mock: { enabled: true, status: 200, body: "{}" }, successTarget: null, errorTarget: null,
    };
    case "sendMessage": return { ...base, type, name: "Send message", text: "Message", parseMode: "none", next: null };
  }
}

function baseProject(name: string, screens: Screen[]): Project {
  const now = isoNow();
  return {
    schemaVersion: 3, id: createId(), name, createdAt: now, updatedAt: now,
    botSettings: { commands: [createBotCommand("start", "Start bot")], menuButton: { type: "commands" } },
    screens, logicNodes: [], variables: [], environmentVariables: [],
  };
}

export function createEmptyProject(name = "Untitled Bot"): Project {
  const screen = createScreen("Main Menu", { x: 80, y: 80 });
  screen.trigger = { type: "command", command: "start" };
  return baseProject(name, [screen]);
}

export function createDemoProject(): Project {
  const main = createScreen("Main Menu", { x: 80, y: 180 });
  const catalog = createScreen("Catalog", { x: 430, y: 40 });
  const profile = createScreen("Profile", { x: 430, y: 200 });
  const support = createScreen("Support", { x: 430, y: 360 });
  main.trigger = { type: "command", command: "start" };
  main.message.text = "Добро пожаловать!\n\nВыберите раздел:";
  catalog.message.text = "Каталог\n\nЗдесь будут ваши товары.";
  profile.message.text = "Профиль\n\nЗдесь будет информация пользователя.";
  support.message.text = "Поддержка\n\nОпишите ваш вопрос.";
  main.inlineKeyboard = [createRow([
    createButton("🛒 Каталог", { type: "screen", screenId: catalog.id }),
    createButton("👤 Профиль", { type: "screen", screenId: profile.id }),
  ]), createRow([createButton("💬 Поддержка", { type: "screen", screenId: support.id })])];
  for (const child of [catalog, profile, support]) child.inlineKeyboard = [createRow([createButton("← Назад", { type: "screen", screenId: main.id })])];
  return baseProject("Demo Telegram Bot", [main, catalog, profile, support]);
}
