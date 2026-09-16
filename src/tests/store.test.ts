import { beforeEach, describe, expect, it } from "vitest";
import { createDemoProject } from "@/domain/project/defaults";
import { useProjectStore } from "@/store/project-store";

describe("project store v2", () => {
  beforeEach(() => {
    const project = createDemoProject();
    useProjectStore.setState({ project, selectedScreenId: project.screens[0].id, selection: { type: "screen", screenId: project.screens[0].id }, past: [], future: [], lastHistoryKey: null, lastHistoryAt: 0 });
  });

  it("creates, duplicates and deletes screens", () => {
    const before = useProjectStore.getState().project.screens.length;
    useProjectStore.getState().createScreen();
    expect(useProjectStore.getState().project.screens).toHaveLength(before + 1);
    const id = useProjectStore.getState().selectedScreenId!;
    useProjectStore.getState().duplicateScreen(id);
    expect(useProjectStore.getState().project.screens).toHaveLength(before + 2);
    useProjectStore.getState().deleteScreen(useProjectStore.getState().selectedScreenId!);
    expect(useProjectStore.getState().project.screens).toHaveLength(before + 1);
  });

  it("adds, updates and removes an inline button", () => {
    const screen = useProjectStore.getState().project.screens[0];
    useProjectStore.getState().addButton(screen.id);
    const selection = useProjectStore.getState().selection;
    expect(selection?.type).toBe("inlineButton");
    if (!selection || selection.type !== "inlineButton") throw new Error("Inline button was not selected");
    useProjectStore.getState().updateButton(selection.screenId, selection.rowId, selection.buttonId, { text: "Changed" });
    const changed = useProjectStore.getState().project.screens.find((item) => item.id === selection.screenId)!.inlineKeyboard.flatMap((row) => row.buttons).find((button) => button.id === selection.buttonId);
    expect(changed?.text).toBe("Changed");
    useProjectStore.getState().removeButton(selection.screenId, selection.rowId, selection.buttonId);
    expect(useProjectStore.getState().project.screens.find((item) => item.id === selection.screenId)!.inlineKeyboard.flatMap((row) => row.buttons).some((button) => button.id === selection.buttonId)).toBe(false);
  });

  it("supports reply keyboard CRUD and undo", () => {
    const screenId = useProjectStore.getState().project.screens[0].id;
    useProjectStore.getState().setReplyKeyboardMode(screenId, "show");
    useProjectStore.getState().addReplyButton(screenId);
    const selection = useProjectStore.getState().selection;
    expect(selection?.type).toBe("replyButton");
    if (!selection || selection.type !== "replyButton") throw new Error("Reply button was not selected");
    useProjectStore.getState().updateReplyButton(selection.screenId, selection.rowId, selection.buttonId, { text: "Catalog" });
    expect(useProjectStore.getState().project.screens[0].replyKeyboard.mode).toBe("show");
    useProjectStore.getState().undo();
    const stateAfterUndo = useProjectStore.getState().project.screens[0].replyKeyboard;
    expect(stateAfterUndo.mode).toBe("show");
  });

  it("keeps selection coherent after undo removes a newly-created screen", () => {
    const originalId = useProjectStore.getState().project.screens[0].id;
    useProjectStore.getState().createScreen();
    expect(useProjectStore.getState().selectedScreenId).not.toBe(originalId);
    useProjectStore.getState().undo();
    expect(useProjectStore.getState().selectedScreenId).toBe(originalId);
    expect(useProjectStore.getState().selection).toEqual({ type: "screen", screenId: originalId });
  });

  it("manages bot commands and menu button", () => {
    useProjectStore.getState().addBotCommand();
    const command = useProjectStore.getState().project.botSettings.commands.at(-1)!;
    useProjectStore.getState().updateBotCommand(command.id, { command: "help", description: "Help" });
    expect(useProjectStore.getState().project.botSettings.commands.at(-1)).toMatchObject({ command: "help", description: "Help" });
    useProjectStore.getState().setMenuButton({ type: "webApp", text: "Open", url: "https://example.com" });
    expect(useProjectStore.getState().project.botSettings.menuButton.type).toBe("webApp");
  });

  it("undoes and redoes project changes", () => {
    const originalName = useProjectStore.getState().project.name;
    useProjectStore.getState().renameProject("Changed Name");
    useProjectStore.getState().undo();
    expect(useProjectStore.getState().project.name).toBe(originalName);
    useProjectStore.getState().redo();
    expect(useProjectStore.getState().project.name).toBe("Changed Name");
  });
});
