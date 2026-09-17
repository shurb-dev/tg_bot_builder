"use client";

import { useState } from "react";
import Image from "next/image";
import { ImageIcon, MapPin, Smartphone, Globe2 } from "lucide-react";
import type { ReplyKeyboardButton, Screen } from "@/domain/project/types";
import { useTranslations } from "@/i18n/use-translations";

function replyIcon(button: ReplyKeyboardButton) {
  if (button.action.type === "requestContact") return <Smartphone size={11} className="shrink-0" />;
  if (button.action.type === "requestLocation") return <MapPin size={11} className="shrink-0" />;
  if (button.action.type === "webApp") return <Globe2 size={11} className="shrink-0" />;
  return null;
}

export function TelegramPreview({ screen, onSelectInlineButton, onSelectReplyButton, selectedInlineButtonId, selectedReplyButtonId }: {
  screen: Screen;
  onSelectInlineButton: (rowId: string, buttonId: string) => void;
  onSelectReplyButton: (rowId: string, buttonId: string) => void;
  selectedInlineButtonId?: string;
  selectedReplyButtonId?: string;
}) {
  const t = useTranslations();
  const [failedMediaUrl, setFailedMediaUrl] = useState<string | null>(null);
  const mediaUrl = screen.message.media?.url ?? "";
  const imageFailed = Boolean(mediaUrl && failedMediaUrl === mediaUrl);
  const reply = screen.replyKeyboard.mode === "show" ? screen.replyKeyboard.config : null;

  return (
    <div className="mx-auto flex h-[650px] w-full max-w-[420px] flex-col overflow-hidden rounded-[30px] border border-slate-700 bg-[#0d1822] shadow-2xl shadow-black/30">
      <div className="flex h-16 items-center gap-3 border-b border-white/10 bg-[#172635] px-5">
        <div className="grid h-9 w-9 place-items-center rounded-full bg-sky-500 text-sm font-bold text-white">TB</div>
        <div><div className="text-sm font-semibold text-white">{screen.name || "Telegram Bot"}</div><div className="text-xs text-sky-300">{t.preview.bot}</div></div>
      </div>
      <div className="telegram-wallpaper flex min-h-0 flex-1 flex-col justify-end overflow-y-auto p-4">
        <div className="w-full max-w-[92%] rounded-2xl rounded-bl-md bg-[#182a38] p-2 shadow-lg">
          {screen.message.media ? <div className="mb-2 overflow-hidden rounded-xl bg-slate-900">{!imageFailed ? <Image key={mediaUrl} src={mediaUrl} alt={t.preview.mediaAlt} width={720} height={480} unoptimized loader={({ src }) => src} onError={() => setFailedMediaUrl(mediaUrl)} className="max-h-64 w-full object-cover" /> : <div className="grid min-h-32 place-items-center p-6 text-center text-xs text-slate-500"><span><ImageIcon className="mx-auto mb-2" size={24} />{t.preview.imageFailed}</span></div>}</div> : null}
          <div className="whitespace-pre-wrap px-1 py-1 text-[14px] leading-5 text-slate-100">{screen.message.text || <span className="italic text-slate-500">{t.preview.emptyMessage}</span>}</div>
          {screen.inlineKeyboard.length > 0 ? <div className="mt-2 space-y-1.5" data-testid="inline-keyboard">{screen.inlineKeyboard.map((row) => <div key={row.id} className="flex gap-1.5">{row.buttons.map((button) => <button key={button.id} onClick={() => onSelectInlineButton(row.id, button.id)} className={`min-w-0 flex-1 rounded-lg border px-2 py-2 text-center text-xs font-medium text-sky-300 ${selectedInlineButtonId === button.id ? "border-sky-400 bg-sky-400/15 ring-1 ring-sky-400/40" : "border-sky-800/80 bg-[#20384b] hover:bg-[#29465d]"}`} title={button.action.type === "screen" ? button.text : button.action.type === "url" ? button.action.url : button.action.callbackData}><span className="block truncate">{button.text}</span></button>)}</div>)}</div> : null}
        </div>
      </div>
      {reply ? <div data-testid="reply-keyboard" className="space-y-1 border-t border-white/10 bg-[#172635] p-2">{reply.rows.map((row) => <div key={row.id} className="flex gap-1">{row.buttons.map((button) => <button key={button.id} onClick={() => onSelectReplyButton(row.id, button.id)} className={`flex min-w-0 flex-1 items-center justify-center gap-1 rounded-lg border px-2 py-2 text-xs text-slate-100 ${selectedReplyButtonId === button.id ? "border-sky-400 bg-sky-400/20" : "border-slate-600 bg-slate-700/80"}`}>{replyIcon(button)}<span className="truncate">{button.text}</span></button>)}</div>)}</div> : null}
      <div className="border-t border-white/10 bg-[#172635] p-2"><div className="rounded-full bg-slate-800 px-4 py-2 text-xs text-slate-500">{reply?.inputFieldPlaceholder || t.preview.messagePlaceholder}</div>{screen.replyKeyboard.mode === "remove" ? <div className="mt-1 text-center text-[10px] text-slate-600">{t.preview.removed}</div> : null}</div>
    </div>
  );
}
