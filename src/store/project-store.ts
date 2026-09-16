"use client";

import { create } from "zustand";
import type {
  ButtonAction,
  EditorMode,
  EditorSelection,
  InlineButton,
  KeyboardRow,
  Project,
  TelegramMessage,
} from "@/domain/project/types";
import { createButton, createDemoProject, createEmptyProject, createId, createRow, createScreen } from "@/domain/project/defaults";
import { getButton, getScreen } from "@/domain/project/selectors";
import { normalizeKeyboard } from "@/domain/project/keyboard";
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

  hydrate(): void;
  persistNow(): void;
  setMode(mode: EditorMode): void;
  setToast(message: string | null): void;
  selectScreen(screenId: string): void;
  selectButton(screenId: string, rowId: string, buttonId: string): void;
  clearSelection(): void;

  newProject(): void;
  resetDemo(): void;
  replaceProject(project: Project): void;
  renameProject(name: string): void;

  createScreen(): void;
  duplicateScreen(screenId: string): void;
  renameScreen(screenId: string, name: string): void;
  deleteScreen(screenId: string): void;
  updateTrigger(screenId: string, command: string | null): void;
  updateMessage(screenId: string, patch: Partial<TelegramMessage>): void;
  setPhotoUrl(screenId: string, url: string | null): void;

  addRow(screenId: string): void;
  removeRow(screenId: string, rowId: string): void;
  replaceKeyboard(screenId: string, keyboard: KeyboardRow[], historyKey?: string): void;
  addButton(screenId: string, rowId?: string): void;
  updateButton(screenId: string, rowId: string, buttonId: string, patch: Partial<Omit<InlineButton, "id">>, historyKey?: string): void;
  removeButton(screenId: string, rowId: string, buttonId: string): void;
  setButtonAction(screenId: string, rowId: string, buttonId: string, action: ButtonAction): void;
  setFlowPosition(screenId: string, position: { x: number; y: number }): void;

  undo(): void;
  redo(): void;
};

