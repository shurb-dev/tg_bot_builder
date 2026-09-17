"use client";

import { useMemo, useState } from "react";
import { Play, RotateCcw, Send } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { getScreen } from "@/domain/project/selectors";
import type { FlowTarget } from "@/domain/project/types";
import { getV12Translations } from "@/i18n/v12-translations";
import {
  continueSimulation,
  createSimulationState,
  runSimulation,
  submitSimulationInput,
} from "@/runtime/engine";
import type { SimulationState } from "@/runtime/types";
import { usePreferencesStore } from "@/store/preferences-store";
import { useProjectStore } from "@/store/project-store";

function navigationTarget(action: { type: string; screenId?: string; nodeId?: string }): FlowTarget | null {
  if (action.type === "screen" && action.screenId) {
    return { type: "screen", screenId: action.screenId };
  }
  if (action.type === "node" && action.nodeId) {
    return { type: "node", nodeId: action.nodeId };
  }
  return null;
}

export function TestWorkspace() {
  const locale = usePreferencesStore((state) => state.locale);
  const t = getV12Translations(locale);
  const project = useProjectStore((state) => state.project);
  const selection = useProjectStore((state) => state.selection);
  const startScreen = useMemo(
    () => project.screens.find((screen) => screen.trigger?.command === "start") ?? project.screens[0],
    [project],
  );
  const [state, setState] = useState<SimulationState>(() => createSimulationState(project));
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);

  const currentScreen =
    state.currentTarget?.type === "screen"
      ? getScreen(project, state.currentTarget.screenId)
      : undefined;

  const start = async (target: FlowTarget) => {
    setBusy(true);
    try {
      setState(await runSimulation(project, createSimulationState(project, target)));
    } finally {
      setBusy(false);
    }
  };

  const selectedTarget: FlowTarget | null =
    selection?.type === "screen"
      ? { type: "screen", screenId: selection.screenId }
      : selection?.type === "logicNode"
        ? { type: "node", nodeId: selection.nodeId }
        : null;

  const choose = async (target: FlowTarget) => {
    setBusy(true);
    try {
      setState(await continueSimulation(project, state, target));
    } finally {
      setBusy(false);
    }
  };

  const sendInput = async () => {
    if (!input.trim() || !state.waitingForInput) return;
    setBusy(true);
    try {
      setState(await submitSimulationInput(project, state, input));
      setInput("");
    } finally {
      setBusy(false);
    }
  };

  const restart = () => {
    setState(createSimulationState(project));
    setInput("");
  };

  const statusLabel =
    state.status === "waitingInput"
      ? t.waiting
      : state.status === "finished"
        ? t.finished
        : state.status === "running"
          ? t.running
          : state.status === "error"
            ? t.error
            : t.idle;

  const currentLabel =
    state.currentTarget?.type === "screen"
      ? project.screens.find((item) => item.id === state.currentTarget?.screenId)?.name
      : state.currentTarget?.type === "node"
        ? project.logicNodes.find((item) => item.id === state.currentTarget?.nodeId)?.name
        : "—";

  const showScreenControls = Boolean(currentScreen && state.status === "idle");
  const replyKeyboard =
    showScreenControls && currentScreen?.replyKeyboard.mode === "show"
      ? currentScreen.replyKeyboard.config
      : null;

  return (
    <div className="flex h-full min-h-0 bg-slate-950">
      <main className="flex min-w-0 flex-1 flex-col items-center overflow-y-auto p-5">
        <div className="mb-3 flex w-full max-w-[680px] items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-slate-100">{t.simulator}</h2>
            <div className="text-xs text-slate-500">{statusLabel}</div>
          </div>
          <div className="flex gap-2">
            <Button className="h-8" onClick={restart}>
              <RotateCcw size={13} />
              {t.restart}
            </Button>
            {startScreen ? (
              <Button
                className="h-8 border-emerald-500/30 text-emerald-300"
                disabled={busy}
                onClick={() => start({ type: "screen", screenId: startScreen.id })}
              >
                <Play size={13} />
                {t.startCommand}
              </Button>
            ) : null}
            {selectedTarget ? (
              <Button
                className="h-8 border-violet-500/30 text-violet-300"
                disabled={busy}
                onClick={() => start(selectedTarget)}
              >
                <Play size={13} />
                {t.startSelected}
              </Button>
            ) : null}
          </div>
        </div>

        <div className="flex min-h-[600px] w-full max-w-[680px] flex-col overflow-hidden rounded-[28px] border border-slate-700 bg-[#0d1822] shadow-2xl">
          <div className="flex h-16 shrink-0 items-center gap-3 border-b border-white/5 bg-[#172635] px-4">
            <div className="grid h-10 w-10 place-items-center rounded-full bg-sky-500 text-sm font-bold text-white">
              TF
            </div>
            <div className="text-sm font-semibold text-white">TFlow Test Bot</div>
          </div>

          <div className="telegram-wallpaper flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto p-4">
            {state.messages.length === 0 ? (
              <div className="m-auto max-w-sm text-center text-sm text-slate-500">{t.chooseStart}</div>
            ) : (
              state.messages.map((message) => (
                <div
                  key={message.id}
                  className={`max-w-[80%] whitespace-pre-wrap px-3 py-2 text-sm shadow-sm ${
                    message.from === "user"
                      ? "ml-auto rounded-[18px] rounded-br-[5px] bg-sky-600 text-white"
                      : message.from === "system"
                        ? "mx-auto rounded-xl bg-rose-500/10 text-rose-300"
                        : "rounded-[18px] rounded-bl-[5px] bg-[#182a38] text-slate-100"
                  }`}
                >
                  {message.text}
                </div>
              ))
            )}

            {state.error ? (
              <div className="mx-auto rounded-lg bg-rose-500/10 px-3 py-2 text-xs text-rose-300">
                {state.error}
              </div>
            ) : null}

            {showScreenControls && currentScreen && currentScreen.inlineKeyboard.length > 0 ? (
              <div className="mt-1 w-full max-w-[80%] space-y-1" data-testid="test-inline-keyboard">
                {currentScreen.inlineKeyboard.map((row) => {
                  const buttons = row.buttons
                    .map((button) => ({ button, target: navigationTarget(button.action) }))
                    .filter((item): item is typeof item & { target: FlowTarget } => Boolean(item.target));

                  if (buttons.length === 0) return null;

                  return (
                    <div key={row.id} className="flex gap-1">
                      {buttons.map(({ button, target }) => (
                        <button
                          key={button.id}
                          type="button"
                          className="min-w-0 flex-1 rounded-[9px] bg-[#20384b] px-2 py-2.5 text-center text-[12px] font-semibold leading-4 text-[#65bff5] shadow-sm transition hover:bg-[#29475e] disabled:opacity-40"
                          disabled={busy}
                          onClick={() => void choose(target)}
                        >
                          <span className="block truncate">{button.text}</span>
                        </button>
                      ))}
                    </div>
                  );
                })}
              </div>
            ) : null}
          </div>

          {replyKeyboard ? (
            <div
              className="space-y-1 border-t border-white/5 bg-[#1b2935]/95 p-1.5"
              data-testid="test-reply-keyboard"
            >
              {replyKeyboard.rows.map((row) => {
                const buttons = row.buttons
                  .map((button) => ({ button, target: navigationTarget(button.action) }))
                  .filter((item): item is typeof item & { target: FlowTarget } => Boolean(item.target));

                if (buttons.length === 0) return null;

                return (
                  <div key={row.id} className="flex gap-1">
                    {buttons.map(({ button, target }) => (
                      <button
                        key={button.id}
                        type="button"
                        className="min-w-0 flex-1 rounded-[7px] bg-[#314452] px-2 py-2.5 text-center text-[12px] font-medium text-slate-100 shadow-sm transition hover:bg-[#3a5262] disabled:opacity-40"
                        disabled={busy}
                        onClick={() => void choose(target)}
                      >
                        <span className="block truncate">{button.text}</span>
                      </button>
                    ))}
                  </div>
                );
              })}
            </div>
          ) : null}

          <div className="flex gap-2 border-t border-white/5 bg-[#172635] p-2">
            <input
              aria-label={t.typeMessage}
              disabled={!state.waitingForInput || busy}
              className="min-w-0 flex-1 rounded-full bg-[#0f1e2a] px-4 py-2 text-sm outline-none disabled:opacity-40"
              placeholder={replyKeyboard?.inputFieldPlaceholder || t.typeMessage}
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") void sendInput();
              }}
            />
            <button
              aria-label={t.send}
              disabled={!state.waitingForInput || busy}
              className="grid h-9 w-9 place-items-center rounded-full bg-sky-500 text-white disabled:opacity-30"
              onClick={() => void sendInput()}
            >
              <Send size={15} />
            </button>
          </div>
        </div>
      </main>

      <aside className="w-80 shrink-0 overflow-y-auto border-l border-slate-800 bg-slate-950/80 p-4">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">{t.runtime}</h3>
        <div className="mt-4 space-y-4 text-xs">
          <Inspect title={t.status} value={statusLabel} />
          <Inspect title={t.currentTarget} value={currentLabel ?? "—"} />
          <JsonBlock title={t.inputValues} value={state.context.input} />
          <JsonBlock title={t.varsValues} value={state.context.vars} />
          <JsonBlock title={t.httpValues} value={state.context.http} />
        </div>
      </aside>
    </div>
  );
}

function Inspect({ title, value }: { title: string; value: string }) {
  return (
    <div>
      <div className="text-slate-500">{title}</div>
      <div className="mt-1 rounded-lg bg-slate-900 p-2 text-slate-200">{value}</div>
    </div>
  );
}

function JsonBlock({ title, value }: { title: string; value: unknown }) {
  return (
    <div>
      <div className="text-slate-500">{title}</div>
      <pre className="mt-1 max-h-56 overflow-auto rounded-lg bg-slate-900 p-2 text-[11px] text-slate-300">
        {JSON.stringify(value, null, 2)}
      </pre>
    </div>
  );
}
