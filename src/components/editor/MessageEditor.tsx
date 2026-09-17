"use client";

import { Field, inputClass, textareaClass } from "@/components/ui/Field";
import { useProjectStore } from "@/store/project-store";
import { getScreen } from "@/domain/project/selectors";
import { isValidHttpUrl } from "@/domain/project/validation";
import { useTranslations } from "@/i18n/use-translations";

export function MessageEditor({ screenId }: { screenId: string }) {
  const t = useTranslations();
  const project = useProjectStore((state) => state.project);
  const updateMessage = useProjectStore((state) => state.updateMessage);
  const setPhotoUrl = useProjectStore((state) => state.setPhotoUrl);
  const screen = getScreen(project, screenId);
  if (!screen) return null;
  return (
    <div className="space-y-4">
      <div><div className="text-sm font-semibold text-slate-200">{t.message.title}</div><div className="text-xs text-slate-500">{t.message.hint}</div></div>
      <Field label={t.message.text}><textarea className={textareaClass} value={screen.message.text} onChange={(event) => updateMessage(screen.id, { text: event.target.value })} /></Field>
      <Field label={t.message.parseMode}><select className={inputClass} value={screen.message.parseMode} onChange={(event) => updateMessage(screen.id, { parseMode: event.target.value as typeof screen.message.parseMode })}><option value="none">None</option><option value="HTML">HTML</option><option value="MarkdownV2">MarkdownV2</option></select></Field>
      <Field label={t.message.photoUrl} hint={t.message.optional} error={screen.message.media && !isValidHttpUrl(screen.message.media.url) ? t.message.invalidUrl : undefined}><input className={inputClass} value={screen.message.media?.url ?? ""} placeholder="https://…" onChange={(event) => setPhotoUrl(screen.id, event.target.value || null)} /></Field>
    </div>
  );
}
