"use client";

import { useMemo, useState } from "react";
import { Check, Copy, FileCode2 } from "lucide-react";
import { generateAiogramProject } from "@/generators/aiogram";
import { useProjectStore } from "@/store/project-store";
import { validateProject, hasBlockingErrors } from "@/domain/project/validation";
import { useTranslations } from "@/i18n/use-translations";

export function CodeWorkspace() {
  const t = useTranslations(); const project = useProjectStore((state) => state.project); const issues = useMemo(() => validateProject(project), [project]); const generated = useMemo(() => { if (hasBlockingErrors(issues)) return null; try { return generateAiogramProject(project); } catch { return null; } }, [project, issues]); const [selectedPath, setSelectedPath] = useState("generated_bot/bot.py"); const [copied, setCopied] = useState(false); const selected = generated?.files.find((file) => file.path === selectedPath) ?? generated?.files[0];
  if (!generated) return <div className="grid h-full place-items-center bg-slate-950 p-8 text-center"><div><FileCode2 className="mx-auto mb-3 text-slate-600" size={32} /><div className="text-sm font-medium text-slate-300">{t.code.blocked}</div><div className="mt-1 text-xs text-slate-600">{t.code.blockedHint}</div></div></div>;
  async function copy() { if (!selected) return; await navigator.clipboard.writeText(selected.content); setCopied(true); window.setTimeout(() => setCopied(false), 1200); }
  return <div className="flex h-full min-h-0 bg-slate-950"><aside className="w-72 shrink-0 overflow-y-auto border-r border-slate-800 p-3"><div className="mb-3 px-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{t.code.files}</div>{generated.files.map((file) => <button key={file.path} className={`mb-1 flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-xs ${selected?.path === file.path ? "bg-sky-500/10 text-sky-300" : "text-slate-400 hover:bg-slate-900"}`} onClick={() => setSelectedPath(file.path)}><FileCode2 size={13} /><span className="truncate">{file.path.replace("generated_bot/", "")}</span></button>)}</aside><section className="flex min-w-0 flex-1 flex-col"><div className="flex h-11 items-center justify-between border-b border-slate-800 px-4 text-xs text-slate-500"><span>{selected?.path}</span><button onClick={copy} className="flex items-center gap-1 rounded px-2 py-1 hover:bg-slate-900 hover:text-slate-200">{copied ? <Check size={13} /> : <Copy size={13} />}{copied ? t.code.copied : t.code.copy}</button></div><pre className="min-h-0 flex-1 overflow-auto p-5 text-[12px] leading-5 text-slate-300"><code>{selected?.content}</code></pre></section></div>;
}
