"use client";

import { Copy, Plus, Settings, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useProjectStore } from "@/store/project-store";
import { useTranslations } from "@/i18n/use-translations";
import { formatTemplate } from "@/i18n/translations";

export function ScreenSidebar() {
  const t = useTranslations();
  const project = useProjectStore((state) => state.project);
  const selectedScreenId = useProjectStore((state) => state.selectedScreenId);
  const selection = useProjectStore((state) => state.selection);
  const selectScreen = useProjectStore((state) => state.selectScreen);
  const selectBotSettings = useProjectStore((state) => state.selectBotSettings);
  const createScreen = useProjectStore((state) => state.createScreen);
  const duplicateScreen = useProjectStore((state) => state.duplicateScreen);
  const deleteScreen = useProjectStore((state) => state.deleteScreen);

  function confirmDelete(screenId: string, screenName: string) {
    const inbound = project.screens.reduce((count, screen) => {
      const inline = screen.inlineKeyboard.flatMap((row) => row.buttons).filter((button) => button.action.type === "screen" && button.action.screenId === screenId).length;
      const reply = screen.replyKeyboard.mode === "show" ? screen.replyKeyboard.config.rows.flatMap((row) => row.buttons).filter((button) => button.action.type === "screen" && button.action.screenId === screenId).length : 0;
      return count + inline + reply;
    }, 0);
    const extra = inbound > 0 ? formatTemplate(t.confirm.deleteReferenced, { count: inbound }) : "";
    if (window.confirm(`${formatTemplate(t.confirm.deleteScreen, { name: screenName })}${extra}`)) deleteScreen(screenId);
  }

  return <aside className="flex min-h-0 w-64 shrink-0 flex-col border-r border-slate-800 bg-slate-950/80"><div className="border-b border-slate-800 p-2"><button onClick={selectBotSettings} className={`flex w-full items-center gap-2 rounded-xl border px-3 py-2 text-left text-sm ${selection?.type === "botSettings" ? "border-sky-500/50 bg-sky-500/10 text-sky-200" : "border-slate-800 text-slate-400 hover:bg-slate-900"}`}><Settings size={15} />{t.sidebar.botSettings}</button></div><div className="flex items-center justify-between border-b border-slate-800 px-4 py-3"><div><div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{t.sidebar.screens}</div><div className="mt-0.5 text-xs text-slate-600">{formatTemplate(t.sidebar.total, { count: project.screens.length })}</div></div><Button className="h-8 w-8 p-0" onClick={createScreen} aria-label={t.sidebar.create} title={t.sidebar.create}><Plus size={15} /></Button></div><div className="min-h-0 flex-1 space-y-1 overflow-y-auto p-2">{project.screens.map((screen) => { const selected = selection?.type !== "botSettings" && screen.id === selectedScreenId; const inline = screen.inlineKeyboard.reduce((sum, row) => sum + row.buttons.length, 0); const reply = screen.replyKeyboard.mode === "show" ? screen.replyKeyboard.config.rows.reduce((sum, row) => sum + row.buttons.length, 0) : 0; return <div key={screen.id} className={`group rounded-xl border p-2 ${selected ? "border-sky-500/50 bg-sky-500/10" : "border-transparent hover:border-slate-800 hover:bg-slate-900"}`}><button className="w-full text-left" onClick={() => selectScreen(screen.id)}><div className="truncate text-sm font-medium text-slate-200">{screen.name || t.sidebar.unnamed}</div><div className="mt-1 flex items-center gap-2 text-[11px] text-slate-500"><span>{screen.trigger ? `/${screen.trigger.command}` : t.sidebar.noTrigger}</span><span>•</span><span>{formatTemplate(t.sidebar.buttons, { count: inline + reply })}</span></div></button><div className="mt-2 hidden gap-1 group-hover:flex"><button className="rounded-md p-1.5 text-slate-500 hover:bg-slate-800 hover:text-slate-200" onClick={() => duplicateScreen(screen.id)} title={t.sidebar.duplicate} aria-label={`${t.sidebar.duplicate}: ${screen.name}`}><Copy size={13} /></button><button className="rounded-md p-1.5 text-slate-500 hover:bg-rose-500/10 hover:text-rose-400 disabled:opacity-30" disabled={project.screens.length <= 1} onClick={() => confirmDelete(screen.id, screen.name)} title={t.sidebar.delete} aria-label={`${t.sidebar.delete}: ${screen.name}`}><Trash2 size={13} /></button></div></div>; })}</div><div className="border-t border-slate-800 p-3"><Button className="w-full" onClick={createScreen}><Plus size={15} />{t.sidebar.add}</Button></div></aside>;
}
