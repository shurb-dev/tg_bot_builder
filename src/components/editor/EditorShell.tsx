"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertCircle, X } from "lucide-react";
import { EditorHeader } from "./EditorHeader";
import { DesignWorkspace } from "./DesignWorkspace";
import { ValidationPanel } from "./ValidationPanel";
import { FlowEditor } from "@/components/flow/FlowEditor";
import { TestWorkspace } from "@/components/test/TestWorkspace";
import { CodeWorkspace } from "@/components/code/CodeWorkspace";
import { useProjectStore } from "@/store/project-store";
import { usePreferencesStore } from "@/store/preferences-store";
import { saveLocalProject } from "@/persistence/local-project";
import { exportProjectJson, importProjectJson, projectFilename } from "@/export/json";
import { generateAiogramProject } from "@/generators/aiogram";
import { buildProjectZip } from "@/export/zip";
import { hasBlockingErrors, validateProject } from "@/domain/project/validation";
import { useTranslations } from "@/i18n/use-translations";
import { formatTemplate } from "@/i18n/translations";

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob); const anchor = document.createElement("a"); anchor.href = url; anchor.download = filename; document.body.appendChild(anchor); anchor.click(); anchor.remove(); URL.revokeObjectURL(url);
}
function slug(value: string): string { return value.trim().toLowerCase().replace(/[^a-z0-9а-яё]+/gi, "-").replace(/^-+|-+$/g, "") || "telegram-bot"; }

