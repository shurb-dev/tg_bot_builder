import type { InlineKeyboardRow, ReplyKeyboardRow } from "./types";

export type ButtonLocation = { rowId: string; index: number };

type RowWithButtons = { id: string; buttons: { id: string; action: object }[] };

function findLocation<T extends RowWithButtons>(rows: T[], buttonId: string): ButtonLocation | null {
  for (const row of rows) {
    const index = row.buttons.findIndex((button) => button.id === buttonId);
    if (index >= 0) return { rowId: row.id, index };
  }
  return null;
}

export function cloneKeyboard(rows: InlineKeyboardRow[]): InlineKeyboardRow[] {
  return structuredClone(rows);
}

export function cloneReplyKeyboard(rows: ReplyKeyboardRow[]): ReplyKeyboardRow[] {
  return structuredClone(rows);
}

export function findButtonLocation(rows: InlineKeyboardRow[], buttonId: string): ButtonLocation | null {
  return findLocation(rows, buttonId);
}

export function findReplyButtonLocation(rows: ReplyKeyboardRow[], buttonId: string): ButtonLocation | null {
  return findLocation(rows, buttonId);
}

function moveButton<T extends RowWithButtons>(rows: T[], buttonId: string, targetRowId: string, targetIndex: number): T[] {
  const next = structuredClone(rows) as T[];
  const source = findLocation(next, buttonId);
  if (!source) return rows;
  const sourceRow = next.find((row) => row.id === source.rowId);
  const targetRow = next.find((row) => row.id === targetRowId);
  if (!sourceRow || !targetRow) return rows;
  const [button] = sourceRow.buttons.splice(source.index, 1);
  if (!button) return rows;
  const insertionIndex = Math.max(0, Math.min(targetIndex, targetRow.buttons.length));
  targetRow.buttons.splice(insertionIndex, 0, button);
  return next;
}

function reorderRows<T>(rows: T[], sourceIndex: number, targetIndex: number): T[] {
  const next = structuredClone(rows);
  const [row] = next.splice(sourceIndex, 1);
  if (!row) return rows;
  next.splice(Math.max(0, Math.min(targetIndex, next.length)), 0, row);
  return next;
}

export function moveButtonInKeyboard(rows: InlineKeyboardRow[], buttonId: string, targetRowId: string, targetIndex: number): InlineKeyboardRow[] {
  return moveButton(rows, buttonId, targetRowId, targetIndex);
}

export function moveReplyButton(rows: ReplyKeyboardRow[], buttonId: string, targetRowId: string, targetIndex: number): ReplyKeyboardRow[] {
  return moveButton(rows, buttonId, targetRowId, targetIndex);
}

export function moveRow(rows: InlineKeyboardRow[], rowId: string, targetIndex: number): InlineKeyboardRow[] {
  const sourceIndex = rows.findIndex((row) => row.id === rowId);
  return sourceIndex < 0 ? rows : reorderRows(rows, sourceIndex, targetIndex);
}

export function moveReplyRow(rows: ReplyKeyboardRow[], rowId: string, targetIndex: number): ReplyKeyboardRow[] {
  const sourceIndex = rows.findIndex((row) => row.id === rowId);
  return sourceIndex < 0 ? rows : reorderRows(rows, sourceIndex, targetIndex);
}

export function normalizeKeyboard(rows: InlineKeyboardRow[]): InlineKeyboardRow[] {
  return rows.filter((row) => row.buttons.length > 0);
}

export function normalizeReplyKeyboard(rows: ReplyKeyboardRow[]): ReplyKeyboardRow[] {
  return rows.filter((row) => row.buttons.length > 0);
}
