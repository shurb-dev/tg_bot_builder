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
  horizontalListSortingStrategy,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripHorizontal, GripVertical, Plus, Trash2 } from "lucide-react";
import type { ReplyKeyboardRow, Screen } from "@/domain/project/types";
import {
  cloneReplyKeyboard,
  findReplyButtonLocation,
  moveReplyButton,
  moveReplyRow,
} from "@/domain/project/keyboard";
import { Button } from "@/components/ui/Button";
import { Field, inputClass } from "@/components/ui/Field";
import { useProjectStore } from "@/store/project-store";
import { useTranslations } from "@/i18n/use-translations";
import { formatTemplate } from "@/i18n/translations";

function ReplyButton({
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
  const select = useProjectStore((state) => state.selectReplyButton);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: buttonId,
    data: { kind: "reply-button", rowId },
  });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`flex min-w-0 items-stretch overflow-hidden rounded-[7px] text-slate-100 shadow-sm transition ${
        selected ? "bg-[#456376] ring-2 ring-sky-400/60" : "bg-[#314452] hover:bg-[#3a5262]"
      } ${isDragging ? "opacity-40" : ""}`}
    >
      <button
        {...attributes}
        {...listeners}
        type="button"
        className="cursor-grab touch-none border-r border-white/5 px-2 text-slate-400/60 transition hover:bg-white/5 hover:text-slate-100"
        aria-label={formatTemplate(t.reply.drag, { text: text || t.inline.untitled })}
      >
        <GripHorizontal size={12} />
      </button>
      <button
        type="button"
        className="min-w-0 flex-1 truncate px-2 py-2.5 text-center text-xs font-medium"
        onClick={() => select(screenId, rowId, buttonId)}
      >
        {text || t.inline.untitled}
      </button>
    </div>
  );
}

