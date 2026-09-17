"use client";

import { useMemo, useState } from "react";
import { Play, RotateCcw, Send } from "lucide-react";
import { Button } from "@/components/ui/Button";
import type { FlowTarget } from "@/domain/project/types";
import { getScreen } from "@/domain/project/selectors";
import { getV12Translations } from "@/i18n/v12-translations";
import { usePreferencesStore } from "@/store/preferences-store";
import { useProjectStore } from "@/store/project-store";
import { continueSimulation, createSimulationState, runSimulation, submitSimulationInput } from "@/runtime/engine";
import type { SimulationState } from "@/runtime/types";

export function TestWorkspace() {
  const locale = usePreferencesStore((state) => state.locale);
  const t = getV12Translations(locale);
  const project = useProjectStore((state) => state.project);
  const selection = useProjectStore((state) => state.selection);
  const startScreen = useMemo(() => project.screens.find((screen) => screen.trigger?.command === "start") ?? project.screens[0], [project]);
  const [state, setState] = useState<SimulationState>(() => createSimulationState(project));
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);

  const currentScreen = state.currentTarget?.type === "screen" ? getScreen(project, state.currentTarget.screenId) : undefined;
  const start = async (target: FlowTarget) => {
    setBusy(true);
    try { setState(await runSimulation(project, createSimulationState(project, target))); } finally { setBusy(false); }
  };
  const selectedTarget: FlowTarget | null = selection?.type === "screen" ? { type: "screen", screenId: selection.screenId } : selection?.type === "logicNode" ? { type: "node", nodeId: selection.nodeId } : null;
  const choose = async (target: FlowTarget) => {
    setBusy(true);
    try { setState(await continueSimulation(project, state, target)); } finally { setBusy(false); }
  };
  const sendInput = async () => {
    if (!input.trim() || !state.waitingForInput) return;
    setBusy(true);
    try { setState(await submitSimulationInput(project, state, input)); setInput(""); } finally { setBusy(false); }
  };
  const restart = () => { setState(createSimulationState(project)); setInput(""); };

  const statusLabel = state.status === "waitingInput" ? t.waiting : state.status === "finished" ? t.finished : state.status === "running" ? t.running : state.status === "error" ? t.error : t.idle;
  const currentLabel = state.currentTarget?.type === "screen" ? project.screens.find((item) => item.id === state.currentTarget?.screenId)?.name : state.currentTarget?.type === "node" ? project.logicNodes.find((item) => item.id === state.currentTarget?.nodeId)?.name : "—";

  return (
    <div className="flex h-full min-h-0 bg-slate-950">
      <main className="flex min-w-0 flex-1 flex-col items-center overflow-y-auto p-5">
        <div className="mb-3 flex w-full max-w-[680px] items-center justify-between"><div><h2 className="text-sm font-semibold text-slate-100">{t.simulator}</h2><div className="text-xs text-slate-500">{statusLabel}</div></div><div className="flex gap-2"><Button className="h-8" onClick={restart}><RotateCcw size={13} />{t.restart}</Button>{startScreen ? <Button className="h-8 border-emerald-500/30 text-emerald-300" disabled={busy} onClick={() => start({ type: "screen", screenId: startScreen.id })}><Play size={13} />{t.startCommand}</Button> : null}{selectedTarget ? <Button className="h-8 border-violet-500/30 text-violet-300" disabled={busy} onClick={() => start(selectedTarget)}><Play size={13} />{t.startSelected}</Button> : null}</div></div>
        <div className="flex min-h-[600px] w-full max-w-[680px] flex-col overflow-hidden rounded-[28px] border border-slate-700 bg-[#0d1822] shadow-2xl">
          <div className="border-b border-white/10 bg-[#172635] px-5 py-4 text-sm font-semibold">TFlow Test Bot</div>
          <div className="flex flex-1 flex-col gap-2 overflow-y-auto p-4">
            {state.messages.length === 0 ? <div className="m-auto max-w-sm text-center text-sm text-slate-500">{t.chooseStart}</div> : state.messages.map((message) => <div key={message.id} className={`max-w-[80%] whitespace-pre-wrap rounded-2xl px-3 py-2 text-sm ${message.from === "user" ? "ml-auto bg-sky-600 text-white" : message.from === "system" ? "mx-auto bg-rose-500/10 text-rose-300" : "bg-[#182a38] text-slate-100"}`}>{message.text}</div>)}
            {state.error ? <div className="mx-auto rounded-lg bg-rose-500/10 px-3 py-2 text-xs text-rose-300">{state.error}</div> : null}
          </div>
          {currentScreen && state.status === "idle" ? <div className="space-y-1 border-t border-white/10 bg-[#172635] p-2">
            {currentScreen.inlineKeyboard.flatMap((row) => row.buttons).filter((button) => button.action.type === "screen" || button.action.type === "node").map((button) => <button key={button.id} className="w-full rounded-lg bg-[#20384b] px-3 py-2 text-xs text-sky-300" onClick={() => button.action.type === "screen" ? choose({ type: "screen", screenId: button.action.screenId }) : button.action.type === "node" ? choose({ type: "node", nodeId: button.action.nodeId }) : undefined}>{button.text}</button>)}
            {currentScreen.replyKeyboard.mode === "show" ? currentScreen.replyKeyboard.config.rows.flatMap((row) => row.buttons).filter((button) => button.action.type === "screen" || button.action.type === "node").map((button) => <button key={button.id} className="w-full rounded-lg bg-slate-700 px-3 py-2 text-xs text-slate-100" onClick={() => button.action.type === "screen" ? choose({ type: "screen", screenId: button.action.screenId }) : button.action.type === "node" ? choose({ type: "node", nodeId: button.action.nodeId }) : undefined}>{button.text}</button>) : null}
          </div> : null}
          <div className="flex gap-2 border-t border-white/10 bg-[#172635] p-2"><input aria-label={t.typeMessage} disabled={!state.waitingForInput || busy} className="min-w-0 flex-1 rounded-full bg-slate-800 px-4 py-2 text-sm outline-none disabled:opacity-40" placeholder={t.typeMessage} value={input} onChange={(event) => setInput(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") void sendInput(); }} /><button aria-label={t.send} disabled={!state.waitingForInput || busy} className="grid h-9 w-9 place-items-center rounded-full bg-sky-500 text-white disabled:opacity-30" onClick={() => void sendInput()}><Send size={15} /></button></div>
        </div>
      </main>
      <aside className="w-80 shrink-0 overflow-y-auto border-l border-slate-800 bg-slate-950/80 p-4"><h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">{t.runtime}</h3><div className="mt-4 space-y-4 text-xs"><Inspect title={t.status} value={statusLabel} /><Inspect title={t.currentTarget} value={currentLabel ?? "—"} /><JsonBlock title={t.inputValues} value={state.context.input} /><JsonBlock title={t.varsValues} value={state.context.vars} /><JsonBlock title={t.httpValues} value={state.context.http} /></div></aside>
    </div>
  );
}

function Inspect({ title, value }: { title: string; value: string }) { return <div><div className="text-slate-500">{title}</div><div className="mt-1 rounded-lg bg-slate-900 p-2 text-slate-200">{value}</div></div>; }
function JsonBlock({ title, value }: { title: string; value: unknown }) { return <div><div className="text-slate-500">{title}</div><pre className="mt-1 max-h-56 overflow-auto rounded-lg bg-slate-900 p-2 text-[11px] text-slate-300">{JSON.stringify(value, null, 2)}</pre></div>; }
