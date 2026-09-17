import { beforeEach, describe, expect, it } from "vitest";
import { createDemoProject } from "@/domain/project/defaults";
import { useProjectStore } from "@/store/project-store";

describe("project store v3", () => {
  beforeEach(() => {
    const project = createDemoProject();
    useProjectStore.setState({
      project,
      mode: "design",
      selectedScreenId: project.screens[0].id,
      selection: { type: "screen", screenId: project.screens[0].id },
      past: [],
      future: [],
      lastHistoryKey: null,
      lastHistoryAt: 0,
    });
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

  it("records one reply drag replacement as one undo step", () => {
    const screenId = useProjectStore.getState().project.screens[0].id;
    useProjectStore.getState().setReplyKeyboardMode(screenId, "show");
    useProjectStore.getState().addReplyButton(screenId);
    useProjectStore.getState().addReplyButton(screenId);
    useProjectStore.getState().addReplyRow(screenId);

    const screenBefore = useProjectStore.getState().project.screens[0];
    if (screenBefore.replyKeyboard.mode !== "show") throw new Error("Reply keyboard was not enabled");
    const beforeRows = structuredClone(screenBefore.replyKeyboard.config.rows);
    const firstRow = beforeRows[0];
    const secondRow = beforeRows[1];
    const moved = firstRow?.buttons[0];
    if (!firstRow || !secondRow || !moved) throw new Error("Reply drag fixture is incomplete");

    const afterRows = [
      { ...firstRow, buttons: firstRow.buttons.slice(1) },
      { ...secondRow, buttons: [...secondRow.buttons, moved] },
    ];
    const historyBefore = useProjectStore.getState().past.length;
    useProjectStore.getState().replaceReplyKeyboardRows(screenId, afterRows, `reply-drag:${screenId}`);
    expect(useProjectStore.getState().past).toHaveLength(historyBefore + 1);

    useProjectStore.getState().undo();
    const restored = useProjectStore.getState().project.screens[0].replyKeyboard;
    if (restored.mode !== "show") throw new Error("Reply keyboard disappeared after undo");
    expect(restored.config.rows).toEqual(beforeRows);
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

  it("undoes and redoes V1.2 logic connections and node movement", () => {
    useProjectStore.getState().createLogicNode("sendMessage");
    const selection = useProjectStore.getState().selection;
    if (!selection || selection.type !== "logicNode") throw new Error("Logic node was not selected");
    const nodeId = selection.nodeId;
    const targetScreenId = useProjectStore.getState().project.screens[1].id;
    const created = useProjectStore.getState().project.logicNodes.find((node) => node.id === nodeId);
    if (!created || created.type !== "sendMessage") throw new Error("Send Message node was not created");
    const originalPosition = structuredClone(created.editor.flowPosition);

    useProjectStore.getState().setLogicNodeTarget(nodeId, "next", { type: "screen", screenId: targetScreenId });
    useProjectStore.getState().setLogicNodePosition(nodeId, { x: 777, y: 444 });

    let node = useProjectStore.getState().project.logicNodes.find((item) => item.id === nodeId);
    if (!node || node.type !== "sendMessage") throw new Error("Send Message node disappeared");
    expect(node.next).toEqual({ type: "screen", screenId: targetScreenId });
    expect(node.editor.flowPosition).toEqual({ x: 777, y: 444 });

    useProjectStore.getState().undo();
    node = useProjectStore.getState().project.logicNodes.find((item) => item.id === nodeId);
    if (!node || node.type !== "sendMessage") throw new Error("Send Message node disappeared after undo");
    expect(node.editor.flowPosition).toEqual(originalPosition);
    expect(node.next).toEqual({ type: "screen", screenId: targetScreenId });

    useProjectStore.getState().undo();
    node = useProjectStore.getState().project.logicNodes.find((item) => item.id === nodeId);
    if (!node || node.type !== "sendMessage") throw new Error("Send Message node disappeared after second undo");
    expect(node.next).toBeNull();

    useProjectStore.getState().redo();
    useProjectStore.getState().redo();
    node = useProjectStore.getState().project.logicNodes.find((item) => item.id === nodeId);
    if (!node || node.type !== "sendMessage") throw new Error("Send Message node disappeared after redo");
    expect(node.next).toEqual({ type: "screen", screenId: targetScreenId });
    expect(node.editor.flowPosition).toEqual({ x: 777, y: 444 });
  });

  it("reconciles references when a logic node is deleted and restores them on undo", () => {
    useProjectStore.getState().createLogicNode("condition");
    const conditionSelection = useProjectStore.getState().selection;
    if (!conditionSelection || conditionSelection.type !== "logicNode") throw new Error("Condition node was not selected");
    const conditionId = conditionSelection.nodeId;

    useProjectStore.getState().createLogicNode("sendMessage");
    const sendSelection = useProjectStore.getState().selection;
    if (!sendSelection || sendSelection.type !== "logicNode") throw new Error("Send node was not selected");
    const sendId = sendSelection.nodeId;

    const project = useProjectStore.getState().project;
    const main = project.screens[0];
    const row = main.inlineKeyboard[0];
    const button = row.buttons[0];
    useProjectStore.getState().setLogicNodeTarget(conditionId, "true", { type: "node", nodeId: sendId });
    useProjectStore.getState().setLogicNodeTarget(conditionId, "false", { type: "screen", screenId: project.screens[2].id });
    useProjectStore.getState().setButtonAction(main.id, row.id, button.id, { type: "node", nodeId: sendId });

    useProjectStore.getState().deleteLogicNode(sendId);
    expect(useProjectStore.getState().project.logicNodes.some((node) => node.id === sendId)).toBe(false);
    let condition = useProjectStore.getState().project.logicNodes.find((node) => node.id === conditionId);
    if (!condition || condition.type !== "condition") throw new Error("Condition node disappeared");
    expect(condition.trueTarget).toBeNull();
    const deletedTargetButton = useProjectStore.getState().project.screens[0].inlineKeyboard[0].buttons[0];
    expect(deletedTargetButton.action).toEqual({ type: "callback", callbackData: "action" });

    useProjectStore.getState().undo();
    expect(useProjectStore.getState().project.logicNodes.some((node) => node.id === sendId)).toBe(true);
    condition = useProjectStore.getState().project.logicNodes.find((node) => node.id === conditionId);
    if (!condition || condition.type !== "condition") throw new Error("Condition node disappeared after undo");
    expect(condition.trueTarget).toEqual({ type: "node", nodeId: sendId });
    const restoredButton = useProjectStore.getState().project.screens[0].inlineKeyboard[0].buttons[0];
    expect(restoredButton.action).toEqual({ type: "node", nodeId: sendId });
  });

  it("clears logic targets when a target screen is deleted and restores them on undo", () => {
    useProjectStore.getState().createLogicNode("condition");
    const selection = useProjectStore.getState().selection;
    if (!selection || selection.type !== "logicNode") throw new Error("Condition node was not selected");
    const conditionId = selection.nodeId;
    const targetScreenId = useProjectStore.getState().project.screens[1].id;
    useProjectStore.getState().setLogicNodeTarget(conditionId, "true", { type: "screen", screenId: targetScreenId });
    useProjectStore.getState().setLogicNodeTarget(conditionId, "false", { type: "screen", screenId: useProjectStore.getState().project.screens[2].id });

    useProjectStore.getState().deleteScreen(targetScreenId);
    let condition = useProjectStore.getState().project.logicNodes.find((node) => node.id === conditionId);
    if (!condition || condition.type !== "condition") throw new Error("Condition node disappeared");
    expect(condition.trueTarget).toBeNull();

    useProjectStore.getState().undo();
    expect(useProjectStore.getState().project.screens.some((screen) => screen.id === targetScreenId)).toBe(true);
    condition = useProjectStore.getState().project.logicNodes.find((node) => node.id === conditionId);
    if (!condition || condition.type !== "condition") throw new Error("Condition node disappeared after undo");
    expect(condition.trueTarget).toEqual({ type: "screen", screenId: targetScreenId });
  });
});
