"use client";

import { useRef } from "react";
import { AlertTriangle, CheckCircle2, Download, FileJson, FolderOpen, RotateCcw, Save, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { inputClass } from "@/components/ui/Field";
import { useProjectStore } from "@/store/project-store";
import type { ValidationIssue } from "@/domain/project/validation";

export function EditorHeader({ issues, onValidate, onExportJson, onExportZip, onImportFile }: {
  issues: ValidationIssue[];
  onValidate: () => void;
  onExportJson: () => void;
  onExportZip: () => void;
  onImportFile: (file: File) => void;
}) {
  const project = useProjectStore((state) => state.project);
  const mode = useProjectStore((state) => state.mode);
  const setMode = useProjectStore((state) => state.setMode);
  const renameProject = useProjectStore((state) => state.renameProject);
  const newProject = useProjectStore((state) => state.newProject);
  const resetDemo = useProjectStore((state) => state.resetDemo);
  const persistNow = useProjectStore((state) => state.persistNow);
  const inputRef = useRef<HTMLInputElement>(null);
  const errors = issues.filter((item) => item.severity === "error").length;
  const warnings = issues.filter((item) => item.severity === "warning").length;

  return (
    <header className="flex h-14 shrink-0 items-center gap-3 border-b border-slate-800 bg-slate-950 px-3">
      <div className="flex items-center gap-2 pr-2">
        <div className="grid h-8 w-8 place-items-center rounded-xl bg-sky-500 text-white shadow-lg shadow-sky-500/20"><Sparkles size={16} /></div>
        <div className="hidden text-sm font-semibold text-slate-100 xl:block">TFlow</div>
      </div>
      <input className={`${inputClass} h-8 w-52 border-slate-800 bg-slate-900`} value={project.name} onChange={(event) => renameProject(event.target.value)} aria-label="Project name" />
      <nav className="ml-2 flex rounded-lg border border-slate-800 bg-slate-900 p-1">
        {(["design", "flow", "code"] as const).map((item) => (
          <button key={item} onClick={() => setMode(item)} className={`rounded-md px-3 py-1.5 text-xs font-medium capitalize transition ${mode === item ? "bg-slate-700 text-white" : "text-slate-500 hover:text-slate-200"}`}>{item}</button>
        ))}
      </nav>
      <div className="ml-auto flex items-center gap-1.5">
        <Button className={`h-8 ${errors > 0 ? "border-rose-500/30 text-rose-300" : warnings > 0 ? "border-amber-500/30 text-amber-300" : "border-emerald-500/30 text-emerald-300"}`} onClick={onValidate}>
          {errors > 0 ? <AlertTriangle size={14} /> : <CheckCircle2 size={14} />}
          {errors > 0 ? `${errors} errors` : warnings > 0 ? `${warnings} warnings` : "Valid"}
        </Button>
        <Button className="h-8" onClick={() => { if (window.confirm("Create a new project? Your current project is autosaved locally.")) newProject(); }} title="New project"><FileJson size={14} /><span className="hidden 2xl:inline">New</span></Button>
        <Button className="h-8" onClick={() => inputRef.current?.click()} title="Import project"><FolderOpen size={14} /><span className="hidden 2xl:inline">Import</span></Button>
        <input ref={inputRef} type="file" accept=".json,.tgbot.json,application/json" className="hidden" onChange={(event) => { const file = event.target.files?.[0]; if (file) onImportFile(file); event.currentTarget.value = ""; }} />
        <Button className="h-8" onClick={onExportJson} title="Export JSON"><FileJson size={14} /><span className="hidden 2xl:inline">JSON</span></Button>
        <Button className="h-8 border-sky-500/30 text-sky-300" onClick={onExportZip} disabled={errors > 0} title="Export aiogram ZIP"><Download size={14} /><span className="hidden 2xl:inline">aiogram</span></Button>
        <Button className="h-8" onClick={persistNow} title="Save now"><Save size={14} /></Button>
        <Button className="h-8" onClick={() => { if (window.confirm("Reset the active project to the demo project?")) resetDemo(); }} title="Reset to demo"><RotateCcw size={14} /></Button>
      </div>
    </header>
  );
}
