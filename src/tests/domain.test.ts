import { describe, expect, it } from "vitest";
import { createButton, createDemoProject, createReplyButton, createReplyKeyboardConfig, createReplyRow, createRow, createScreen } from "@/domain/project/defaults";
import { moveButtonInKeyboard, moveReplyButton, moveReplyRow, moveRow } from "@/domain/project/keyboard";
import { deriveFlowEdges } from "@/domain/project/selectors";
import { utf8ByteLength } from "@/domain/telegram/utf8";
import { validateProject } from "@/domain/project/validation";

function errors(project: ReturnType<typeof createDemoProject>) {
  return validateProject(project).filter((item) => item.severity === "error");
}

describe("telegram domain v2", () => {
  it("counts callback length in UTF-8 bytes", () => {
    expect(utf8ByteLength("abc")).toBe(3);
    expect(utf8ByteLength("я")).toBe(2);
    expect(utf8ByteLength("🔥")).toBe(4);
  });

  it("demo project has no blocking validation errors", () => {
    expect(errors(createDemoProject())).toEqual([]);
  });

  it("detects callbacks longer than 64 bytes", () => {
    const project = createDemoProject();
    project.screens[0].inlineKeyboard = [createRow([createButton("Bad", { type: "callback", callbackData: "🔥".repeat(17) })])];
    expect(validateProject(project).some((item) => item.code === "INVALID_CALLBACK_LENGTH" && item.severity === "error")).toBe(true);
  });

  it("detects invalid inline URLs and missing targets", () => {
    const project = createDemoProject();
    project.screens[0].inlineKeyboard = [createRow([
      createButton("Bad URL", { type: "url", url: "javascript:alert(1)" }),
      createButton("Missing", { type: "screen", screenId: crypto.randomUUID() }),
    ])];
    const issues = validateProject(project);
    expect(issues.some((item) => item.code === "INVALID_URL")).toBe(true);
    expect(issues.some((item) => item.code === "MISSING_SCREEN_TARGET")).toBe(true);
  });

  it("detects duplicate commands and unreachable screens", () => {
    const project = createDemoProject();
    project.screens[1].trigger = { type: "command", command: "start" };
    const orphan = createScreen("Orphan");
    orphan.message.text = "Orphan";
    project.screens.push(orphan);
    const issues = validateProject(project);
    expect(issues.filter((item) => item.code === "DUPLICATE_COMMAND")).toHaveLength(2);
    expect(issues.some((item) => item.code === "UNREACHABLE_SCREEN" && item.screenId === orphan.id)).toBe(true);
  });

  it("moves inline buttons and rows without duplication", () => {
    const a = createButton("A"); const b = createButton("B"); const c = createButton("C");
    const r1 = createRow([a, b, c]); const r2 = createRow([]);
    expect(moveButtonInKeyboard([r1], a.id, r1.id, 3)[0].buttons.map((button) => button.text)).toEqual(["B", "C", "A"]);
    const moved = moveButtonInKeyboard([r1, r2], a.id, r2.id, 0);
    expect(moved[0].buttons.map((button) => button.text)).toEqual(["B", "C"]);
    expect(moved[1].buttons.map((button) => button.text)).toEqual(["A"]);
    expect(moveRow([r1, r2], r2.id, 0).map((row) => row.id)).toEqual([r2.id, r1.id]);
  });

  it("moves reply buttons within and across rows without duplication", () => {
    const a = createReplyButton("A"); const b = createReplyButton("B"); const c = createReplyButton("C");
    const r1 = createReplyRow([a, b, c]); const r2 = createReplyRow([]);
    expect(moveReplyButton([r1], a.id, r1.id, 3)[0].buttons.map((button) => button.text)).toEqual(["B", "C", "A"]);
    const moved = moveReplyButton([r1, r2], b.id, r2.id, 0);
    expect(moved[0].buttons.map((button) => button.text)).toEqual(["A", "C"]);
    expect(moved[1].buttons.map((button) => button.text)).toEqual(["B"]);
    expect(moved.flatMap((row) => row.buttons).filter((button) => button.id === b.id)).toHaveLength(1);
    expect(moveReplyRow([r1, r2], r2.id, 0).map((row) => row.id)).toEqual([r2.id, r1.id]);
  });

  it("validates reply keyboard navigation and web apps", () => {
    const project = createDemoProject();
    const main = project.screens[0];
    const catalog = project.screens[1];
    main.inlineKeyboard = [];
    main.replyKeyboard = { mode: "show", config: createReplyKeyboardConfig() };
    main.replyKeyboard.config.rows = [createReplyRow([
      createReplyButton("Catalog", { type: "screen", screenId: catalog.id }),
      createReplyButton("App", { type: "webApp", url: "http://example.com" }),
    ])];
    catalog.inlineKeyboard = [];
    catalog.replyKeyboard = { mode: "show", config: createReplyKeyboardConfig() };
    catalog.replyKeyboard.config.rows = [createReplyRow([createReplyButton("Catalog", { type: "screen", screenId: main.id })])];
    const issues = validateProject(project);
    expect(issues.some((item) => item.code === "INVALID_WEBAPP_URL")).toBe(true);
    expect(issues.filter((item) => item.code === "DUPLICATE_REPLY_NAV_TEXT")).toHaveLength(2);
  });

  it("accepts HTTPS Web Apps and rejects missing reply screen targets", () => {
    const project = createDemoProject();
    const screen = project.screens[0];
    screen.inlineKeyboard = [];
    screen.replyKeyboard = { mode: "show", config: createReplyKeyboardConfig() };
    screen.replyKeyboard.config.rows = [createReplyRow([
      createReplyButton("App", { type: "webApp", url: "https://example.com/app" }),
      createReplyButton("Missing", { type: "screen", screenId: crypto.randomUUID() }),
    ])];
    const issues = validateProject(project);
    expect(issues.some((item) => item.code === "INVALID_WEBAPP_URL")).toBe(false);
    expect(issues.some((item) => item.code === "MISSING_REPLY_SCREEN_TARGET")).toBe(true);
  });

  it("blocks inline keyboard and bottom keyboard changes on the same screen", () => {
    const project = createDemoProject();
    project.screens[0].replyKeyboard = { mode: "show", config: createReplyKeyboardConfig() };
    expect(validateProject(project).some((item) => item.code === "INLINE_REPLY_CONFLICT")).toBe(true);
  });

  it("derives flow edges from inline and reply screen actions", () => {
    const project = createDemoProject();
    const source = project.screens[0];
    const target = project.screens[1];
    source.inlineKeyboard = [];
    source.replyKeyboard = { mode: "show", config: createReplyKeyboardConfig() };
    const button = createReplyButton("Catalog", { type: "screen", screenId: target.id });
    source.replyKeyboard.config.rows = [createReplyRow([button])];
    const edges = deriveFlowEdges(project);
    expect(edges.some((edge) => edge.buttonId === button.id && edge.sourceType === "reply-button" && edge.target === target.id)).toBe(true);
  });
});
