import { beforeEach, describe, expect, it } from "vitest";
import { createDemoProject } from "@/domain/project/defaults";
import { useProjectStore } from "@/store/project-store";

describe("project store", () => {
  beforeEach(() => {
    const project = createDemoProject();
    useProjectStore.setState({ project, selectedScreenId: project.screens[0].id, selection: { type: "screen", screenId: project.screens[0].id }, past: [], future: [] });
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

  it("adds, updates and removes a button", () => {
    const screen = useProjectStore.getState().project.screens[0];
    useProjectStore.getState().addButton(screen.id);
    const selection = useProjectStore.getState().selection;
    expect(selection?.type).toBe("button");
    if (!selection || selection.type !== "button") throw new Error("Button was not selected");
    useProjectStore.getState().updateButton(selection.screenId, selection.rowId, selection.buttonId, { text: "Changed" });
    const changed = useProjectStore.getState().project.screens.find((item) => item.id === selection.screenId)!.keyboard.flatMap((row) => row.buttons).find((button) => button.id === selection.buttonId);
    expect(changed?.text).toBe("Changed");
    useProjectStore.getState().removeButton(selection.screenId, selection.rowId, selection.buttonId);
    const exists = useProjectStore.getState().project.screens.find((item) => item.id === selection.screenId)!.keyboard.flatMap((row) => row.buttons).some((button) => button.id === selection.buttonId);
    expect(exists).toBe(false);
  });

  it("keeps selection coherent after undo removes a newly-created screen", () => {
    const originalId = useProjectStore.getState().project.screens[0].id;
    useProjectStore.getState().createScreen();
    const createdId = useProjectStore.getState().selectedScreenId;
    expect(createdId).not.toBe(originalId);
    useProjectStore.getState().undo();
    expect(useProjectStore.getState().selectedScreenId).toBe(originalId);
    expect(useProjectStore.getState().selection).toEqual({ type: "screen", screenId: originalId });
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
