"use client";

import { useMemo, useRef, useState } from "react";
import {
  DndContext,
  PointerSensor,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { SortableContext, arrayMove, useSortable, verticalListSortingStrategy, horizontalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripHorizontal, GripVertical, Plus, Trash2 } from "lucide-react";
import type { KeyboardRow } from "@/domain/project/types";
import { cloneKeyboard, findButtonLocation, moveButtonInKeyboard } from "@/domain/project/keyboard";
import { Button } from "@/components/ui/Button";
import { useProjectStore } from "@/store/project-store";

function SortableButton({ screenId, rowId, buttonId, text, selected }: { screenId: string; rowId: string; buttonId: string; text: string; selected: boolean }) {
  const selectButton = useProjectStore((state) => state.selectButton);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: buttonId, data: { kind: "button", rowId } });
  return (
    <div ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition }} className={`flex min-w-0 items-center rounded-lg border bg-slate-950 ${selected ? "border-sky-500" : "border-slate-700"} ${isDragging ? "opacity-40" : ""}`}>
      <button {...attributes} {...listeners} className="cursor-grab touch-none p-2 text-slate-600 hover:text-slate-300" aria-label={`Drag ${text}`}><GripHorizontal size={13} /></button>
      <button className="min-w-0 flex-1 truncate px-1 py-2 text-left text-xs text-slate-200" onClick={() => selectButton(screenId, rowId, buttonId)}>{text || "Untitled"}</button>
    </div>
  );
}

function SortableRow({ screenId, row, selectedButtonId, children }: { screenId: string; row: KeyboardRow; selectedButtonId?: string; children?: React.ReactNode }) {
  const removeRow = useProjectStore((state) => state.removeRow);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: row.id, data: { kind: "row" } });
  const { setNodeRef: setDropRef, isOver } = useDroppable({ id: `drop:${row.id}`, data: { kind: "row-drop", rowId: row.id } });
  return (
    <div ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition }} className={`rounded-xl border p-2 ${isDragging ? "opacity-40" : "border-slate-800 bg-slate-900/50"}`}>
      <div className="mb-2 flex items-center justify-between">
        <button {...attributes} {...listeners} className="cursor-grab touch-none rounded p-1 text-slate-600 hover:text-slate-300" aria-label="Reorder row"><GripVertical size={14} /></button>
        <button onClick={() => removeRow(screenId, row.id)} className="rounded p-1 text-slate-600 hover:bg-rose-500/10 hover:text-rose-400" aria-label="Delete row"><Trash2 size={13} /></button>
      </div>
      <div ref={setDropRef} className={`grid min-h-11 gap-2 rounded-lg border border-dashed p-2 transition ${isOver ? "border-sky-500 bg-sky-500/5" : "border-slate-800"}`} style={{ gridTemplateColumns: `repeat(${Math.max(1, row.buttons.length)}, minmax(0, 1fr))` }}>
        <SortableContext items={row.buttons.map((button) => button.id)} strategy={horizontalListSortingStrategy}>
          {row.buttons.map((button) => <SortableButton key={button.id} screenId={screenId} rowId={row.id} buttonId={button.id} text={button.text} selected={selectedButtonId === button.id} />)}
        </SortableContext>
        {row.buttons.length === 0 ? <div className="grid place-items-center py-2 text-[11px] text-slate-600">Drop button here</div> : null}
      </div>
      {children}
    </div>
  );
}

function targetRowFromOver(rows: KeyboardRow[], overId: string): { rowId: string; index: number } | null {
  if (overId.startsWith("drop:")) {
    const rowId = overId.slice(5);
    const row = rows.find((candidate) => candidate.id === rowId);
    return row ? { rowId, index: row.buttons.length } : null;
  }
  const row = rows.find((candidate) => candidate.id === overId);
  if (row) return { rowId: row.id, index: row.buttons.length };
  const location = findButtonLocation(rows, overId);
  return location ? { rowId: location.rowId, index: location.index } : null;
}

