import { describe, expect, it } from "vitest";
import { createButton, createDemoProject, createRow, createScreen } from "@/domain/project/defaults";
import { moveButtonInKeyboard, moveRow } from "@/domain/project/keyboard";
import { deriveFlowEdges } from "@/domain/project/selectors";
import { utf8ByteLength } from "@/domain/telegram/utf8";
import { validateProject } from "@/domain/project/validation";

function errors(project: ReturnType<typeof createDemoProject>) {
  return validateProject(project).filter((item) => item.severity === "error");
}

describe("telegram domain", () => {
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
    const first = project.screens[0];
    first.keyboard = [createRow([createButton("Bad", { type: "callback", callbackData: "🔥".repeat(17) })])];
    expect(validateProject(project).some((item) => item.code === "INVALID_CALLBACK_LENGTH" && item.severity === "error")).toBe(true);
  });

  it("detects invalid URLs", () => {
    const project = createDemoProject();
    project.screens[0].keyboard = [createRow([createButton("Bad", { type: "url", url: "javascript:alert(1)" })])];
    expect(validateProject(project).some((item) => item.code === "INVALID_URL")).toBe(true);
  });

  it("detects missing target screens", () => {
    const project = createDemoProject();
    project.screens[0].keyboard = [createRow([createButton("Missing", { type: "screen", screenId: crypto.randomUUID() })])];
    expect(validateProject(project).some((item) => item.code === "MISSING_SCREEN_TARGET")).toBe(true);
  });

  it("detects duplicate commands", () => {
    const project = createDemoProject();
    project.screens[1].trigger = { type: "command", command: "start" };
    expect(validateProject(project).filter((item) => item.code === "DUPLICATE_COMMAND")).toHaveLength(2);
  });

  it("warns about unreachable screens", () => {
    const project = createDemoProject();
    const orphan = createScreen("Orphan");
    orphan.message.text = "Orphan";
    project.screens.push(orphan);
    expect(validateProject(project).some((item) => item.code === "UNREACHABLE_SCREEN" && item.screenId === orphan.id)).toBe(true);
  });

  it("moves a button to the end of the same row", () => {
    const a = createButton("A");
    const b = createButton("B");
    const c = createButton("C");
    const row = createRow([a, b, c]);
    const moved = moveButtonInKeyboard([row], a.id, row.id, 3);
    expect(moved[0].buttons.map((button) => button.text)).toEqual(["B", "C", "A"]);
  });

  it("moves a button across rows without duplication", () => {
    const a = createButton("A");
    const b = createButton("B");
    const r1 = createRow([a, b]);
    const r2 = createRow([]);
    const moved = moveButtonInKeyboard([r1, r2], a.id, r2.id, 0);
    expect(moved[0].buttons.map((button) => button.text)).toEqual(["B"]);
    expect(moved[1].buttons.map((button) => button.text)).toEqual(["A"]);
    expect(moved.flatMap((row) => row.buttons).filter((button) => button.id === a.id)).toHaveLength(1);
  });

  it("reorders rows", () => {
    const r1 = createRow([createButton("A")]);
    const r2 = createRow([createButton("B")]);
    expect(moveRow([r1, r2], r2.id, 0).map((row) => row.id)).toEqual([r2.id, r1.id]);
  });

  it("derives flow edges from button actions", () => {
    const project = createDemoProject();
    const edgeCount = project.screens.flatMap((screen) => screen.keyboard.flatMap((row) => row.buttons)).filter((button) => button.action.type === "screen").length;
    expect(deriveFlowEdges(project)).toHaveLength(edgeCount);
  });
});
