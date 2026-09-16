"use client";

import { AlertTriangle, CheckCircle2, X, XCircle } from "lucide-react";
import type { ValidationIssue } from "@/domain/project/validation";
import { Button } from "@/components/ui/Button";
import { useProjectStore } from "@/store/project-store";

export function ValidationPanel({ issues, onClose }: { issues: ValidationIssue[]; onClose: () => void }) {
  const selectScreen = useProjectStore((state) => state.selectScreen);
  const selectButton = useProjectStore((state) => state.selectButton);
  const project = useProjectStore((state) => state.project);
  const setMode = useProjectStore((state) => state.setMode);
  const errors = issues.filter((item) => item.severity === "error");
  const warnings = issues.filter((item) => item.severity === "warning");

  function navigate(item: ValidationIssue) {
    if (!item.screenId) return;
    setMode("design");
    if (item.buttonId) {
      const screen = project.screens.find((candidate) => candidate.id === item.screenId);
      const row = screen?.keyboard.find((candidate) => candidate.buttons.some((button) => button.id === item.buttonId));
      if (row) selectButton(item.screenId, row.id, item.buttonId);
      else selectScreen(item.screenId);
    } else selectScreen(item.screenId);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/55 backdrop-blur-sm" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <div className="flex h-full w-full max-w-lg flex-col border-l border-slate-700 bg-slate-950 shadow-2xl">
        <div className="flex items-start justify-between border-b border-slate-800 p-5">
          <div>
            <div className="text-lg font-semibold text-white">Project validation</div>
            <div className="mt-1 text-sm text-slate-500">{errors.length} errors · {warnings.length} warnings</div>
          </div>
          <Button className="h-8 w-8 p-0" onClick={onClose} aria-label="Close validation"><X size={15} /></Button>
        </div>
        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-5">
          {issues.length === 0 ? (
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-300"><CheckCircle2 className="mb-2" />No validation issues. Project is ready to export.</div>
          ) : issues.map((item) => (
            <button key={item.id} onClick={() => navigate(item)} className={`w-full rounded-xl border p-3 text-left transition hover:brightness-110 ${item.severity === "error" ? "border-rose-500/30 bg-rose-500/10" : "border-amber-500/30 bg-amber-500/10"}`}>
              <div className="flex gap-3">
                {item.severity === "error" ? <XCircle className="mt-0.5 shrink-0 text-rose-400" size={17} /> : <AlertTriangle className="mt-0.5 shrink-0 text-amber-400" size={17} />}
                <div>
                  <div className={`text-sm ${item.severity === "error" ? "text-rose-200" : "text-amber-200"}`}>{item.message}</div>
                  <div className="mt-1 text-[11px] uppercase tracking-wide text-slate-600">{item.code}</div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
