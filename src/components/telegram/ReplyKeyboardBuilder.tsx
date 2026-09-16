"use client";

import { useMemo, useRef, useState } from "react";
import { DndContext, PointerSensor, useDroppable, useSensor, useSensors, type DragEndEvent, type DragOverEvent } from "@dnd-kit/core";
import { SortableContext, useSortable, verticalListSortingStrategy, horizontalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripHorizontal, GripVertical, Plus, Trash2 } from "lucide-react";
import type { ReplyKeyboardRow, Screen } from "@/domain/project/types";
import { cloneReplyKeyboard, findReplyButtonLocation, moveReplyButton, moveReplyRow } from "@/domain/project/keyboard";
import { Button } from "@/components/ui/Button";
import { Field, inputClass } from "@/components/ui/Field";
import { useProjectStore } from "@/store/project-store";
import { useTranslations } from "@/i18n/use-translations";
import { formatTemplate } from "@/i18n/translations";

function ReplyButton({ screenId, rowId, buttonId, text, selected }: { screenId: string; rowId: string; buttonId: string; text: string; selected: boolean }) {
  const t = useTranslations();
  const select = useProjectStore((state) => state.selectReplyButton);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: buttonId, data: { kind: "reply-button", rowId } });
  return <div ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition }} className={`flex min-w-0 items-center rounded-lg border bg-slate-950 ${selected ? "border-sky-500" : "border-slate-700"} ${isDragging ? "opacity-40" : ""}`}><button {...attributes} {...listeners} className="cursor-grab touch-none p-2 text-slate-600 hover:text-slate-300" aria-label={formatTemplate(t.reply.drag, { text: text || t.inline.untitled })}><GripHorizontal size={13} /></button><button className="min-w-0 flex-1 truncate px-1 py-2 text-left text-xs text-slate-200" onClick={() => select(screenId, rowId, buttonId)}>{text || t.inline.untitled}</button></div>;
}

function ReplyRow({ screenId, row, selectedButtonId }: { screenId: string; row: ReplyKeyboardRow; selectedButtonId?: string }) {
  const t = useTranslations();
  const removeRow = useProjectStore((state) => state.removeReplyRow);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: row.id, data: { kind: "reply-row" } });
  const { setNodeRef: setDropRef, isOver } = useDroppable({ id: `reply-drop:${row.id}`, data: { kind: "reply-row-drop", rowId: row.id } });
  return <div ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition }} className={`rounded-xl border p-2 ${isDragging ? "opacity-40" : "border-slate-800 bg-slate-900/50"}`}><div className="mb-2 flex items-center justify-between"><button {...attributes} {...listeners} className="cursor-grab touch-none rounded p-1 text-slate-600 hover:text-slate-300" aria-label={t.reply.reorderRow}><GripVertical size={14} /></button><button onClick={() => removeRow(screenId, row.id)} className="rounded p-1 text-slate-600 hover:bg-rose-500/10 hover:text-rose-400" aria-label={t.reply.deleteRow}><Trash2 size={13} /></button></div><div ref={setDropRef} className={`grid min-h-11 gap-2 rounded-lg border border-dashed p-2 ${isOver ? "border-sky-500 bg-sky-500/5" : "border-slate-800"}`} style={{ gridTemplateColumns: `repeat(${Math.max(1, row.buttons.length)}, minmax(0, 1fr))` }}><SortableContext items={row.buttons.map((button) => button.id)} strategy={horizontalListSortingStrategy}>{row.buttons.map((button) => <ReplyButton key={button.id} screenId={screenId} rowId={row.id} buttonId={button.id} text={button.text} selected={selectedButtonId === button.id} />)}</SortableContext>{row.buttons.length === 0 ? <div className="grid place-items-center py-2 text-[11px] text-slate-600">{t.reply.drop}</div> : null}</div></div>;
}

function target(rows: ReplyKeyboardRow[], overId: string): { rowId: string; index: number } | null {
  if (overId.startsWith("reply-drop:")) { const rowId = overId.slice("reply-drop:".length); const row = rows.find((item) => item.id === rowId); return row ? { rowId, index: row.buttons.length } : null; }
  const row = rows.find((item) => item.id === overId); if (row) return { rowId: row.id, index: row.buttons.length };
  const location = findReplyButtonLocation(rows, overId); return location ? { rowId: location.rowId, index: location.index } : null;
}

