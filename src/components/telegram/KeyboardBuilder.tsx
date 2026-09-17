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
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  horizontalListSortingStrategy,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripHorizontal, GripVertical, Plus, Trash2 } from "lucide-react";
import type { InlineKeyboardRow } from "@/domain/project/types";
import {
  cloneKeyboard,
  findButtonLocation,
  moveButtonInKeyboard,
} from "@/domain/project/keyboard";
import { Button } from "@/components/ui/Button";
import { useProjectStore } from "@/store/project-store";
import { useTranslations } from "@/i18n/use-translations";
import { formatTemplate } from "@/i18n/translations";

function SortableButton({
  screenId,
  rowId,
  buttonId,
  text,
  selected,
}: {
  screenId: string;
  rowId: string;
  buttonId: string;
  text: string;
  selected: boolean;
}) {
  const t = useTranslations();
  const select = useProjectStore((state) => state.selectInlineButton);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: buttonId,
    data: { kind: "button", rowId },
  });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`group flex min-w-0 items-stretch overflow-hidden rounded-[9px] text-[#65bff5] shadow-sm transition ${
        selected ? "bg-[#2a536b] ring-2 ring-sky-400/70" : "bg-[#20384b] hover:bg-[#29475e]"
      } ${isDragging ? "opacity-40" : ""}`}
    >
      <button
        {...attributes}
        {...listeners}
        type="button"
        className="cursor-grab touch-none border-r border-white/5 px-2 text-[#65bff5]/45 transition hover:bg-white/5 hover:text-[#65bff5]"
        aria-label={formatTemplate(t.inline.drag, { text: text || t.inline.untitled })}
      >
        <GripHorizontal size={12} />
      </button>
      <button
        type="button"
        className="min-w-0 flex-1 truncate px-2 py-2.5 text-center text-xs font-semibold"
        onClick={() => select(screenId, rowId, buttonId)}
      >
        {text || t.inline.untitled}
      </button>
    </div>
  );
}

function SortableRow({
  screenId,
  row,
  selectedButtonId,
}: {
  screenId: string;
  row: InlineKeyboardRow;
  selectedButtonId?: string;
}) {
  const t = useTranslations();
  const removeRow = useProjectStore((state) => state.removeRow);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: row.id,
    data: { kind: "row" },
  });
  const { setNodeRef: setDropRef, isOver } = useDroppable({
    id: `drop:${row.id}`,
    data: { kind: "row-drop", rowId: row.id },
  });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`flex items-center gap-2 ${isDragging ? "opacity-40" : ""}`}
    >
      <button
        {...attributes}
        {...listeners}
        type="button"
        className="cursor-grab touch-none rounded-lg p-2 text-slate-600 transition hover:bg-slate-800 hover:text-slate-300"
        aria-label={t.inline.reorderRow}
      >
        <GripVertical size={14} />
      </button>

      <div
        ref={setDropRef}
        className={`grid min-h-11 min-w-0 flex-1 gap-1 rounded-[11px] p-1 transition ${
          isOver ? "bg-sky-500/10 ring-1 ring-sky-400/50" : "bg-[#132534]"
        }`}
        style={{
          gridTemplateColumns: `repeat(${Math.max(1, row.buttons.length)}, minmax(0, 1fr))`,
        }}
      >
        <SortableContext
          items={row.buttons.map((button) => button.id)}
          strategy={horizontalListSortingStrategy}
        >
          {row.buttons.map((button) => (
            <SortableButton
              key={button.id}
              screenId={screenId}
              rowId={row.id}
              buttonId={button.id}
              text={button.text}
              selected={selectedButtonId === button.id}
            />
          ))}
        </SortableContext>
        {row.buttons.length === 0 ? (
          <div className="grid place-items-center py-2 text-[11px] text-slate-600">{t.inline.drop}</div>
        ) : null}
      </div>

      <button
        type="button"
        onClick={() => removeRow(screenId, row.id)}
        className="rounded-lg p-2 text-slate-600 transition hover:bg-rose-500/10 hover:text-rose-400"
        aria-label={t.inline.deleteRow}
      >
        <Trash2 size={13} />
      </button>
    </div>
  );
}

