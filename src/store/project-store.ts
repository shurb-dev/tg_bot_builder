"use client";

import { create } from "zustand";
import type {
  BotCommand,
  BotMenuButton,
  ButtonAction,
  ConditionRule,
  EditorMode,
  EditorSelection,
  EnvironmentVariableDefinition,
  FlowTarget,
  InlineButton,
  InlineKeyboardRow,
  KeyValueTemplate,
  LogicNode,
  LogicNodeType,
  Project,
  ProjectVariable,
  ReplyKeyboardAction,
  ReplyKeyboardButton,
  ReplyKeyboardConfig,
  ReplyKeyboardRow,
  TelegramMessage,
} from "@/domain/project/types";
import {
  createBotCommand,
  createButton,
  createDemoProject,
  createEmptyProject,
  createEnvironmentVariable,
  createId,
  createLogicNode,
  createReplyButton,
  createReplyKeyboardConfig,
  createReplyRow,
  createRow,
  createScreen,
  createVariable,
} from "@/domain/project/defaults";
import { getButton, getLogicNode, getReplyButton, getScreen } from "@/domain/project/selectors";
import { normalizeKeyboard, normalizeReplyKeyboard } from "@/domain/project/keyboard";
import { loadLocalProject, saveLocalProject } from "@/persistence/local-project";
import { normalizeCommand } from "@/domain/project/validation";

const HISTORY_LIMIT = 30;
const TEXT_GROUP_MS = 500;
const cloneProject = (project: Project): Project => structuredClone(project);
const touch = (project: Project): Project => ({ ...project, updatedAt: new Date().toISOString() });

function uniqueScreenName(project: Project, base: string): string {
  const names = new Set(project.screens.map((screen) => screen.name));
  if (!names.has(base)) return base;
  let index = 2;
  while (names.has(`${base} ${index}`)) index += 1;
  return `${base} ${index}`;
}
function uniqueNodeName(project: Project, base: string): string {
  const names = new Set(project.logicNodes.map((node) => node.name));
  if (!names.has(base)) return base;
  let index = 2;
  while (names.has(`${base} ${index}`)) index += 1;
  return `${base} ${index}`;
}
function uniqueKey(existing: string[], base: string): string {
  if (!existing.includes(base)) return base;
  let index = 2;
  while (existing.includes(`${base}_${index}`)) index += 1;
  return `${base}_${index}`;
}
function replyConfig(screen: Project["screens"][number]): ReplyKeyboardConfig | null {
  return screen.replyKeyboard.mode === "show" ? screen.replyKeyboard.config : null;
}
function regenerateScreenIds(screen: Project["screens"][number]): void {
  screen.inlineKeyboard = screen.inlineKeyboard.map((row) => ({ ...row, id: createId(), buttons: row.buttons.map((button) => ({ ...button, id: createId(), action: { ...button.action } })) }));
  if (screen.replyKeyboard.mode === "show") screen.replyKeyboard.config.rows = screen.replyKeyboard.config.rows.map((row) => ({ ...row, id: createId(), buttons: row.buttons.map((button) => ({ ...button, id: createId(), action: { ...button.action } })) }));
}
function targetPointsTo(target: FlowTarget | null, kind: "screen" | "node", id: string): boolean {
  return Boolean(target && target.type === kind && (kind === "screen" ? target.screenId === id : target.nodeId === id));
}
function clearLogicTarget(node: LogicNode, kind: "screen" | "node", id: string): void {
  if (node.type === "condition") {
    if (targetPointsTo(node.trueTarget, kind, id)) node.trueTarget = null;
    if (targetPointsTo(node.falseTarget, kind, id)) node.falseTarget = null;
  } else if (node.type === "http") {
    if (targetPointsTo(node.successTarget, kind, id)) node.successTarget = null;
    if (targetPointsTo(node.errorTarget, kind, id)) node.errorTarget = null;
  } else if (targetPointsTo(node.next, kind, id)) node.next = null;
}
function reconcileSelection(project: Project, selectedScreenId: string | null, selection: EditorSelection): { selectedScreenId: string | null; selection: EditorSelection } {
  if (selection?.type === "botSettings") return { selectedScreenId, selection };
  if (selection?.type === "logicNode" && getLogicNode(project, selection.nodeId)) return { selectedScreenId, selection };
  const fallback = selectedScreenId && getScreen(project, selectedScreenId) ? selectedScreenId : project.screens[0]?.id ?? null;
  if (!selection) return { selectedScreenId: fallback, selection: fallback ? { type: "screen", screenId: fallback } : null };
  if (selection.type === "screen" && getScreen(project, selection.screenId)) return { selectedScreenId: selection.screenId, selection };
  if (selection.type === "inlineButton" && getButton(project, selection.screenId, selection.rowId, selection.buttonId)) return { selectedScreenId: selection.screenId, selection };
  if (selection.type === "replyButton" && getReplyButton(project, selection.screenId, selection.rowId, selection.buttonId)) return { selectedScreenId: selection.screenId, selection };
  return { selectedScreenId: fallback, selection: fallback ? { type: "screen", screenId: fallback } : null };
}

