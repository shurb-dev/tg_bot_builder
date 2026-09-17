"use client";

import { useState } from "react";
import Image from "next/image";
import { Globe2, ImageIcon, MapPin, Smartphone } from "lucide-react";
import type { ReplyKeyboardButton, Screen } from "@/domain/project/types";
import { useTranslations } from "@/i18n/use-translations";

function replyIcon(button: ReplyKeyboardButton) {
  if (button.action.type === "requestContact") {
    return <Smartphone size={12} className="shrink-0" />;
  }
  if (button.action.type === "requestLocation") {
    return <MapPin size={12} className="shrink-0" />;
  }
  if (button.action.type === "webApp") {
    return <Globe2 size={12} className="shrink-0" />;
  }
  return null;
}

function inlineButtonTitle(button: Screen["inlineKeyboard"][number]["buttons"][number]) {
  if (button.action.type === "screen") return button.text;
  if (button.action.type === "url") return button.action.url;
  return button.action.callbackData;
}

export function TelegramPreview({
  screen,
  onSelectInlineButton,
  onSelectReplyButton,
  selectedInlineButtonId,
  selectedReplyButtonId,
}: {
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
    <div className="mx-auto flex h-[650px] w-full max-w-[420px] flex-col overflow-hidden rounded-[28px] border border-slate-700/80 bg-[#0d1822] shadow-2xl shadow-black/30">
      <div className="flex h-16 shrink-0 items-center gap-3 border-b border-white/5 bg-[#172635] px-4">
        <div className="grid h-10 w-10 place-items-center rounded-full bg-sky-500 text-sm font-bold text-white">
          TB
        </div>
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold text-white">
            {screen.name || "Telegram Bot"}
          </div>
          <div className="text-xs text-sky-300">{t.preview.bot}</div>
        </div>
      </div>

      <div className="telegram-wallpaper flex min-h-0 flex-1 flex-col justify-end overflow-y-auto px-3 py-4">
        <div className="w-full max-w-[92%]">
          <div className="w-fit max-w-full rounded-[18px] rounded-bl-[5px] bg-[#182a38] p-2 shadow-md shadow-black/15">
            {screen.message.media ? (
              <div className="mb-2 overflow-hidden rounded-[14px] bg-slate-900">
                {!imageFailed ? (
                  <Image
                    key={mediaUrl}
                    src={mediaUrl}
                    alt={t.preview.mediaAlt}
                    width={720}
                    height={480}
                    unoptimized
                    loader={({ src }) => src}
                    onError={() => setFailedMediaUrl(mediaUrl)}
                    className="max-h-64 w-full object-cover"
                  />
                ) : (
                  <div className="grid min-h-32 place-items-center p-6 text-center text-xs text-slate-500">
                    <span>
                      <ImageIcon className="mx-auto mb-2" size={24} />
                      {t.preview.imageFailed}
                    </span>
                  </div>
                )}
              </div>
            ) : null}

            <div className="whitespace-pre-wrap px-1.5 py-1 text-[14px] leading-5 text-slate-100">
              {screen.message.text || (
                <span className="italic text-slate-500">{t.preview.emptyMessage}</span>
              )}
            </div>
          </div>

          {screen.inlineKeyboard.length > 0 ? (
            <div className="mt-1 space-y-1" data-testid="inline-keyboard">
              {screen.inlineKeyboard.map((row) => (
                <div key={row.id} className="flex gap-1">
                  {row.buttons.map((button) => {
                    const selected = selectedInlineButtonId === button.id;
                    return (
                      <button
                        key={button.id}
                        type="button"
                        onClick={() => onSelectInlineButton(row.id, button.id)}
                        className={`min-w-0 flex-1 rounded-[9px] px-2 py-2.5 text-center text-[12px] font-semibold leading-4 text-[#65bff5] shadow-sm transition ${
                          selected
                            ? "bg-[#2a536b] ring-2 ring-sky-400/70"
                            : "bg-[#20384b] hover:bg-[#29475e]"
                        }`}
                        title={inlineButtonTitle(button)}
                      >
                        <span className="block truncate">{button.text}</span>
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          ) : null}
        </div>
      </div>

      {reply ? (
        <div
          data-testid="reply-keyboard"
          className="space-y-1 border-t border-white/5 bg-[#1b2935]/95 p-1.5 backdrop-blur"
        >
          {reply.rows.map((row) => (
            <div key={row.id} className="flex gap-1">
              {row.buttons.map((button) => {
                const selected = selectedReplyButtonId === button.id;
                return (
                  <button
                    key={button.id}
                    type="button"
                    onClick={() => onSelectReplyButton(row.id, button.id)}
                    className={`flex min-w-0 flex-1 items-center justify-center gap-1 rounded-[7px] px-2 py-2.5 text-[12px] font-medium text-slate-100 shadow-sm transition ${
                      selected
                        ? "bg-[#456376] ring-2 ring-sky-400/60"
                        : "bg-[#314452] hover:bg-[#3a5262]"
                    }`}
                  >
                    {replyIcon(button)}
                    <span className="truncate">{button.text}</span>
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      ) : null}

      <div className="shrink-0 border-t border-white/5 bg-[#172635] p-2">
        <div className="rounded-full bg-[#0f1e2a] px-4 py-2.5 text-xs text-slate-500">
          {reply?.inputFieldPlaceholder || t.preview.messagePlaceholder}
        </div>
        {screen.replyKeyboard.mode === "remove" ? (
          <div className="mt-1 text-center text-[10px] text-slate-600">{t.preview.removed}</div>
        ) : null}
      </div>
    </div>
  );
}