export function ReplyKeyboardBuilder({ screen, selectedButtonId }: { screen: Screen; selectedButtonId?: string }) {
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
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));
  const rendered = dragging ? draft : rows;
  const rowIds = useMemo(() => rendered.map((row) => row.id), [rendered]);

  function start() { const initial = cloneReplyKeyboard(rows); draftRef.current = initial; setDraft(initial); setDragging(true); }
  function over(event: DragOverEvent) { if (event.active.data.current?.kind !== "reply-button" || !event.over) return; const current = draftRef.current; const destination = target(current, String(event.over.id)); if (!destination) return; const next = moveReplyButton(current, String(event.active.id), destination.rowId, destination.index); draftRef.current = next; setDraft(next); }
  function end(event: DragEndEvent) {
    const kind = event.active.data.current?.kind; let next = draftRef.current;
    if (kind === "reply-row" && event.over) { const oldIndex = next.findIndex((row) => row.id === String(event.active.id)); const raw = String(event.over.id); const location = findReplyButtonLocation(next, raw); const overRow = raw.startsWith("reply-drop:") ? raw.slice("reply-drop:".length) : location?.rowId ?? raw; const newIndex = next.findIndex((row) => row.id === overRow); if (oldIndex >= 0 && newIndex >= 0) next = moveReplyRow(next, String(event.active.id), newIndex); }
    if (kind === "reply-button" && event.over) { const destination = target(next, String(event.over.id)); if (destination) next = moveReplyButton(next, String(event.active.id), destination.rowId, destination.index); }
    replaceRows(screen.id, next); setDragging(false); draftRef.current = rows;
  }
  function cancel() { draftRef.current = rows; setDraft(rows); setDragging(false); }

  return <div className="space-y-4"><div><div className="text-sm font-semibold text-slate-200">{t.reply.title}</div><div className="text-xs text-slate-500">{t.reply.hint}</div></div><Field label={t.reply.mode}><select aria-label={t.reply.mode} className={inputClass} value={screen.replyKeyboard.mode} onChange={(event) => setMode(screen.id, event.target.value as "inherit" | "show" | "remove")}><option value="inherit">{t.reply.inherit}</option><option value="show">{t.reply.show}</option><option value="remove">{t.reply.remove}</option></select></Field>{screen.replyKeyboard.mode === "inherit" ? <div className="rounded-xl border border-dashed border-slate-800 p-4 text-xs text-slate-500">{t.reply.emptyInherited}</div> : null}{screen.replyKeyboard.mode === "remove" ? <div className="rounded-xl border border-dashed border-slate-800 p-4 text-xs text-slate-500">{t.reply.emptyRemoved}</div> : null}{screen.replyKeyboard.mode === "show" ? <><div className="grid grid-cols-2 gap-3 text-xs text-slate-300"><label className="flex items-center gap-2"><input type="checkbox" checked={screen.replyKeyboard.config.resizeKeyboard} onChange={(event) => updateOptions(screen.id, { resizeKeyboard: event.target.checked })} />{t.reply.resize}</label><label className="flex items-center gap-2"><input type="checkbox" checked={screen.replyKeyboard.config.isPersistent} onChange={(event) => updateOptions(screen.id, { isPersistent: event.target.checked })} />{t.reply.persistent}</label><label className="flex items-center gap-2"><input type="checkbox" checked={screen.replyKeyboard.config.oneTimeKeyboard} onChange={(event) => updateOptions(screen.id, { oneTimeKeyboard: event.target.checked })} />{t.reply.oneTime}</label><label className="flex items-center gap-2"><input type="checkbox" checked={screen.replyKeyboard.config.selective} onChange={(event) => updateOptions(screen.id, { selective: event.target.checked })} />{t.reply.selective}</label></div><Field label={t.reply.placeholder}><input className={inputClass} value={screen.replyKeyboard.config.inputFieldPlaceholder ?? ""} placeholder={t.reply.placeholderExample} onChange={(event) => updateOptions(screen.id, { inputFieldPlaceholder: event.target.value || null })} /></Field><div className="flex justify-end gap-2"><Button className="h-8" onClick={() => addRow(screen.id)}><Plus size={14} />{t.reply.row}</Button><Button className="h-8" onClick={() => addButton(screen.id, rows.at(-1)?.id)}><Plus size={14} />{t.reply.button}</Button></div><DndContext sensors={sensors} onDragStart={start} onDragOver={over} onDragEnd={end} onDragCancel={cancel}><SortableContext items={rowIds} strategy={verticalListSortingStrategy}><div className="space-y-2">{rendered.map((row) => <ReplyRow key={row.id} screenId={screen.id} row={row} selectedButtonId={selectedButtonId} />)}</div></SortableContext></DndContext>{rows.length === 0 ? <button onClick={() => addButton(screen.id)} className="w-full rounded-xl border border-dashed border-slate-700 py-5 text-sm text-slate-500 hover:border-sky-500/50 hover:text-slate-300">{t.reply.addFirst}</button> : null}</> : null}</div>;
}