function ReplyRow({
  screenId,
  row,
  selectedButtonId,
}: {
  screenId: string;
  row: ReplyKeyboardRow;
  selectedButtonId?: string;
}) {
  const t = useTranslations();
  const removeRow = useProjectStore((state) => state.removeReplyRow);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: row.id,
    data: { kind: "reply-row" },
  });
  const { setNodeRef: setDropRef, isOver } = useDroppable({
    id: `reply-drop:${row.id}`,
    data: { kind: "reply-row-drop", rowId: row.id },
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
        aria-label={t.reply.reorderRow}
      >
        <GripVertical size={14} />
      </button>

      <div
        ref={setDropRef}
        className={`grid min-h-11 min-w-0 flex-1 gap-1 rounded-[10px] p-1 transition ${
          isOver ? "bg-sky-500/10 ring-1 ring-sky-400/50" : "bg-[#1b2935]"
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
            <ReplyButton
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
          <div className="grid place-items-center py-2 text-[11px] text-slate-600">{t.reply.drop}</div>
        ) : null}
      </div>

      <button
        type="button"
        onClick={() => removeRow(screenId, row.id)}
        className="rounded-lg p-2 text-slate-600 transition hover:bg-rose-500/10 hover:text-rose-400"
        aria-label={t.reply.deleteRow}
      >
        <Trash2 size={13} />
      </button>
    </div>
  );
}

function target(
  rows: ReplyKeyboardRow[],
  overId: string,
): { rowId: string; index: number } | null {
  if (overId.startsWith("reply-drop:")) {
    const rowId = overId.slice("reply-drop:".length);
    const row = rows.find((item) => item.id === rowId);
    return row ? { rowId, index: row.buttons.length } : null;
  }

  const row = rows.find((item) => item.id === overId);
  if (row) return { rowId: row.id, index: row.buttons.length };

  const location = findReplyButtonLocation(rows, overId);
  return location ? { rowId: location.rowId, index: location.index } : null;
}

export function ReplyKeyboardBuilder({
  screen,
  selectedButtonId,
}: {
  screen: Screen;
  selectedButtonId?: string;
}) {
  const t = useTranslations();
  const setMode = useProjectStore((state) => state.setReplyKeyboardMode);
  const updateOptions = useProjectStore((state) => state.updateReplyKeyboardOptions);
  const addRow = useProjectStore((state) => state.addReplyRow);
  const addButton = useProjectStore((state) => state.addReplyButton);
  const replaceRows = useProjectStore((state) => state.replaceReplyKeyboardRows);
  const rows = screen.replyKeyboard.mode === "show" ? screen.replyKeyboard.config.rows : [];
  const [draft, setDraft] = useState<ReplyKeyboardRow[]>(rows);
  const draftRef = useRef<ReplyKeyboardRow[]>(rows);
  const [dragging, setDragging] = useState(false);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );
  const rendered = dragging ? draft : rows;
  const rowIds = useMemo(() => rendered.map((row) => row.id), [rendered]);

  function start() {
    const initial = cloneReplyKeyboard(rows);
    draftRef.current = initial;
    setDraft(initial);
    setDragging(true);
  }

  function over(event: DragOverEvent) {
    if (event.active.data.current?.kind !== "reply-button" || !event.over) return;
    const current = draftRef.current;
    const destination = target(current, String(event.over.id));
    if (!destination) return;
    const next = moveReplyButton(
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
    let next = draftRef.current;

    if (kind === "reply-row" && event.over) {
      const oldIndex = next.findIndex((row) => row.id === String(event.active.id));
      const raw = String(event.over.id);
      const location = findReplyButtonLocation(next, raw);
      const overRow = raw.startsWith("reply-drop:")
        ? raw.slice("reply-drop:".length)
        : location?.rowId ?? raw;
      const newIndex = next.findIndex((row) => row.id === overRow);
      if (oldIndex >= 0 && newIndex >= 0) {
        next = moveReplyRow(next, String(event.active.id), newIndex);
      }
    }

    if (kind === "reply-button" && event.over) {
      const destination = target(next, String(event.over.id));
      if (destination) {
        next = moveReplyButton(
          next,
          String(event.active.id),
          destination.rowId,
          destination.index,
        );
      }
    }

    replaceRows(screen.id, next);
    setDragging(false);
    draftRef.current = rows;
  }

  function cancel() {
    draftRef.current = rows;
    setDraft(rows);
    setDragging(false);
  }

  return (
    <div className="space-y-4">
      <div>
        <div className="text-sm font-semibold text-slate-200">{t.reply.title}</div>
        <div className="text-xs text-slate-500">{t.reply.hint}</div>
      </div>

      <Field label={t.reply.mode}>
        <select
          aria-label={t.reply.mode}
          className={inputClass}
          value={screen.replyKeyboard.mode}
          onChange={(event) =>
            setMode(screen.id, event.target.value as "inherit" | "show" | "remove")
          }
        >
          <option value="inherit">{t.reply.inherit}</option>
          <option value="show">{t.reply.show}</option>
          <option value="remove">{t.reply.remove}</option>
        </select>
      </Field>

      {screen.replyKeyboard.mode === "inherit" ? (
        <div className="rounded-xl border border-dashed border-slate-800 p-4 text-xs text-slate-500">
          {t.reply.emptyInherited}
        </div>
      ) : null}

      {screen.replyKeyboard.mode === "remove" ? (
        <div className="rounded-xl border border-dashed border-slate-800 p-4 text-xs text-slate-500">
          {t.reply.emptyRemoved}
        </div>
      ) : null}

      {screen.replyKeyboard.mode === "show" ? (
        <>
          <div className="grid grid-cols-2 gap-3 text-xs text-slate-300">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={screen.replyKeyboard.config.resizeKeyboard}
                onChange={(event) =>
                  updateOptions(screen.id, { resizeKeyboard: event.target.checked })
                }
              />
              {t.reply.resize}
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={screen.replyKeyboard.config.isPersistent}
                onChange={(event) =>
                  updateOptions(screen.id, { isPersistent: event.target.checked })
                }
              />
              {t.reply.persistent}
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={screen.replyKeyboard.config.oneTimeKeyboard}
                onChange={(event) =>
                  updateOptions(screen.id, { oneTimeKeyboard: event.target.checked })
                }
              />
              {t.reply.oneTime}
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={screen.replyKeyboard.config.selective}
                onChange={(event) =>
                  updateOptions(screen.id, { selective: event.target.checked })
                }
              />
              {t.reply.selective}
            </label>
          </div>

          <Field label={t.reply.placeholder}>
            <input
              className={inputClass}
              value={screen.replyKeyboard.config.inputFieldPlaceholder ?? ""}
              placeholder={t.reply.placeholderExample}
              onChange={(event) =>
                updateOptions(screen.id, { inputFieldPlaceholder: event.target.value || null })
              }
            />
          </Field>

          <div className="flex justify-end gap-2">
            <Button className="h-8" onClick={() => addRow(screen.id)}>
              <Plus size={14} />
              {t.reply.row}
            </Button>
            <Button className="h-8" onClick={() => addButton(screen.id, rows.at(-1)?.id)}>
              <Plus size={14} />
              {t.reply.button}
            </Button>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-[#172635] p-3 shadow-inner shadow-black/20">
            <DndContext
              sensors={sensors}
              onDragStart={start}
              onDragOver={over}
              onDragEnd={end}
              onDragCancel={cancel}
            >
              <SortableContext items={rowIds} strategy={verticalListSortingStrategy}>
                <div className="space-y-1.5">
                  {rendered.map((row) => (
                    <ReplyRow
                      key={row.id}
                      screenId={screen.id}
                      row={row}
                      selectedButtonId={selectedButtonId}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>

            {rows.length === 0 ? (
              <button
                type="button"
                onClick={() => addButton(screen.id)}
                className="w-full rounded-[7px] bg-[#314452] py-3 text-sm font-medium text-slate-100 transition hover:bg-[#3a5262]"
              >
                {t.reply.addFirst}
              </button>
            ) : null}
          </div>
        </>
      ) : null}
    </div>
  );
}