export function EditorShell() {
  const t = useTranslations();
  const project = useProjectStore((state) => state.project); const mode = useProjectStore((state) => state.mode); const selectedScreenId = useProjectStore((state) => state.selectedScreenId);
  const hydrate = useProjectStore((state) => state.hydrate); const hydrationStatus = useProjectStore((state) => state.hydrationStatus); const recoveryMessage = useProjectStore((state) => state.recoveryMessage);
  const selectScreen = useProjectStore((state) => state.selectScreen); const replaceProject = useProjectStore((state) => state.replaceProject); const persistNow = useProjectStore((state) => state.persistNow);
  const undo = useProjectStore((state) => state.undo); const redo = useProjectStore((state) => state.redo); const selection = useProjectStore((state) => state.selection);
  const removeButton = useProjectStore((state) => state.removeButton); const removeReplyButton = useProjectStore((state) => state.removeReplyButton); const deleteLogicNode = useProjectStore((state) => state.deleteLogicNode); const clearSelection = useProjectStore((state) => state.clearSelection);
  const toast = useProjectStore((state) => state.toast); const setToast = useProjectStore((state) => state.setToast); const hydratePreferences = usePreferencesStore((state) => state.hydratePreferences);
  const [validationOpen, setValidationOpen] = useState(false); const [viewportWarning, setViewportWarning] = useState(false);
  const issues = useMemo(() => validateProject(project), [project]);

  useEffect(() => { hydratePreferences(); hydrate(); }, [hydrate, hydratePreferences]);
  useEffect(() => { if (hydrationStatus === "pending") return; const timer = window.setTimeout(() => saveLocalProject(window.localStorage, project), 400); return () => window.clearTimeout(timer); }, [project, hydrationStatus]);
  useEffect(() => { if (selectedScreenId && !project.screens.some((screen) => screen.id === selectedScreenId)) { const fallback = project.screens[0]; if (fallback) selectScreen(fallback.id); } }, [project, selectedScreenId, selectScreen]);
  useEffect(() => { const update = () => setViewportWarning(window.innerWidth < 1100); update(); window.addEventListener("resize", update); return () => window.removeEventListener("resize", update); }, []);
  useEffect(() => {
    const listener = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null; const typing = target?.tagName === "INPUT" || target?.tagName === "TEXTAREA" || target?.isContentEditable; const mod = event.ctrlKey || event.metaKey;
      if (mod && event.key.toLowerCase() === "s") { event.preventDefault(); persistNow(); setToast(t.toast.projectSaved); return; }
      if (mod && event.key.toLowerCase() === "z") { event.preventDefault(); if (event.shiftKey) redo(); else undo(); return; }
      if (event.key === "Escape") { if (validationOpen) setValidationOpen(false); else clearSelection(); return; }
      if (!typing && (event.key === "Delete" || event.key === "Backspace")) {
        if (selection?.type === "inlineButton") { event.preventDefault(); removeButton(selection.screenId, selection.rowId, selection.buttonId); }
        else if (selection?.type === "replyButton") { event.preventDefault(); removeReplyButton(selection.screenId, selection.rowId, selection.buttonId); }
        else if (selection?.type === "logicNode") { event.preventDefault(); deleteLogicNode(selection.nodeId); }
      }
    };
    window.addEventListener("keydown", listener); return () => window.removeEventListener("keydown", listener);
  }, [persistNow, undo, redo, clearSelection, selection, removeButton, removeReplyButton, deleteLogicNode, validationOpen, setToast, t]);
  useEffect(() => { if (!toast) return; const timer = window.setTimeout(() => setToast(null), 1800); return () => window.clearTimeout(timer); }, [toast, setToast]);

  function exportJson() { try { downloadBlob(new Blob([exportProjectJson(project)], { type: "application/json;charset=utf-8" }), projectFilename(project.name)); setToast(t.toast.jsonExported); } catch { setToast(t.toast.jsonExportFailed); } }
  async function importFile(file: File) {
    try { const imported = importProjectJson(await file.text()); const importedIssues = validateProject(imported); const count = importedIssues.filter((item) => item.severity === "error").length; if (hasBlockingErrors(importedIssues)) { setToast(formatTemplate(t.toast.importBlocked, { count })); return; } if (!window.confirm(formatTemplate(t.confirm.replace, { name: imported.name }))) return; replaceProject(imported); setToast(t.toast.projectImported); } catch { setToast(t.toast.importFailed); }
  }
  async function exportZip() { if (hasBlockingErrors(issues)) { setValidationOpen(true); return; } try { const blob = await buildProjectZip(generateAiogramProject(project)); downloadBlob(blob, `${slug(project.name)}-aiogram.zip`); setToast(t.toast.zipExported); } catch { setToast(t.toast.zipFailed); } }

  if (hydrationStatus === "pending") return <div className="grid h-screen place-items-center bg-slate-950 text-sm text-slate-500">{t.shell.loading}</div>;
  return <div className="flex h-screen min-h-0 flex-col overflow-hidden bg-slate-950 text-slate-100">
    <EditorHeader issues={issues} onValidate={() => setValidationOpen(true)} onExportJson={exportJson} onExportZip={exportZip} onImportFile={importFile} />
    {recoveryMessage ? <div className="flex items-center gap-2 border-b border-amber-500/20 bg-amber-500/10 px-4 py-2 text-xs text-amber-200"><AlertCircle size={14} />{t.shell.recovery}</div> : null}
    {viewportWarning ? <div className="border-b border-sky-500/20 bg-sky-500/10 px-4 py-2 text-center text-xs text-sky-200">{t.shell.desktop}</div> : null}
    <div className="min-h-0 flex-1">{mode === "design" ? <DesignWorkspace /> : null}{mode === "flow" ? <FlowEditor /> : null}{mode === "test" ? <TestWorkspace /> : null}{mode === "code" ? <CodeWorkspace /> : null}</div>
    {validationOpen ? <ValidationPanel issues={issues} onClose={() => setValidationOpen(false)} /> : null}
    {toast ? <div className="fixed bottom-5 left-1/2 z-[60] flex -translate-x-1/2 items-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-4 py-2 text-sm text-slate-200 shadow-2xl"><span>{toast}</span><button aria-label={t.shell.dismiss} onClick={() => setToast(null)} className="text-slate-500 hover:text-white"><X size={14} /></button></div> : null}
  </div>;
}
