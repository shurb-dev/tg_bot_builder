import { describe, expect, it } from "vitest";
import {
  createButton,
  createDemoProject,
  createLogicNode,
  createReplyButton,
  createReplyKeyboardConfig,
  createReplyRow,
  createRow,
  createScreen,
} from "@/domain/project/defaults";
import { moveButtonInKeyboard, moveReplyButton, moveReplyRow, moveRow } from "@/domain/project/keyboard";
import { deriveFlowEdges } from "@/domain/project/selectors";
import { utf8ByteLength } from "@/domain/telegram/utf8";
import { validateProject } from "@/domain/project/validation";

function errors(project: ReturnType<typeof createDemoProject>) {
  return validateProject(project).filter((item) => item.severity === "error");
}

describe("telegram domain v3", () => {
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

  it("detects invalid inline URLs and missing screen or node targets", () => {
    const project = createDemoProject();
    project.screens[0].inlineKeyboard = [createRow([
      createButton("Bad URL", { type: "url", url: "javascript:alert(1)" }),
      createButton("Missing screen", { type: "screen", screenId: crypto.randomUUID() }),
      createButton("Missing node", { type: "node", nodeId: crypto.randomUUID() }),
    ])];
    const issues = validateProject(project);
    expect(issues.some((item) => item.code === "INVALID_URL")).toBe(true);
    expect(issues.some((item) => item.code === "MISSING_SCREEN_TARGET")).toBe(true);
    expect(issues.some((item) => item.code === "MISSING_NODE_TARGET")).toBe(true);
  });

  it("detects duplicate commands", () => {
    const project = createDemoProject();
    project.screens[1].trigger = { type: "command", command: "start" };
    const orphan = createScreen("Orphan");
    orphan.message.text = "Orphan";
    project.screens.push(orphan);
    expect(validateProject(project).filter((item) => item.code === "DUPLICATE_COMMAND")).toHaveLength(2);
  });

  it("moves inline buttons and rows without duplication", () => {
    const a = createButton("A");
    const b = createButton("B");
    const c = createButton("C");
    const r1 = createRow([a, b, c]);
    const r2 = createRow([]);
    expect(moveButtonInKeyboard([r1], a.id, r1.id, 3)[0].buttons.map((button) => button.text)).toEqual(["B", "C", "A"]);
    const moved = moveButtonInKeyboard([r1, r2], a.id, r2.id, 0);
    expect(moved[0].buttons.map((button) => button.text)).toEqual(["B", "C"]);
    expect(moved[1].buttons.map((button) => button.text)).toEqual(["A"]);
    expect(moveRow([r1, r2], r2.id, 0).map((row) => row.id)).toEqual([r2.id, r1.id]);
  });

  it("moves reply buttons within and across rows without duplication", () => {
    const a = createReplyButton("A");
    const b = createReplyButton("B");
    const c = createReplyButton("C");
    const r1 = createReplyRow([a, b, c]);
    const r2 = createReplyRow([]);
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

  it("rejects ambiguous screen and text reply routes with the same label", () => {
    const project = createDemoProject();
    const main = project.screens[0];
    const catalog = project.screens[1];
    main.inlineKeyboard = [];
    main.replyKeyboard = { mode: "show", config: createReplyKeyboardConfig() };
    main.replyKeyboard.config.rows = [createReplyRow([createReplyButton("Same", { type: "screen", screenId: catalog.id })])];
    catalog.inlineKeyboard = [];
    catalog.replyKeyboard = { mode: "show", config: createReplyKeyboardConfig() };
    catalog.replyKeyboard.config.rows = [createReplyRow([createReplyButton("Same", { type: "text" })])];
    expect(validateProject(project).filter((item) => item.code === "DUPLICATE_REPLY_NAV_TEXT")).toHaveLength(2);
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

  it("validates Telegram bottom keyboard placeholder length", () => {
    const project = createDemoProject();
    const screen = project.screens[0];
    screen.inlineKeyboard = [];
    screen.replyKeyboard = { mode: "show", config: createReplyKeyboardConfig() };
    screen.replyKeyboard.config.rows = [createReplyRow([createReplyButton("A")])];
    screen.replyKeyboard.config.inputFieldPlaceholder = "x".repeat(65);
    expect(validateProject(project).some((item) => item.code === "INVALID_REPLY_PLACEHOLDER")).toBe(true);
    screen.replyKeyboard.config.inputFieldPlaceholder = "🔥".repeat(64);
    expect(validateProject(project).some((item) => item.code === "INVALID_REPLY_PLACEHOLDER")).toBe(false);
  });

  it("requires lowercase Telegram BotCommand names and valid descriptions", () => {
    const project = createDemoProject();
    project.botSettings.commands.push({ id: crypto.randomUUID(), command: "Help", description: "Help" });
    expect(validateProject(project).some((item) => item.code === "INVALID_BOT_COMMAND")).toBe(true);
    project.botSettings.commands[1].command = "help";
    project.botSettings.commands[1].description = "";
    const issues = validateProject(project);
    expect(issues.some((item) => item.code === "INVALID_BOT_COMMAND")).toBe(false);
    expect(issues.some((item) => item.code === "INVALID_BOT_COMMAND_DESCRIPTION")).toBe(true);
  });

  it("validates variable and environment definitions", () => {
    const project = createDemoProject();
    project.variables.push(
      { id: crypto.randomUUID(), key: "score", type: "number", defaultValue: 1 },
      { id: crypto.randomUUID(), key: "score", type: "number", defaultValue: 2 },
      { id: crypto.randomUUID(), key: "vars", type: "string", defaultValue: "bad" },
    );
    project.environmentVariables.push(
      { id: crypto.randomUUID(), key: "crm-token" },
      { id: crypto.randomUUID(), key: "API_KEY" },
      { id: crypto.randomUUID(), key: "API_KEY" },
    );
    const issues = validateProject(project);
    expect(issues.some((item) => item.code === "DUPLICATE_VARIABLE_KEY")).toBe(true);
    expect(issues.some((item) => item.code === "INVALID_VARIABLE_KEY")).toBe(true);
    expect(issues.some((item) => item.code === "INVALID_ENV_KEY")).toBe(true);
    expect(issues.some((item) => item.code === "DUPLICATE_ENV_KEY")).toBe(true);
  });

  it("requires outgoing targets for logic nodes and validates set variables", () => {
    const project = createDemoProject();
    const input = createLogicNode("input");
    const setVariable = createLogicNode("setVariable");
    project.logicNodes.push(input, setVariable);
    const issues = validateProject(project);
    expect(issues.some((item) => item.code === "MISSING_NEXT_TARGET" && item.nodeId === input.id)).toBe(true);
    expect(issues.some((item) => item.code === "UNKNOWN_SET_VARIABLE" && item.nodeId === setVariable.id)).toBe(true);
  });

  it("derives flow edges from screen actions and logic branches", () => {
    const project = createDemoProject();
    const source = project.screens[0];
    const target = project.screens[1];
    const condition = createLogicNode("condition");
    if (condition.type !== "condition") throw new Error("condition fixture mismatch");
    condition.rules = [{ id: crypto.randomUUID(), left: "1", operator: "equals", right: "1" }];
    condition.trueTarget = { type: "screen", screenId: target.id };
    condition.falseTarget = { type: "screen", screenId: project.screens[2].id };
    project.logicNodes.push(condition);
    source.inlineKeyboard = [createRow([createButton("Check", { type: "node", nodeId: condition.id })])];
    const edges = deriveFlowEdges(project);
    expect(edges.some((edge) => edge.source === source.id && edge.target === condition.id && edge.sourceType === "inline-button")).toBe(true);
    expect(edges.some((edge) => edge.source === condition.id && edge.target === target.id && edge.port === "true")).toBe(true);
    expect(edges.some((edge) => edge.source === condition.id && edge.port === "false")).toBe(true);
  });
});
