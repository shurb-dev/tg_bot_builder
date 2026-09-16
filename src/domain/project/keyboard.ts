import type { KeyboardRow } from "./types";

export type ButtonLocation = { rowId: string; index: number };

export function cloneKeyboard(rows: KeyboardRow[]): KeyboardRow[] {
  return rows.map((row) => ({ ...row, buttons: row.buttons.map((button) => ({ ...button, action: { ...button.action } })) }));
}

export function findButtonLocation(rows: KeyboardRow[], buttonId: string): ButtonLocation | null {
  for (const row of rows) {
    const index = row.buttons.findIndex((button) => button.id === buttonId);
    if (index >= 0) return { rowId: row.id, index };
  }
  return null;
}

export function moveButtonInKeyboard(
  rows: KeyboardRow[],
  buttonId: string,
  targetRowId: string,
  targetIndex: number,
): KeyboardRow[] {
  const next = cloneKeyboard(rows);
  const source = findButtonLocation(next, buttonId);
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

export function moveRow(rows: KeyboardRow[], rowId: string, targetIndex: number): KeyboardRow[] {
  const sourceIndex = rows.findIndex((row) => row.id === rowId);
  if (sourceIndex < 0) return rows;
  const next = cloneKeyboard(rows);
  const [row] = next.splice(sourceIndex, 1);
  if (!row) return rows;
  const insertionIndex = Math.max(0, Math.min(targetIndex, next.length));
  next.splice(insertionIndex, 0, row);
  return next;
}

export function normalizeKeyboard(rows: KeyboardRow[]): KeyboardRow[] {
  return rows.filter((row) => row.buttons.length > 0);
}
