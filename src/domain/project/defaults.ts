import type { ButtonAction, InlineButton, KeyboardRow, Project, Screen } from "./types";

export const createId = (): string => crypto.randomUUID();
const isoNow = (): string => new Date().toISOString();

export function createButton(text = "Новая кнопка", action?: ButtonAction): InlineButton {
  return {
    id: createId(),
    text,
    action: action ?? { type: "callback", callbackData: "action" },
  };
}

export function createRow(buttons: InlineButton[] = []): KeyboardRow {
  return { id: createId(), buttons };
}

export function createScreen(name = "New Screen", position = { x: 0, y: 0 }): Screen {
  return {
    id: createId(),
    name,
    trigger: null,
    message: { text: "", parseMode: "none", media: null },
    keyboard: [],
    editor: { flowPosition: position },
  };
}

export function createEmptyProject(name = "Untitled Bot"): Project {
  const now = isoNow();
  const screen = createScreen("Main Menu", { x: 80, y: 80 });
  screen.trigger = { type: "command", command: "start" };
  return {
    schemaVersion: 1,
    id: createId(),
    name,
    createdAt: now,
    updatedAt: now,
    screens: [screen],
  };
}

export function createDemoProject(): Project {
  const now = isoNow();
  const main = createScreen("Main Menu", { x: 80, y: 180 });
  const catalog = createScreen("Catalog", { x: 430, y: 40 });
  const profile = createScreen("Profile", { x: 430, y: 200 });
  const support = createScreen("Support", { x: 430, y: 360 });

  main.trigger = { type: "command", command: "start" };
  main.message.text = "Добро пожаловать!\n\nВыберите раздел:";
  catalog.message.text = "Каталог\n\nЗдесь будут ваши товары.";
  profile.message.text = "Профиль\n\nЗдесь будет информация пользователя.";
  support.message.text = "Поддержка\n\nОпишите ваш вопрос.";

  main.keyboard = [
    createRow([
      createButton("🛒 Каталог", { type: "screen", screenId: catalog.id }),
      createButton("👤 Профиль", { type: "screen", screenId: profile.id }),
    ]),
    createRow([createButton("💬 Поддержка", { type: "screen", screenId: support.id })]),
  ];

  for (const child of [catalog, profile, support]) {
    child.keyboard = [
      createRow([createButton("← Назад", { type: "screen", screenId: main.id })]),
    ];
  }

  return {
    schemaVersion: 1,
    id: createId(),
    name: "Demo Telegram Bot",
    createdAt: now,
    updatedAt: now,
    screens: [main, catalog, profile, support],
  };
}
