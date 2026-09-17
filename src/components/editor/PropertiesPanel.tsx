"use client";

import { Trash2 } from "lucide-react";
import { Field, inputClass, textareaClass } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { useProjectStore } from "@/store/project-store";
import { getButton, getReplyButton, getScreen } from "@/domain/project/selectors";
import { utf8ByteLength } from "@/domain/telegram/utf8";
import { isValidHttpUrl, isValidHttpsUrl, validateProject } from "@/domain/project/validation";
import { useTranslations } from "@/i18n/use-translations";
import { getV12Translations } from "@/i18n/v12-translations";
import { translateValidationIssue } from "@/i18n/validation-messages";
import { usePreferencesStore } from "@/store/preferences-store";

export function PropertiesPanel() {
  const t = useTranslations();
  const locale = usePreferencesStore((state) => state.locale); const v12 = getV12Translations(locale);
  const project = useProjectStore((state) => state.project); const selection = useProjectStore((state) => state.selection);
  const renameScreen = useProjectStore((state) => state.renameScreen); const updateTrigger = useProjectStore((state) => state.updateTrigger); const updateMessage = useProjectStore((state) => state.updateMessage); const setPhotoUrl = useProjectStore((state) => state.setPhotoUrl);
  const updateButton = useProjectStore((state) => state.updateButton); const setButtonAction = useProjectStore((state) => state.setButtonAction); const removeButton = useProjectStore((state) => state.removeButton);
  const updateReplyButton = useProjectStore((state) => state.updateReplyButton); const setReplyButtonAction = useProjectStore((state) => state.setReplyButtonAction); const removeReplyButton = useProjectStore((state) => state.removeReplyButton);
  const issues = validateProject(project);

  if (!selection || selection.type === "botSettings" || selection.type === "logicNode") return <aside className="w-80 shrink-0 border-l border-slate-800 bg-slate-950/80 p-5 text-sm text-slate-500">{t.properties.select}</aside>;
  const screen = getScreen(project, selection.screenId); if (!screen) return null;

  if (selection.type === "screen") {
    const screenIssues = issues.filter((issue) => issue.screenId === screen.id && !issue.buttonId);
    return <aside className="w-80 shrink-0 overflow-y-auto border-l border-slate-800 bg-slate-950/80 p-4"><div className="mb-4"><div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{t.properties.screenTitle}</div><div className="mt-1 text-sm text-slate-400">{t.properties.screenHint}</div></div><div className="space-y-4">
      <Field label={t.properties.screenName}><input aria-label={t.properties.screenName} className={inputClass} value={screen.name} onChange={(event) => renameScreen(screen.id, event.target.value)} /></Field>
      <Field label={t.properties.commandTrigger} hint={t.properties.optional}><div className="relative"><span className="absolute left-3 top-2.5 text-slate-600">/</span><input aria-label={t.properties.commandTrigger} className={`${inputClass} pl-6`} value={screen.trigger?.command ?? ""} placeholder="start" onChange={(event) => updateTrigger(screen.id, event.target.value || null)} /></div></Field>
      <Field label={t.properties.messageText}><textarea aria-label={t.properties.messageText} className={textareaClass} value={screen.message.text} onChange={(event) => updateMessage(screen.id, { text: event.target.value })} /></Field>
      <Field label={t.properties.parseMode}><select aria-label={t.properties.parseMode} className={inputClass} value={screen.message.parseMode} onChange={(event) => updateMessage(screen.id, { parseMode: event.target.value as typeof screen.message.parseMode })}><option value="none">None</option><option value="HTML">HTML</option><option value="MarkdownV2">MarkdownV2</option></select></Field>
      <Field label={t.properties.photoUrl} hint={t.properties.optional} error={screen.message.media && !isValidHttpUrl(screen.message.media.url) ? t.properties.urlError : undefined}><input aria-label={t.properties.photoUrl} className={inputClass} value={screen.message.media?.url ?? ""} placeholder="https://…" onChange={(event) => setPhotoUrl(screen.id, event.target.value || null)} /></Field>
      {screenIssues.map((issue) => <Issue key={issue.id} issue={issue} locale={locale} />)}
    </div></aside>;
  }

  if (selection.type === "inlineButton") {
    const { rowId, buttonId } = selection; const button = getButton(project, screen.id, rowId, buttonId); if (!button) return null;
    const bytes = button.action.type === "callback" ? utf8ByteLength(button.action.callbackData) : 0;
    const changeType = (type: "screen" | "node" | "callback" | "url") => {
      if (type === "screen") setButtonAction(screen.id, rowId, buttonId, { type, screenId: project.screens[0]?.id ?? screen.id });
      else if (type === "node") { const nodeId = project.logicNodes[0]?.id; if (nodeId) setButtonAction(screen.id, rowId, buttonId, { type, nodeId }); }
      else if (type === "callback") setButtonAction(screen.id, rowId, buttonId, { type, callbackData: "action" });
      else setButtonAction(screen.id, rowId, buttonId, { type, url: "https://example.com" });
    };
    return <aside className="w-80 shrink-0 overflow-y-auto border-l border-slate-800 bg-slate-950/80 p-4"><div className="mb-4 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{t.properties.inlineTitle}</div><div className="space-y-4">
      <Field label={t.properties.buttonText}><input aria-label={t.properties.buttonText} className={inputClass} value={button.text} onChange={(event) => updateButton(screen.id, rowId, button.id, { text: event.target.value }, `button:${button.id}:text`)} /></Field>
      <Field label={t.properties.actionType}><select aria-label={t.properties.actionType} className={inputClass} value={button.action.type} onChange={(event) => changeType(event.target.value as "screen" | "node" | "callback" | "url")}><option value="screen">{t.properties.goToScreen}</option><option value="node">{v12.goToNode}</option><option value="callback">{t.properties.callback}</option><option value="url">{t.properties.url}</option></select></Field>
      {button.action.type === "screen" ? <Field label={t.properties.targetScreen}><select aria-label={t.properties.targetScreen} className={inputClass} value={button.action.screenId} onChange={(event) => setButtonAction(screen.id, rowId, button.id, { type: "screen", screenId: event.target.value })}>{project.screens.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></Field> : null}
      {button.action.type === "node" ? <Field label={v12.targetNode}><select aria-label={v12.targetNode} className={inputClass} value={button.action.nodeId} onChange={(event) => setButtonAction(screen.id, rowId, button.id, { type: "node", nodeId: event.target.value })}>{project.logicNodes.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></Field> : null}
      {button.action.type === "callback" ? <Field label={t.properties.callbackData} hint={`${bytes}/64 bytes`} error={bytes < 1 || bytes > 64 ? t.properties.callbackError : undefined}><input aria-label={t.properties.callbackData} className={inputClass} value={button.action.callbackData} onChange={(event) => setButtonAction(screen.id, rowId, button.id, { type: "callback", callbackData: event.target.value })} /></Field> : null}
      {button.action.type === "url" ? <Field label={t.properties.url} error={!isValidHttpUrl(button.action.url) ? t.properties.urlError : undefined}><input aria-label={t.properties.url} className={inputClass} value={button.action.url} onChange={(event) => setButtonAction(screen.id, rowId, button.id, { type: "url", url: event.target.value })} /></Field> : null}
      {issues.filter((issue) => issue.buttonId === button.id).map((issue) => <Issue key={issue.id} issue={issue} locale={locale} />)}<Button className="w-full border-rose-500/20 text-rose-300" onClick={() => removeButton(screen.id, rowId, button.id)}><Trash2 size={14} />{t.properties.deleteButton}</Button>
    </div></aside>;
  }

  const { rowId, buttonId } = selection; const button = getReplyButton(project, screen.id, rowId, buttonId); if (!button) return null;
  const changeType = (type: "screen" | "node" | "text" | "requestContact" | "requestLocation" | "webApp") => {
    if (type === "screen") setReplyButtonAction(screen.id, rowId, buttonId, { type, screenId: project.screens[0]?.id ?? screen.id });
    else if (type === "node") { const nodeId = project.logicNodes[0]?.id; if (nodeId) setReplyButtonAction(screen.id, rowId, buttonId, { type, nodeId }); }
    else if (type === "webApp") setReplyButtonAction(screen.id, rowId, buttonId, { type, url: "https://example.com" });
    else setReplyButtonAction(screen.id, rowId, buttonId, { type });
  };
  return <aside className="w-80 shrink-0 overflow-y-auto border-l border-slate-800 bg-slate-950/80 p-4"><div className="mb-4 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{t.properties.replyTitle}</div><div className="space-y-4">
    <Field label={t.properties.buttonText}><input aria-label={t.properties.buttonText} className={inputClass} value={button.text} onChange={(event) => updateReplyButton(screen.id, rowId, button.id, { text: event.target.value }, `reply:${button.id}:text`)} /></Field>
    <Field label={t.properties.actionType}><select aria-label={t.properties.actionType} className={inputClass} value={button.action.type} onChange={(event) => changeType(event.target.value as "screen" | "node" | "text" | "requestContact" | "requestLocation" | "webApp")}><option value="screen">{t.properties.goToScreen}</option><option value="node">{v12.goToNode}</option><option value="text">{t.properties.sendText}</option><option value="requestContact">{t.properties.requestContact}</option><option value="requestLocation">{t.properties.requestLocation}</option><option value="webApp">{t.properties.webApp}</option></select></Field>
    {button.action.type === "screen" ? <Field label={t.properties.targetScreen}><select aria-label={t.properties.targetScreen} className={inputClass} value={button.action.screenId} onChange={(event) => setReplyButtonAction(screen.id, rowId, button.id, { type: "screen", screenId: event.target.value })}>{project.screens.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></Field> : null}
    {button.action.type === "node" ? <Field label={v12.targetNode}><select aria-label={v12.targetNode} className={inputClass} value={button.action.nodeId} onChange={(event) => setReplyButtonAction(screen.id, rowId, button.id, { type: "node", nodeId: event.target.value })}>{project.logicNodes.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></Field> : null}
    {button.action.type === "webApp" ? <Field label={t.properties.url} error={!isValidHttpsUrl(button.action.url) ? t.properties.webAppError : undefined}><input aria-label={t.properties.url} className={inputClass} value={button.action.url} onChange={(event) => setReplyButtonAction(screen.id, rowId, button.id, { type: "webApp", url: event.target.value })} /></Field> : null}
    {issues.filter((issue) => issue.buttonId === button.id).map((issue) => <Issue key={issue.id} issue={issue} locale={locale} />)}<Button className="w-full border-rose-500/20 text-rose-300" onClick={() => removeReplyButton(screen.id, rowId, button.id)}><Trash2 size={14} />{t.properties.deleteButton}</Button>
  </div></aside>;
}

function Issue({ issue, locale }: { issue: ReturnType<typeof validateProject>[number]; locale: "ru" | "en" }) { return <div className={`rounded-lg border p-2 text-xs ${issue.severity === "error" ? "border-rose-500/30 bg-rose-500/10 text-rose-300" : "border-amber-500/30 bg-amber-500/10 text-amber-300"}`}>{translateValidationIssue(issue, locale)}</div>; }
