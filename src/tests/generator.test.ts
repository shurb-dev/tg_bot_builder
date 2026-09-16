import { describe, expect, it } from "vitest";
import { createDemoProject } from "@/domain/project/defaults";
import { generateAiogramProject } from "@/generators/aiogram";

describe("aiogram generator", () => {
  it("generates a deterministic runnable source tree", () => {
    const project = createDemoProject();
    const one = generateAiogramProject(project);
    const two = generateAiogramProject(project);
    expect(one).toEqual(two);
    expect(one.files.map((file) => file.path)).toEqual(expect.arrayContaining([
      "generated_bot/bot.py",
      "generated_bot/config.py",
      "generated_bot/handlers/screens.py",
      "generated_bot/keyboards/screens.py",
      "generated_bot/requirements.txt",
      "generated_bot/.env.example",
      "generated_bot/README.md",
    ]));
    const handlers = one.files.find((file) => file.path.endsWith("handlers/screens.py"))!.content;
    const keyboards = one.files.find((file) => file.path.endsWith("keyboards/screens.py"))!.content;
    expect(handlers).toContain('Command("start")');
    expect(handlers).toContain("@router.callback_query");
    expect(keyboards).toContain("InlineKeyboardButton");
    expect(keyboards).toContain("🛒 Каталог");
    expect(one.files.find((file) => file.path.endsWith(".env.example"))!.content).not.toMatch(/\d+:[A-Za-z0-9_-]{20,}/);
  });

  it("generates URL and custom callback buttons", () => {
    const project = createDemoProject();
    project.screens[0].keyboard[0].buttons[0] = {
      ...project.screens[0].keyboard[0].buttons[0],
      action: { type: "url", url: "https://example.com" },
    };
    project.screens[0].keyboard[0].buttons[1] = {
      ...project.screens[0].keyboard[0].buttons[1],
      action: { type: "callback", callbackData: "custom_action" },
    };
    const generated = generateAiogramProject(project);
    const keyboards = generated.files.find((file) => file.path.endsWith("keyboards/screens.py"))!.content;
    const handlers = generated.files.find((file) => file.path.endsWith("handlers/screens.py"))!.content;
    expect(keyboards).toContain('url="https://example.com"');
    expect(keyboards).toContain('callback_data="custom_action"');
    expect(handlers).toContain('F.data == "custom_action"');
    expect(handlers).toContain("TODO: Replace this stub");
  });
});
