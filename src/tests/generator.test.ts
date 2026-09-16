import { describe, expect, it } from "vitest";
import { createDemoProject, createReplyButton, createReplyKeyboardConfig, createReplyRow } from "@/domain/project/defaults";
import { generateAiogramProject } from "@/generators/aiogram";

describe("aiogram generator v1.1", () => {
  it("generates a deterministic runnable source tree", () => {
    const project = createDemoProject();
    const one = generateAiogramProject(project);
    const two = generateAiogramProject(project);
    expect(one).toEqual(two);
    expect(one.files.map((file) => file.path)).toEqual(expect.arrayContaining([
      "generated_bot/bot.py", "generated_bot/config.py", "generated_bot/handlers/screens.py", "generated_bot/keyboards/inline.py", "generated_bot/keyboards/reply.py", "generated_bot/requirements.txt", "generated_bot/.env.example", "generated_bot/README.md",
    ]));
    const handlers = one.files.find((file) => file.path.endsWith("handlers/screens.py"))!.content;
    const keyboards = one.files.find((file) => file.path.endsWith("keyboards/inline.py"))!.content;
    expect(handlers).toContain('Command("start")');
    expect(keyboards).toContain("InlineKeyboardButton");
    expect(keyboards).toContain("🛒 Каталог");
    expect(one.files.find((file) => file.path.endsWith(".env.example"))!.content).not.toMatch(/\d+:[A-Za-z0-9_-]{20,}/);
  });

  it("generates reply keyboard navigation, special buttons, remove markup and bot settings", () => {
    const project = createDemoProject();
    const main = project.screens[0]; const catalog = project.screens[1]; const profile = project.screens[2]; const support = project.screens[3];
    main.inlineKeyboard = [];
    main.replyKeyboard = { mode: "show", config: createReplyKeyboardConfig() };
    main.replyKeyboard.config.rows = [
      createReplyRow([createReplyButton("Catalog", { type: "screen", screenId: catalog.id }), createReplyButton("Phone", { type: "requestContact" })]),
      createReplyRow([createReplyButton("Location", { type: "requestLocation" }), createReplyButton("App", { type: "webApp", url: "https://example.com/app" })]),
    ];
    catalog.inlineKeyboard = [];
    catalog.replyKeyboard = { mode: "remove" };
    profile.inlineKeyboard = [];
    support.inlineKeyboard = [];
    project.botSettings.commands.push({ id: crypto.randomUUID(), command: "help", description: "Help" });
    project.botSettings.menuButton = { type: "webApp", text: "Open App", url: "https://example.com/app" };

    const generated = generateAiogramProject(project);
    const reply = generated.files.find((file) => file.path.endsWith("keyboards/reply.py"))!.content;
    const handlers = generated.files.find((file) => file.path.endsWith("handlers/screens.py"))!.content;
    const bot = generated.files.find((file) => file.path.endsWith("bot.py"))!.content;
    expect(reply).toContain("ReplyKeyboardMarkup");
    expect(reply).toContain("request_contact=True");
    expect(reply).toContain("request_location=True");
    expect(reply).toContain("WebAppInfo");
    expect(handlers).toContain('F.text == "Catalog"');
    expect(handlers).toContain("ReplyKeyboardRemove()");
    expect(handlers).toContain("F.contact");
    expect(handlers).toContain("F.location");
    expect(bot).toContain('BotCommand(command="help", description="Help")');
    expect(bot).toContain("MenuButtonWebApp");
  });

  it("preserves URL and custom callback inline buttons", () => {
    const project = createDemoProject();
    project.screens[0].inlineKeyboard[0].buttons[0] = { ...project.screens[0].inlineKeyboard[0].buttons[0], action: { type: "url", url: "https://example.com" } };
    project.screens[0].inlineKeyboard[0].buttons[1] = { ...project.screens[0].inlineKeyboard[0].buttons[1], action: { type: "callback", callbackData: "custom_action" } };
    const generated = generateAiogramProject(project);
    const keyboards = generated.files.find((file) => file.path.endsWith("keyboards/inline.py"))!.content;
    const handlers = generated.files.find((file) => file.path.endsWith("handlers/screens.py"))!.content;
    expect(keyboards).toContain('url="https://example.com"');
    expect(keyboards).toContain('callback_data="custom_action"');
    expect(handlers).toContain('F.data == "custom_action"');
  });
});