export function KeyboardBuilder({ screenId, keyboard, selectedButtonId }: { screenId: string; keyboard: KeyboardRow[]; selectedButtonId?: string }) {
  const addRow = useProjectStore((state) => state.addRow);
  const addButton = useProjectStore((state) => state.addButton);
  const replaceKeyboard = useProjectStore((state) => state.replaceKeyboard);
  const [draft, setDraft] = useState<KeyboardRow[]>(keyboard);
  const draftRef = useRef<KeyboardRow[]>(keyboard);
  const [dragging, setDragging] = useState(false);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));
  const renderedKeyboard = dragging ? draft : keyboard;
  const rowIds = useMemo(() => renderedKeyboard.map((row) => row.id), [renderedKeyboard]);

  function onDragStart(_: DragStartEvent) {
    const initial = cloneKeyboard(keyboard);
    draftRef.current = initial;
    setDraft(initial);
    setDragging(true);
  }

  function onDragOver(event: DragOverEvent) {
    const kind = event.active.data.current?.kind;
    if (kind !== "button" || !event.over) return;
    const current = draftRef.current;
    const target = targetRowFromOver(current, String(event.over.id));
    if (!target) return;
    const next = moveButtonInKeyboard(current, String(event.active.id), target.rowId, target.index);
    draftRef.current = next;
    setDraft(next);
  }

  function onDragEnd(event: DragEndEvent) {
    const kind = event.active.data.current?.kind;
    if (kind === "row" && event.over) {
      const current = draftRef.current;
      const oldIndex = current.findIndex((row) => row.id === String(event.active.id));
      const rawOverId = String(event.over.id);
      const buttonLocation = findButtonLocation(current, rawOverId);
      const overId = rawOverId.startsWith("drop:") ? rawOverId.slice(5) : buttonLocation?.rowId ?? rawOverId;
      const newIndex = current.findIndex((row) => row.id === overId);
      const next = oldIndex >= 0 && newIndex >= 0 ? arrayMove(current, oldIndex, newIndex) : current;
      replaceKeyboard(screenId, next);
    } else if (kind === "button") {
      let next = draftRef.current;
      if (event.over) {
        const target = targetRowFromOver(next, String(event.over.id));
        if (target) next = moveButtonInKeyboard(next, String(event.active.id), target.rowId, target.index);
      }
      replaceKeyboard(screenId, next);
    }
    draftRef.current = keyboard;
    setDragging(false);
  }

  function onDragCancel() {
    draftRef.current = keyboard;
    setDraft(keyboard);
    setDragging(false);
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm font-semibold text-slate-200">Inline keyboard</div>
          <div className="text-xs text-slate-500">Drag buttons between rows</div>
        </div>
        <div className="flex gap-2">
          <Button className="h-8" onClick={() => addRow(screenId)}><Plus size={14} /> Row</Button>
          <Button className="h-8" onClick={() => addButton(screenId, keyboard.at(-1)?.id)}><Plus size={14} /> Button</Button>
        </div>
      </div>
      <DndContext sensors={sensors} onDragStart={onDragStart} onDragOver={onDragOver} onDragEnd={onDragEnd} onDragCancel={onDragCancel}>
        <SortableContext items={rowIds} strategy={verticalListSortingStrategy}>
          <div className="space-y-2">
            {renderedKeyboard.map((row) => <SortableRow key={row.id} screenId={screenId} row={row} selectedButtonId={selectedButtonId} />)}
          </div>
        </SortableContext>
      </DndContext>
      {keyboard.length === 0 ? (
        <button onClick={() => addButton(screenId)} className="w-full rounded-xl border border-dashed border-slate-700 py-5 text-sm text-slate-500 hover:border-sky-500/50 hover:text-slate-300">+ Add first button</button>
      ) : null}
    </div>
  );
}