export type AppState = {
  project: Project;
  mode: EditorMode;
  selectedScreenId: string | null;
  selection: EditorSelection;
  past: Project[];
  future: Project[];
  lastHistoryKey: string | null;
  lastHistoryAt: number;
  hydrationStatus: "pending" | "ready" | "recovered";
  recoveryMessage: string | null;
  toast: string | null;
  hydrate(): void; persistNow(): void; setMode(mode: EditorMode): void; setToast(message: string | null): void;
  selectScreen(screenId: string): void; selectLogicNode(nodeId: string): void; selectBotSettings(): void;
  selectButton(screenId: string, rowId: string, buttonId: string): void; selectInlineButton(screenId: string, rowId: string, buttonId: string): void; selectReplyButton(screenId: string, rowId: string, buttonId: string): void; clearSelection(): void;
  newProject(): void; resetDemo(): void; replaceProject(project: Project): void; renameProject(name: string): void;
  createScreen(): void; duplicateScreen(screenId: string): void; renameScreen(screenId: string, name: string): void; deleteScreen(screenId: string): void;
  updateTrigger(screenId: string, command: string | null): void; updateMessage(screenId: string, patch: Partial<TelegramMessage>): void; setPhotoUrl(screenId: string, url: string | null): void;
  addRow(screenId: string): void; removeRow(screenId: string, rowId: string): void; replaceKeyboard(screenId: string, keyboard: InlineKeyboardRow[], historyKey?: string): void;
  addButton(screenId: string, rowId?: string): void; updateButton(screenId: string, rowId: string, buttonId: string, patch: Partial<Omit<InlineButton, "id">>, historyKey?: string): void; removeButton(screenId: string, rowId: string, buttonId: string): void; setButtonAction(screenId: string, rowId: string, buttonId: string, action: ButtonAction): void;
  setReplyKeyboardMode(screenId: string, mode: "inherit" | "show" | "remove"): void; updateReplyKeyboardOptions(screenId: string, patch: Partial<Omit<ReplyKeyboardConfig, "rows">>): void;
  addReplyRow(screenId: string): void; removeReplyRow(screenId: string, rowId: string): void; replaceReplyKeyboardRows(screenId: string, rows: ReplyKeyboardRow[], historyKey?: string): void;
  addReplyButton(screenId: string, rowId?: string): void; updateReplyButton(screenId: string, rowId: string, buttonId: string, patch: Partial<Omit<ReplyKeyboardButton, "id">>, historyKey?: string): void; removeReplyButton(screenId: string, rowId: string, buttonId: string): void; setReplyButtonAction(screenId: string, rowId: string, buttonId: string, action: ReplyKeyboardAction): void;
  addBotCommand(): void; updateBotCommand(commandId: string, patch: Partial<Omit<BotCommand, "id">>): void; deleteBotCommand(commandId: string): void; setMenuButton(menuButton: BotMenuButton): void;
  addVariable(): void; updateVariable(variableId: string, patch: Partial<Omit<ProjectVariable, "id">>): void; deleteVariable(variableId: string): void;
  addEnvironmentVariable(): void; updateEnvironmentVariable(id: string, patch: Partial<Omit<EnvironmentVariableDefinition, "id">>): void; deleteEnvironmentVariable(id: string): void;
  createLogicNode(type: LogicNodeType): void; updateLogicNode(nodeId: string, patch: Partial<LogicNode>, historyKey?: string): void; deleteLogicNode(nodeId: string): void;
  setLogicNodeTarget(nodeId: string, port: "next" | "true" | "false" | "success" | "error", target: FlowTarget | null): void;
  addConditionRule(nodeId: string): void; updateConditionRule(nodeId: string, ruleId: string, patch: Partial<Omit<ConditionRule, "id">>): void; deleteConditionRule(nodeId: string, ruleId: string): void;
  addHttpPair(nodeId: string, kind: "headers" | "query"): void; updateHttpPair(nodeId: string, kind: "headers" | "query", pairId: string, patch: Partial<Omit<KeyValueTemplate, "id">>): void; deleteHttpPair(nodeId: string, kind: "headers" | "query", pairId: string): void;
  setFlowPosition(screenId: string, position: { x: number; y: number }): void; setLogicNodePosition(nodeId: string, position: { x: number; y: number }): void;
  undo(): void; redo(): void;
};

