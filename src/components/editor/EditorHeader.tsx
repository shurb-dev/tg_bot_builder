"use client";

import { useRef } from "react";
import { AlertTriangle, CheckCircle2, Download, FileJson, FolderOpen, Globe2, RotateCcw, Save, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { inputClass } from "@/components/ui/Field";
import { useProjectStore } from "@/store/project-store";
import { usePreferencesStore } from "@/store/preferences-store";
import type { ValidationIssue } from "@/domain/project/validation";
import { useTranslations } from "@/i18n/use-translations";
import { getV12Translations } from "@/i18n/v12-translations";
import { formatTemplate } from "@/i18n/translations";

export function EditorHeader({ issues, onValidate, onExportJson, onExportZip, onImportFile }: { issues: ValidationIssue[]; onValidate: () => void; onExportJson: () => void; onExportZip: () => void; onImportFile: (file: File) => void }) {
  const t = useTranslations();
  const locale = usePreferencesStore((state) => state.locale);
  const v12 = getV12Translations(locale);
  const setLocale = usePreferencesStore((state) => state.setLocale);
  const project = useProjectStore((state) => state.project);
  const mode = useProjectStore((state) => state.mode);
  const setMode = useProjectStore((state) => state.setMode);
  const renameProject = useProjectStore((state) => state.renameProject);
  const newProject = useProjectStore((state) => state.newProject);
  const resetDemo = useProjectStore((state) => state.resetDemo);
  const persistNow = useProjectStore((state) => state.persistNow);
  const setToast = useProjectStore((state) => state.setToast);
  const inputRef = useRef<HTMLInputElement>(null);
  const errors = issues.filter((item) => item.severity === "error").length;
  const warnings = issues.filter((item) => item.severity === "warning").length;
  const modeLabel = { design: t.nav.design, flow: t.nav.flow, test: v12.test, code: t.nav.code };
  const save = () => { persistNow(); setToast(t.toast.projectSaved); };

  return <header className="flex h-14 shrink-0 items-center gap-3 border-b border-slate-800 bg-slate-950 px-3">
    <div className="flex items-center gap-2 pr-2"><div className="grid h-8 w-8 place-items-center rounded-xl bg-sky-500 text-white shadow-lg shadow-sky-500/20"><Sparkles size={16} /></div><div className="hidden text-sm font-semibold text-slate-100 xl:block">{t.app.name}</div></div>
    <input className={`${inputClass} h-8 w-52 border-slate-800 bg-slate-900`} value={project.name} onChange={(event) => renameProject(event.target.value)} aria-label={t.header.projectName} />
    <nav className="ml-2 flex rounded-lg border border-slate-800 bg-slate-900 p-1">{(["design", "flow", "test", "code"] as const).map((item) => <button key={item} onClick={() => setMode(item)} className={`rounded-md px-3 py-1.5 text-xs font-medium transition ${mode === item ? "bg-slate-700 text-white" : "text-slate-500 hover:text-slate-200"}`}>{modeLabel[item]}</button>)}</nav>
    <div className="ml-auto flex items-center gap-1.5">
      <label className="flex h-8 items-center gap-1 rounded-lg border border-slate-800 bg-slate-900 px-2 text-xs text-slate-400"><Globe2 size={13} /><select aria-label={t.language.label} className="bg-transparent text-slate-200 outline-none" value={locale} onChange={(event) => setLocale(event.target.value as "ru" | "en")}><option value="en">{t.language.english}</option><option value="ru">{t.language.russian}</option></select></label>
      <Button className={`h-8 ${errors > 0 ? "border-rose-500/30 text-rose-300" : warnings > 0 ? "border-amber-500/30 text-amber-300" : "border-emerald-500/30 text-emerald-300"}`} onClick={onValidate}>{errors > 0 ? <AlertTriangle size={14} /> : <CheckCircle2 size={14} />}{errors > 0 ? formatTemplate(t.header.errors, { count: errors }) : warnings > 0 ? formatTemplate(t.header.warnings, { count: warnings }) : t.header.valid}</Button>
      <Button className="h-8" onClick={() => { if (window.confirm(t.confirm.newProject)) newProject(); }} title={t.header.newProject}><FileJson size={14} /></Button>
      <Button className="h-8" onClick={() => inputRef.current?.click()} title={t.header.importProject}><FolderOpen size={14} /></Button>
      <input ref={inputRef} type="file" accept=".json,.tgbot.json,application/json" className="hidden" onChange={(event) => { const file = event.target.files?.[0]; if (file) onImportFile(file); event.currentTarget.value = ""; }} />
      <Button className="h-8" onClick={onExportJson} title={t.header.exportJson}><FileJson size={14} /></Button>
      <Button className="h-8 border-sky-500/30 text-sky-300" onClick={onExportZip} disabled={errors > 0} title={t.header.exportZip}><Download size={14} /></Button>
      <Button className="h-8" onClick={save} title={t.header.save}><Save size={14} /></Button>
      <Button className="h-8" onClick={() => { if (window.confirm(t.confirm.reset)) resetDemo(); }} title={t.header.reset}><RotateCcw size={14} /></Button>
    </div>
  </header>;
}