function targetRow(
  rows: InlineKeyboardRow[],
  overId: string,
): { rowId: string; index: number } | null {
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

export function KeyboardBuilder({
  screenId,
  keyboard,
  selectedButtonId,
}: {
  screenId: string;
  keyboard: InlineKeyboardRow[];
  selectedButtonId?: string;
}) {
  const t = useTranslations();
  const addRow = useProjectStore((state) => state.addRow);
  const addButton = useProjectStore((state) => state.addButton);
  const replaceKeyboard = useProjectStore((state) => state.replaceKeyboard);
  const [draft, setDraft] = useState<InlineKeyboardRow[]>(keyboard);
  const draftRef = useRef<InlineKeyboardRow[]>(keyboard);
  const [dragging, setDragging] = useState(false);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );
  const rendered = dragging ? draft : keyboard;
  const rowIds = useMemo(() => rendered.map((row) => row.id), [rendered]);

  function start() {
    const initial = cloneKeyboard(keyboard);
    draftRef.current = initial;
    setDraft(initial);
    setDragging(true);
  }

  function over(event: DragOverEvent) {
    if (event.active.data.current?.kind !== "button" || !event.over) return;
    const current = draftRef.current;
    const destination = targetRow(current, String(event.over.id));
    if (!destination) return;
    const next = moveButtonInKeyboard(
      current,
      String(event.active.id),
      destination.rowId,
      destination.index,
    );
    draftRef.current = next;
    setDraft(next);
  }

  function end(event: DragEndEvent) {
    const kind = event.active.data.current?.kind;

    if (kind === "row" && event.over) {
      const current = draftRef.current;
      const oldIndex = current.findIndex((row) => row.id === String(event.active.id));
      const raw = String(event.over.id);
      const location = findButtonLocation(current, raw);
      const overId = raw.startsWith("drop:") ? raw.slice(5) : location?.rowId ?? raw;
      const newIndex = current.findIndex((row) => row.id === overId);
      replaceKeyboard(
        screenId,
        oldIndex >= 0 && newIndex >= 0 ? arrayMove(current, oldIndex, newIndex) : current,
      );
    } else if (kind === "button") {
      let next = draftRef.current;
      if (event.over) {
        const destination = targetRow(next, String(event.over.id));
        if (destination) {
          next = moveButtonInKeyboard(
            next,
            String(event.active.id),
            destination.rowId,
            destination.index,
          );
        }
      }
      replaceKeyboard(screenId, next);
    }

    draftRef.current = keyboard;
    setDragging(false);
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-slate-200">{t.inline.title}</div>
          <div className="text-xs text-slate-500">{t.inline.hint}</div>
        </div>
        <div className="flex shrink-0 gap-2">
          <Button className="h-8" onClick={() => addRow(screenId)}>
            <Plus size={14} />
            {t.inline.row}
          </Button>
          <Button className="h-8" onClick={() => addButton(screenId, keyboard.at(-1)?.id)}>
            <Plus size={14} />
            {t.inline.button}
          </Button>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-800 bg-[#0e1b26] p-3 shadow-inner shadow-black/20">
        <DndContext
          sensors={sensors}
          onDragStart={start}
          onDragOver={over}
          onDragEnd={end}
          onDragCancel={() => {
            draftRef.current = keyboard;
            setDraft(keyboard);
            setDragging(false);
          }}
        >
          <SortableContext items={rowIds} strategy={verticalListSortingStrategy}>
            <div className="space-y-1.5">
              {rendered.map((row) => (
                <SortableRow
                  key={row.id}
                  screenId={screenId}
                  row={row}
                  selectedButtonId={selectedButtonId}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>

        {keyboard.length === 0 ? (
          <button
            type="button"
            onClick={() => addButton(screenId)}
            className="w-full rounded-[9px] bg-[#20384b] py-3 text-sm font-semibold text-[#65bff5] transition hover:bg-[#29475e]"
          >
            {t.inline.addFirst}
          </button>
        ) : null}
      </div>
    </div>
  );
}