export const useProjectStore = create<AppState>((set, get) => {
  const commit = (updater: (draft: Project) => void, historyKey?: string): void => {
    const state = get(); const before = state.project; const draft = cloneProject(before); updater(draft);
    if (JSON.stringify(draft) === JSON.stringify(before)) return;
    const next = touch(draft); const now = Date.now();
    const grouped = Boolean(historyKey && state.lastHistoryKey === historyKey && now - state.lastHistoryAt <= TEXT_GROUP_MS);
    set({ project: next, past: grouped ? state.past : [...state.past, cloneProject(before)].slice(-HISTORY_LIMIT), future: [], lastHistoryKey: historyKey ?? null, lastHistoryAt: now });
  };

  return {
    project: createDemoProject(), mode: "design", selectedScreenId: null, selection: null, past: [], future: [], lastHistoryKey: null, lastHistoryAt: 0,
    hydrationStatus: "pending", recoveryMessage: null, toast: null,
    hydrate() {
      if (typeof window === "undefined") return;
      const result = loadLocalProject(window.localStorage);
      if (result.status === "ok") { const first = result.project.screens[0]; set({ project: result.project, selectedScreenId: first?.id ?? null, selection: first ? { type: "screen", screenId: first.id } : null, hydrationStatus: "ready" }); }
      else if (result.status === "invalid") { const project = createDemoProject(); const first = project.screens[0]; set({ project, selectedScreenId: first?.id ?? null, selection: first ? { type: "screen", screenId: first.id } : null, hydrationStatus: "recovered", recoveryMessage: result.error }); }
      else { const project = get().project; const first = project.screens[0]; set({ selectedScreenId: first?.id ?? null, selection: first ? { type: "screen", screenId: first.id } : null, hydrationStatus: "ready" }); }
    },
    persistNow() { if (typeof window !== "undefined") saveLocalProject(window.localStorage, get().project); },
    setMode: (mode) => set({ mode }), setToast: (toast) => set({ toast }),
    selectScreen: (screenId) => set({ selectedScreenId: screenId, selection: { type: "screen", screenId } }),
    selectLogicNode: (nodeId) => set({ selection: { type: "logicNode", nodeId } }),
    selectBotSettings: () => set({ selection: { type: "botSettings" } }),
    selectButton: (screenId, rowId, buttonId) => set({ selectedScreenId: screenId, selection: { type: "inlineButton", screenId, rowId, buttonId } }),
    selectInlineButton: (screenId, rowId, buttonId) => set({ selectedScreenId: screenId, selection: { type: "inlineButton", screenId, rowId, buttonId } }),
    selectReplyButton: (screenId, rowId, buttonId) => set({ selectedScreenId: screenId, selection: { type: "replyButton", screenId, rowId, buttonId } }),
    clearSelection: () => { const id = get().selectedScreenId; set({ selection: id ? { type: "screen", screenId: id } : null }); },

    newProject() { const current = get().project; const project = createEmptyProject("Untitled Telegram Bot"); const first = project.screens[0]; set({ project, past: [...get().past, current].slice(-HISTORY_LIMIT), future: [], selectedScreenId: first?.id ?? null, selection: first ? { type: "screen", screenId: first.id } : null, mode: "design" }); },
    resetDemo() { const current = get().project; const project = createDemoProject(); const first = project.screens[0]; set({ project, past: [...get().past, current].slice(-HISTORY_LIMIT), future: [], selectedScreenId: first?.id ?? null, selection: first ? { type: "screen", screenId: first.id } : null, mode: "design" }); },
    replaceProject(project) { const current = get().project; const copy = cloneProject(project); const first = copy.screens[0]; set({ project: copy, past: [...get().past, current].slice(-HISTORY_LIMIT), future: [], selectedScreenId: first?.id ?? null, selection: first ? { type: "screen", screenId: first.id } : null, mode: "design" }); },
    renameProject(name) { commit((draft) => { draft.name = name; }, "project:name"); },

    createScreen() { let createdId = ""; commit((draft) => { const screen = createScreen(uniqueScreenName(draft, "New Screen"), { x: 120 + draft.screens.length * 40, y: 120 + (draft.screens.length % 4) * 120 }); createdId = screen.id; draft.screens.push(screen); }); if (createdId) set({ selectedScreenId: createdId, selection: { type: "screen", screenId: createdId } }); },
    duplicateScreen(screenId) { let createdId = ""; commit((draft) => { const source = getScreen(draft, screenId); if (!source) return; const copy = structuredClone(source); copy.id = createId(); copy.name = uniqueScreenName(draft, `${source.name} Copy`); copy.trigger = null; copy.editor.flowPosition = { x: source.editor.flowPosition.x + 40, y: source.editor.flowPosition.y + 40 }; regenerateScreenIds(copy); createdId = copy.id; draft.screens.push(copy); }); if (createdId) set({ selectedScreenId: createdId, selection: { type: "screen", screenId: createdId } }); },
    renameScreen(screenId, name) { commit((draft) => { const screen = getScreen(draft, screenId); if (screen) screen.name = name; }, `screen:${screenId}:name`); },
    deleteScreen(screenId) {
      if (get().project.screens.length <= 1) return;
      commit((draft) => {
        draft.screens = draft.screens.filter((screen) => screen.id !== screenId);
        for (const screen of draft.screens) {
          screen.inlineKeyboard = screen.inlineKeyboard.map((row) => ({ ...row, buttons: row.buttons.filter((button) => button.action.type !== "screen" || button.action.screenId !== screenId) })).filter((row) => row.buttons.length > 0);
          if (screen.replyKeyboard.mode === "show") screen.replyKeyboard.config.rows = screen.replyKeyboard.config.rows.map((row) => ({ ...row, buttons: row.buttons.filter((button) => button.action.type !== "screen" || button.action.screenId !== screenId) })).filter((row) => row.buttons.length > 0);
        }
        draft.logicNodes.forEach((node) => clearLogicTarget(node, "screen", screenId));
      });
      const first = get().project.screens[0]; set({ selectedScreenId: first?.id ?? null, selection: first ? { type: "screen", screenId: first.id } : null });
    },
    updateTrigger(screenId, command) { commit((draft) => { const screen = getScreen(draft, screenId); if (!screen) return; const normalized = command === null ? "" : normalizeCommand(command); screen.trigger = normalized ? { type: "command", command: normalized } : null; }, `screen:${screenId}:trigger`); },
    updateMessage(screenId, patch) { commit((draft) => { const screen = getScreen(draft, screenId); if (screen) screen.message = { ...screen.message, ...patch }; }, `screen:${screenId}:message`); },
    setPhotoUrl(screenId, url) { commit((draft) => { const screen = getScreen(draft, screenId); if (screen) screen.message.media = !url?.trim() ? null : { type: "photo", url }; }, `screen:${screenId}:photo`); },

    addRow(screenId) { commit((draft) => { const screen = getScreen(draft, screenId); if (screen) screen.inlineKeyboard.push(createRow()); }); },
    removeRow(screenId, rowId) { commit((draft) => { const screen = getScreen(draft, screenId); if (screen) screen.inlineKeyboard = screen.inlineKeyboard.filter((row) => row.id !== rowId); }); const selection = get().selection; if (selection?.type === "inlineButton" && selection.rowId === rowId) get().clearSelection(); },
    replaceKeyboard(screenId, keyboard, historyKey) { commit((draft) => { const screen = getScreen(draft, screenId); if (screen) screen.inlineKeyboard = normalizeKeyboard(keyboard); }, historyKey); },
    addButton(screenId, rowId) { let targetRowId = rowId ?? ""; let buttonId = ""; commit((draft) => { const screen = getScreen(draft, screenId); if (!screen) return; let row = targetRowId ? screen.inlineKeyboard.find((candidate) => candidate.id === targetRowId) : undefined; if (!row) { row = createRow(); screen.inlineKeyboard.push(row); targetRowId = row.id; } const button = createButton(); buttonId = button.id; row.buttons.push(button); }); if (buttonId && targetRowId) set({ selection: { type: "inlineButton", screenId, rowId: targetRowId, buttonId } }); },
    updateButton(screenId, rowId, buttonId, patch, historyKey) { commit((draft) => { const button = getButton(draft, screenId, rowId, buttonId); if (!button) return; if (patch.text !== undefined) button.text = patch.text; if (patch.action !== undefined) button.action = patch.action; }, historyKey); },
    removeButton(screenId, rowId, buttonId) { commit((draft) => { const screen = getScreen(draft, screenId); if (screen) screen.inlineKeyboard = screen.inlineKeyboard.map((row) => row.id === rowId ? { ...row, buttons: row.buttons.filter((button) => button.id !== buttonId) } : row).filter((row) => row.buttons.length > 0); }); get().clearSelection(); },
    setButtonAction(screenId, rowId, buttonId, action) { get().updateButton(screenId, rowId, buttonId, { action }, `inline:${buttonId}:action:${action.type}`); },

    setReplyKeyboardMode(screenId, mode) { commit((draft) => { const screen = getScreen(draft, screenId); if (!screen) return; if (mode === "show") screen.replyKeyboard = screen.replyKeyboard.mode === "show" ? screen.replyKeyboard : { mode: "show", config: createReplyKeyboardConfig() }; else screen.replyKeyboard = { mode }; }); get().clearSelection(); },
    updateReplyKeyboardOptions(screenId, patch) { commit((draft) => { const screen = getScreen(draft, screenId); const config = screen ? replyConfig(screen) : null; if (!config) return; Object.assign(config, patch); if (patch.oneTimeKeyboard === true) config.isPersistent = false; if (patch.isPersistent === true) config.oneTimeKeyboard = false; if (config.inputFieldPlaceholder?.trim() === "") config.inputFieldPlaceholder = null; }, `reply:${screenId}:options`); },
    addReplyRow(screenId) { commit((draft) => { const screen = getScreen(draft, screenId); if (!screen) return; if (screen.replyKeyboard.mode !== "show") screen.replyKeyboard = { mode: "show", config: createReplyKeyboardConfig() }; screen.replyKeyboard.config.rows.push(createReplyRow()); }); },
    removeReplyRow(screenId, rowId) { commit((draft) => { const screen = getScreen(draft, screenId); const config = screen ? replyConfig(screen) : null; if (config) config.rows = config.rows.filter((row) => row.id !== rowId); }); const selection = get().selection; if (selection?.type === "replyButton" && selection.rowId === rowId) get().clearSelection(); },
    replaceReplyKeyboardRows(screenId, rows, historyKey) { commit((draft) => { const screen = getScreen(draft, screenId); const config = screen ? replyConfig(screen) : null; if (config) config.rows = normalizeReplyKeyboard(rows); }, historyKey); },
    addReplyButton(screenId, rowId) { let targetRowId = rowId ?? ""; let buttonId = ""; commit((draft) => { const screen = getScreen(draft, screenId); if (!screen) return; if (screen.replyKeyboard.mode !== "show") screen.replyKeyboard = { mode: "show", config: createReplyKeyboardConfig() }; const config = screen.replyKeyboard.config; let row = targetRowId ? config.rows.find((candidate) => candidate.id === targetRowId) : undefined; if (!row) { row = createReplyRow(); config.rows.push(row); targetRowId = row.id; } const button = createReplyButton(); buttonId = button.id; row.buttons.push(button); }); if (buttonId && targetRowId) set({ selection: { type: "replyButton", screenId, rowId: targetRowId, buttonId } }); },
    updateReplyButton(screenId, rowId, buttonId, patch, historyKey) { commit((draft) => { const button = getReplyButton(draft, screenId, rowId, buttonId); if (!button) return; if (patch.text !== undefined) button.text = patch.text; if (patch.action !== undefined) button.action = patch.action; }, historyKey); },
    removeReplyButton(screenId, rowId, buttonId) { commit((draft) => { const screen = getScreen(draft, screenId); const config = screen ? replyConfig(screen) : null; if (config) config.rows = config.rows.map((row) => row.id === rowId ? { ...row, buttons: row.buttons.filter((button) => button.id !== buttonId) } : row).filter((row) => row.buttons.length > 0); }); get().clearSelection(); },
    setReplyButtonAction(screenId, rowId, buttonId, action) { get().updateReplyButton(screenId, rowId, buttonId, { action }, `reply:${buttonId}:action:${action.type}`); },

    addBotCommand() { commit((draft) => { draft.botSettings.commands.push(createBotCommand("command", "Command description")); }); },
    updateBotCommand(commandId, patch) { commit((draft) => { const command = draft.botSettings.commands.find((item) => item.id === commandId); if (command) Object.assign(command, patch); }, `bot-command:${commandId}`); },
    deleteBotCommand(commandId) { commit((draft) => { draft.botSettings.commands = draft.botSettings.commands.filter((command) => command.id !== commandId); }); },
    setMenuButton(menuButton) { commit((draft) => { draft.botSettings.menuButton = menuButton; }, "menu-button"); },

    addVariable() { commit((draft) => { draft.variables.push(createVariable(uniqueKey(draft.variables.map((item) => item.key), "variable"))); }); },
    updateVariable(variableId, patch) { commit((draft) => { const variable = draft.variables.find((item) => item.id === variableId); if (!variable) return; Object.assign(variable, patch); if (patch.type === "string" && typeof variable.defaultValue !== "string") variable.defaultValue = ""; if (patch.type === "number" && typeof variable.defaultValue !== "number") variable.defaultValue = 0; if (patch.type === "boolean" && typeof variable.defaultValue !== "boolean") variable.defaultValue = false; }, `variable:${variableId}`); },
    deleteVariable(variableId) { commit((draft) => { draft.variables = draft.variables.filter((item) => item.id !== variableId); }); },
    addEnvironmentVariable() { commit((draft) => { draft.environmentVariables.push(createEnvironmentVariable(uniqueKey(draft.environmentVariables.map((item) => item.key), "API_KEY"))); }); },
    updateEnvironmentVariable(id, patch) { commit((draft) => { const env = draft.environmentVariables.find((item) => item.id === id); if (env) Object.assign(env, patch); }, `env:${id}`); },
    deleteEnvironmentVariable(id) { commit((draft) => { draft.environmentVariables = draft.environmentVariables.filter((item) => item.id !== id); }); },

    createLogicNode(type) {
      let createdId = "";
      commit((draft) => {
        const index = draft.logicNodes.length; const node = createLogicNode(type, { x: 260 + (index % 3) * 300, y: 120 + Math.floor(index / 3) * 220 });
        const labels: Record<LogicNodeType, string> = { input: "Input", condition: "Condition", setVariable: "Set Variable", http: "HTTP Request", sendMessage: "Send Message" };
        node.name = uniqueNodeName(draft, labels[type]); createdId = node.id; draft.logicNodes.push(node);
      });
      if (createdId) set({ selection: { type: "logicNode", nodeId: createdId }, mode: "flow" });
    },
    updateLogicNode(nodeId, patch, historyKey) { commit((draft) => { const node = getLogicNode(draft, nodeId); if (node) Object.assign(node, patch); }, historyKey ?? `node:${nodeId}`); },
    deleteLogicNode(nodeId) {
      commit((draft) => {
        draft.logicNodes = draft.logicNodes.filter((node) => node.id !== nodeId);
        for (const screen of draft.screens) {
          screen.inlineKeyboard.forEach((row) => row.buttons.forEach((button) => { if (button.action.type === "node" && button.action.nodeId === nodeId) button.action = { type: "callback", callbackData: "action" }; }));
          if (screen.replyKeyboard.mode === "show") screen.replyKeyboard.config.rows.forEach((row) => row.buttons.forEach((button) => { if (button.action.type === "node" && button.action.nodeId === nodeId) button.action = { type: "text" }; }));
        }
        draft.logicNodes.forEach((node) => clearLogicTarget(node, "node", nodeId));
      });
      get().clearSelection();
    },
    setLogicNodeTarget(nodeId, port, target) { commit((draft) => { const node = getLogicNode(draft, nodeId); if (!node) return; if (node.type === "condition") { if (port === "true") node.trueTarget = target; if (port === "false") node.falseTarget = target; } else if (node.type === "http") { if (port === "success") node.successTarget = target; if (port === "error") node.errorTarget = target; } else if (port === "next") node.next = target; }, `node:${nodeId}:target:${port}`); },
    addConditionRule(nodeId) { commit((draft) => { const node = getLogicNode(draft, nodeId); if (node?.type === "condition") node.rules.push({ id: createId(), left: "{{vars.value}}", operator: "equals", right: "true" }); }); },
    updateConditionRule(nodeId, ruleId, patch) { commit((draft) => { const node = getLogicNode(draft, nodeId); if (node?.type !== "condition") return; const rule = node.rules.find((item) => item.id === ruleId); if (rule) Object.assign(rule, patch); }, `node:${nodeId}:rule:${ruleId}`); },
    deleteConditionRule(nodeId, ruleId) { commit((draft) => { const node = getLogicNode(draft, nodeId); if (node?.type === "condition") node.rules = node.rules.filter((item) => item.id !== ruleId); }); },
    addHttpPair(nodeId, kind) { commit((draft) => { const node = getLogicNode(draft, nodeId); if (node?.type === "http") node[kind].push({ id: createId(), key: "", value: "" }); }); },
    updateHttpPair(nodeId, kind, pairId, patch) { commit((draft) => { const node = getLogicNode(draft, nodeId); if (node?.type !== "http") return; const pair = node[kind].find((item) => item.id === pairId); if (pair) Object.assign(pair, patch); }, `node:${nodeId}:${kind}:${pairId}`); },
    deleteHttpPair(nodeId, kind, pairId) { commit((draft) => { const node = getLogicNode(draft, nodeId); if (node?.type === "http") node[kind] = node[kind].filter((item) => item.id !== pairId); }); },

    setFlowPosition(screenId, position) { commit((draft) => { const screen = getScreen(draft, screenId); if (screen) screen.editor.flowPosition = position; }, `flow:${screenId}`); },
    setLogicNodePosition(nodeId, position) { commit((draft) => { const node = getLogicNode(draft, nodeId); if (node) node.editor.flowPosition = position; }, `flow-node:${nodeId}`); },
    undo() { const state = get(); const previous = state.past.at(-1); if (!previous) return; const project = cloneProject(previous); const reconciled = reconcileSelection(project, state.selectedScreenId, state.selection); set({ project, ...reconciled, past: state.past.slice(0, -1), future: [cloneProject(state.project), ...state.future].slice(0, HISTORY_LIMIT), lastHistoryKey: null, lastHistoryAt: 0 }); },
    redo() { const state = get(); const next = state.future[0]; if (!next) return; const project = cloneProject(next); const reconciled = reconcileSelection(project, state.selectedScreenId, state.selection); set({ project, ...reconciled, past: [...state.past, cloneProject(state.project)].slice(-HISTORY_LIMIT), future: state.future.slice(1), lastHistoryKey: null, lastHistoryAt: 0 }); },
  };
});
