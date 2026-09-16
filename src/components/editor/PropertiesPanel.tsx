"use client";

import { Trash2 } from "lucide-react";
import { Field, inputClass, textareaClass } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { useProjectStore } from "@/store/project-store";
import { getButton, getScreen } from "@/domain/project/selectors";
import { utf8ByteLength } from "@/domain/telegram/utf8";
import { isValidHttpUrl, validateProject } from "@/domain/project/validation";

export function PropertiesPanel() {
  const project = useProjectStore((state) => state.project);
  const selection = useProjectStore((state) => state.selection);
  const renameScreen = useProjectStore((state) => state.renameScreen);
  const updateTrigger = useProjectStore((state) => state.updateTrigger);
  const updateMessage = useProjectStore((state) => state.updateMessage);
  const setPhotoUrl = useProjectStore((state) => state.setPhotoUrl);
  const updateButton = useProjectStore((state) => state.updateButton);
  const setButtonAction = useProjectStore((state) => state.setButtonAction);
  const removeButton = useProjectStore((state) => state.removeButton);

  const issues = validateProject(project);

  if (!selection) {
    return <aside className="w-80 shrink-0 border-l border-slate-800 bg-slate-950/80 p-5 text-sm text-slate-500">Select a screen or button to edit its properties.</aside>;
  }

  const screen = getScreen(project, selection.screenId);
  if (!screen) return null;

  if (selection.type === "screen") {
    const screenIssues = issues.filter((issue) => issue.screenId === screen.id && !issue.buttonId);
    return (
      <aside className="w-80 shrink-0 overflow-y-auto border-l border-slate-800 bg-slate-950/80 p-4">
        <div className="mb-4">
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Screen properties</div>
          <div className="mt-1 text-sm text-slate-400">Message and entry trigger</div>
        </div>
        <div className="space-y-4">
          <Field label="Screen name">
            <input className={inputClass} value={screen.name} onChange={(event) => renameScreen(screen.id, event.target.value)} />
          </Field>
          <Field label="Command trigger" hint="optional">
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-slate-600">/</span>
              <input className={`${inputClass} pl-6`} value={screen.trigger?.command ?? ""} placeholder="start" onChange={(event) => updateTrigger(screen.id, event.target.value || null)} />
            </div>
          </Field>
          <Field label="Message text">
            <textarea className={textareaClass} value={screen.message.text} onChange={(event) => updateMessage(screen.id, { text: event.target.value })} />
          </Field>
          <Field label="Parse mode">
            <select className={inputClass} value={screen.message.parseMode} onChange={(event) => updateMessage(screen.id, { parseMode: event.target.value as typeof screen.message.parseMode })}>
              <option value="none">None</option>
              <option value="HTML">HTML</option>
              <option value="MarkdownV2">MarkdownV2</option>
            </select>
          </Field>
          <Field label="Photo URL" hint="optional" error={screen.message.media && !isValidHttpUrl(screen.message.media.url) ? "Use a valid HTTP/HTTPS URL." : undefined}>
            <input className={inputClass} value={screen.message.media?.url ?? ""} placeholder="https://…" onChange={(event) => setPhotoUrl(screen.id, event.target.value || null)} />
          </Field>
          {screenIssues.length > 0 ? (
            <div className="space-y-2 border-t border-slate-800 pt-4">
              {screenIssues.map((issue) => <div key={issue.id} className={`rounded-lg border p-2 text-xs ${issue.severity === "error" ? "border-rose-500/30 bg-rose-500/10 text-rose-300" : "border-amber-500/30 bg-amber-500/10 text-amber-300"}`}>{issue.message}</div>)}
            </div>
          ) : null}
        </div>
      </aside>
    );
  }

  const rowId = selection.rowId;
  const buttonId = selection.buttonId;
  const button = getButton(project, selection.screenId, rowId, buttonId);
  if (!button) return null;
  const buttonIssues = issues.filter((issue) => issue.buttonId === button.id);
  const callbackBytes = button.action.type === "callback" ? utf8ByteLength(button.action.callbackData) : 0;

  function changeType(type: "screen" | "callback" | "url") {
    if (type === "screen") setButtonAction(screen.id, rowId, buttonId, { type: "screen", screenId: project.screens[0]?.id ?? screen.id });
    if (type === "callback") setButtonAction(screen.id, rowId, buttonId, { type: "callback", callbackData: "action" });
    if (type === "url") setButtonAction(screen.id, rowId, buttonId, { type: "url", url: "https://example.com" });
  }

  return (
    <aside className="w-80 shrink-0 overflow-y-auto border-l border-slate-800 bg-slate-950/80 p-4">
      <div className="mb-4">
        <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Button properties</div>
        <div className="mt-1 truncate text-sm text-slate-400">{screen.name}</div>
      </div>
      <div className="space-y-4">
        <Field label="Button text">
          <input className={inputClass} value={button.text} onChange={(event) => updateButton(screen.id, rowId, button.id, { text: event.target.value }, `button:${button.id}:text`)} />
        </Field>
        <Field label="Action type">
          <select className={inputClass} value={button.action.type} onChange={(event) => changeType(event.target.value as "screen" | "callback" | "url")}>
            <option value="screen">Go to screen</option>
            <option value="callback">Callback</option>
            <option value="url">URL</option>
          </select>
        </Field>
        {button.action.type === "screen" ? (
          <Field label="Target screen">
            <select className={inputClass} value={button.action.screenId} onChange={(event) => setButtonAction(screen.id, rowId, button.id, { type: "screen", screenId: event.target.value })}>
              {project.screens.map((candidate) => <option key={candidate.id} value={candidate.id}>{candidate.name}</option>)}
            </select>
          </Field>
        ) : null}
        {button.action.type === "callback" ? (
          <Field label="Callback data" hint={`${callbackBytes}/64 bytes`} error={callbackBytes < 1 || callbackBytes > 64 ? "Telegram callback_data must be 1–64 UTF-8 bytes." : undefined}>
            <input className={inputClass} value={button.action.callbackData} onChange={(event) => setButtonAction(screen.id, rowId, button.id, { type: "callback", callbackData: event.target.value })} />
          </Field>
        ) : null}
        {button.action.type === "url" ? (
          <Field label="URL" error={!isValidHttpUrl(button.action.url) ? "Use a valid HTTP/HTTPS URL." : undefined}>
            <input className={inputClass} value={button.action.url} onChange={(event) => setButtonAction(screen.id, rowId, button.id, { type: "url", url: event.target.value })} />
          </Field>
        ) : null}
        {buttonIssues.map((item) => <div key={item.id} className={`rounded-lg border p-2 text-xs ${item.severity === "error" ? "border-rose-500/30 bg-rose-500/10 text-rose-300" : "border-amber-500/30 bg-amber-500/10 text-amber-300"}`}>{item.message}</div>)}
        <Button className="w-full border-rose-500/20 text-rose-300 hover:bg-rose-500/10" onClick={() => removeButton(screen.id, rowId, button.id)}><Trash2 size={14} /> Delete button</Button>
      </div>
    </aside>
  );
}