export const useProjectStore = create<AppState>((set, get) => {
  const commit = (updater: (draft: Project) => void, historyKey?: string): void => {
    const state = get();
    const before = state.project;
    const draft = cloneProject(before);
    updater(draft);
    if (JSON.stringify(draft) === JSON.stringify(before)) return;
    const next = touch(draft);

    const now = Date.now();
    const group = historyKey && state.lastHistoryKey === historyKey && now - state.lastHistoryAt <= TEXT_GROUP_MS;
    const past = group ? state.past : [...state.past, cloneProject(before)].slice(-HISTORY_LIMIT);

    set({
      project: next,
      past,
      future: [],
      lastHistoryKey: historyKey ?? null,
      lastHistoryAt: now,
    });
  };

  return {
    project: createDemoProject(),
    mode: "design",
    selectedScreenId: null,
    selection: null,
    past: [],
    future: [],
    lastHistoryKey: null,
    lastHistoryAt: 0,
    hydrationStatus: "pending",
    recoveryMessage: null,
    toast: null,

    hydrate() {
      if (typeof window === "undefined") return;
      const result = loadLocalProject(window.localStorage);
      if (result.status === "ok") {
        set({
          project: result.project,
          selectedScreenId: result.project.screens[0]?.id ?? null,
          selection: result.project.screens[0] ? { type: "screen", screenId: result.project.screens[0].id } : null,
          hydrationStatus: "ready",
        });
      } else if (result.status === "invalid") {
        const project = createDemoProject();
        set({
          project,
          selectedScreenId: project.screens[0]?.id ?? null,
          selection: project.screens[0] ? { type: "screen", screenId: project.screens[0].id } : null,
          hydrationStatus: "recovered",
          recoveryMessage: `Stored project could not be loaded: ${result.error}. A backup was preserved.`,
        });
      } else {
        const project = get().project;
        set({
          selectedScreenId: project.screens[0]?.id ?? null,
          selection: project.screens[0] ? { type: "screen", screenId: project.screens[0].id } : null,
          hydrationStatus: "ready",
        });
      }
    },

    persistNow() {
      if (typeof window === "undefined") return;
      saveLocalProject(window.localStorage, get().project);
      set({ toast: "Project saved" });
    },

    setMode: (mode) => set({ mode }),
    setToast: (toast) => set({ toast }),
    selectScreen: (screenId) => set({ selectedScreenId: screenId, selection: { type: "screen", screenId } }),
    selectButton: (screenId, rowId, buttonId) => set({ selectedScreenId: screenId, selection: { type: "button", screenId, rowId, buttonId } }),
    clearSelection: () => set({ selection: get().selectedScreenId ? { type: "screen", screenId: get().selectedScreenId! } : null }),

    newProject() {
      const current = get().project;
      const project = createEmptyProject("Untitled Telegram Bot");
      set({ project, past: [...get().past, current].slice(-HISTORY_LIMIT), future: [], selectedScreenId: project.screens[0].id, selection: { type: "screen", screenId: project.screens[0].id }, mode: "design" });
    },

    resetDemo() {
      const current = get().project;
      const project = createDemoProject();
      set({ project, past: [...get().past, current].slice(-HISTORY_LIMIT), future: [], selectedScreenId: project.screens[0].id, selection: { type: "screen", screenId: project.screens[0].id }, mode: "design" });
    },

    replaceProject(project) {
      const current = get().project;
      set({ project: cloneProject(project), past: [...get().past, current].slice(-HISTORY_LIMIT), future: [], selectedScreenId: project.screens[0]?.id ?? null, selection: project.screens[0] ? { type: "screen", screenId: project.screens[0].id } : null, mode: "design" });
    },

    renameProject(name) {
      commit((draft) => { draft.name = name; }, "project:name");
    },

    createScreen() {
      let createdId = "";
      commit((draft) => {
        const name = uniqueScreenName(draft, "New Screen");
        const position = { x: 120 + draft.screens.length * 30, y: 120 + draft.screens.length * 30 };
        const screen = createScreen(name, position);
        createdId = screen.id;
        draft.screens.push(screen);
      });
      if (createdId) set({ selectedScreenId: createdId, selection: { type: "screen", screenId: createdId } });
    },

    duplicateScreen(screenId) {
      let createdId = "";
      commit((draft) => {
        const source = getScreen(draft, screenId);
        if (!source) return;
        const copy = structuredClone(source);
        copy.id = createId();
        copy.name = uniqueScreenName(draft, `${source.name} Copy`);
        copy.trigger = null;
        copy.editor.flowPosition = { x: source.editor.flowPosition.x + 40, y: source.editor.flowPosition.y + 40 };
        copy.keyboard = copy.keyboard.map((row) => ({ ...row, id: createId(), buttons: row.buttons.map((button) => ({ ...button, id: createId(), action: { ...button.action } })) }));
        createdId = copy.id;
        draft.screens.push(copy);
      });
      if (createdId) set({ selectedScreenId: createdId, selection: { type: "screen", screenId: createdId } });
    },

    renameScreen(screenId, name) {
      commit((draft) => { const screen = getScreen(draft, screenId); if (screen) screen.name = name; }, `screen:${screenId}:name`);
    },

    deleteScreen(screenId) {
      const state = get();
      if (state.project.screens.length <= 1) return;
      commit((draft) => {
        draft.screens = draft.screens.filter((screen) => screen.id !== screenId);
        for (const screen of draft.screens) {
          screen.keyboard = screen.keyboard
            .map((row) => ({ ...row, buttons: row.buttons.filter((button) => button.action.type !== "screen" || button.action.screenId !== screenId) }))
            .filter((row) => row.buttons.length > 0);
        }
      });
      const remaining = get().project.screens[0]?.id ?? null;
      set({ selectedScreenId: remaining, selection: remaining ? { type: "screen", screenId: remaining } : null });
    },

    updateTrigger(screenId, command) {
      commit((draft) => {
        const screen = getScreen(draft, screenId);
        if (!screen) return;
        screen.trigger = command === null || normalizeCommand(command) === "" ? null : { type: "command", command: normalizeCommand(command) };
      }, `screen:${screenId}:trigger`);
    },

    updateMessage(screenId, patch) {
      commit((draft) => {
        const screen = getScreen(draft, screenId);
        if (!screen) return;
        screen.message = { ...screen.message, ...patch };
      }, `screen:${screenId}:message`);
    },

    setPhotoUrl(screenId, url) {
      commit((draft) => {
        const screen = getScreen(draft, screenId);
        if (!screen) return;
        screen.message.media = url === null || url.trim() === "" ? null : { type: "photo", url };
      }, `screen:${screenId}:photo`);
    },

    addRow(screenId) {
      commit((draft) => { const screen = getScreen(draft, screenId); if (screen) screen.keyboard.push(createRow()); });
    },

    removeRow(screenId, rowId) {
      commit((draft) => { const screen = getScreen(draft, screenId); if (screen) screen.keyboard = screen.keyboard.filter((row) => row.id !== rowId); });
      const selection = get().selection;
      if (selection?.type === "button" && selection.rowId === rowId) get().clearSelection();
    },

    replaceKeyboard(screenId, keyboard, historyKey) {
      commit((draft) => { const screen = getScreen(draft, screenId); if (screen) screen.keyboard = normalizeKeyboard(keyboard); }, historyKey);
    },

    addButton(screenId, rowId) {
      let targetRowId = rowId ?? "";
      let buttonId = "";
      commit((draft) => {
        const screen = getScreen(draft, screenId);
        if (!screen) return;
        let row = targetRowId ? screen.keyboard.find((candidate) => candidate.id === targetRowId) : undefined;
        if (!row) {
          row = createRow();
          screen.keyboard.push(row);
          targetRowId = row.id;
        }
        const button = createButton();
        buttonId = button.id;
        row.buttons.push(button);
      });
      if (buttonId && targetRowId) set({ selection: { type: "button", screenId, rowId: targetRowId, buttonId } });
    },

    updateButton(screenId, rowId, buttonId, patch, historyKey) {
      commit((draft) => {
        const button = getButton(draft, screenId, rowId, buttonId);
        if (!button) return;
        if (patch.text !== undefined) button.text = patch.text;
        if (patch.action !== undefined) button.action = patch.action;
      }, historyKey);
    },

    removeButton(screenId, rowId, buttonId) {
      commit((draft) => {
        const screen = getScreen(draft, screenId);
        if (!screen) return;
        screen.keyboard = screen.keyboard.map((row) => row.id === rowId ? { ...row, buttons: row.buttons.filter((button) => button.id !== buttonId) } : row).filter((row) => row.buttons.length > 0);
      });
      get().clearSelection();
    },

    setButtonAction(screenId, rowId, buttonId, action) {
      get().updateButton(screenId, rowId, buttonId, { action }, `button:${buttonId}:action:${action.type}`);
    },

    setFlowPosition(screenId, position) {
      commit((draft) => { const screen = getScreen(draft, screenId); if (screen) screen.editor.flowPosition = position; }, `flow:${screenId}`);
    },

    undo() {
      const state = get();
      const previous = state.past.at(-1);
      if (!previous) return;
      const project = cloneProject(previous);
      const selectedScreenId = state.selectedScreenId && getScreen(project, state.selectedScreenId) ? state.selectedScreenId : project.screens[0]?.id ?? null;
      const selection = state.selection?.type === "button"
        ? (getButton(project, state.selection.screenId, state.selection.rowId, state.selection.buttonId) ? state.selection : selectedScreenId ? { type: "screen" as const, screenId: selectedScreenId } : null)
        : selectedScreenId ? { type: "screen" as const, screenId: selectedScreenId } : null;
      set({ project, selectedScreenId, selection, past: state.past.slice(0, -1), future: [cloneProject(state.project), ...state.future].slice(0, HISTORY_LIMIT), lastHistoryKey: null, lastHistoryAt: 0 });
    },

    redo() {
      const state = get();
      const next = state.future[0];
      if (!next) return;
      const project = cloneProject(next);
      const selectedScreenId = state.selectedScreenId && getScreen(project, state.selectedScreenId) ? state.selectedScreenId : project.screens[0]?.id ?? null;
      const selection = state.selection?.type === "button"
        ? (getButton(project, state.selection.screenId, state.selection.rowId, state.selection.buttonId) ? state.selection : selectedScreenId ? { type: "screen" as const, screenId: selectedScreenId } : null)
        : selectedScreenId ? { type: "screen" as const, screenId: selectedScreenId } : null;
      set({ project, selectedScreenId, selection, past: [...state.past, cloneProject(state.project)].slice(-HISTORY_LIMIT), future: state.future.slice(1), lastHistoryKey: null, lastHistoryAt: 0 });
    },
  };
});
