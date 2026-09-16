"use client";

import { useState } from "react";
import Image from "next/image";
import { AlertTriangle, ImageIcon } from "lucide-react";
import type { Screen } from "@/domain/project/types";

export function TelegramPreview({ screen, onSelectButton, selectedButtonId }: { screen: Screen; onSelectButton: (rowId: string, buttonId: string) => void; selectedButtonId?: string }) {
  const [failedMediaUrl, setFailedMediaUrl] = useState<string | null>(null);
  const mediaUrl = screen.message.media?.url ?? "";
  const imageFailed = Boolean(mediaUrl && failedMediaUrl === mediaUrl);

  return (
    <div className="mx-auto flex h-[620px] w-full max-w-[420px] flex-col overflow-hidden rounded-[30px] border border-slate-700 bg-[#0d1822] shadow-2xl shadow-black/30">
      <div className="flex h-16 items-center gap-3 border-b border-white/10 bg-[#172635] px-5">
        <div className="grid h-9 w-9 place-items-center rounded-full bg-sky-500 text-sm font-bold text-white">TB</div>
        <div>
          <div className="text-sm font-semibold text-white">{screen.name || "Telegram Bot"}</div>
          <div className="text-xs text-sky-300">bot</div>
        </div>
      </div>
      <div className="telegram-wallpaper flex min-h-0 flex-1 flex-col justify-end overflow-y-auto p-4">
        <div className="w-full max-w-[92%] rounded-2xl rounded-bl-md bg-[#182a38] p-2 shadow-lg">
          {screen.message.media ? (
            <div className="mb-2 overflow-hidden rounded-xl bg-slate-900">
              {!imageFailed ? (
                <Image
                  key={mediaUrl}
                  src={mediaUrl}
                  alt="Message media preview"
                  width={720}
                  height={480}
                  unoptimized
                  loader={({ src }) => src}
                  onError={() => setFailedMediaUrl(mediaUrl)}
                  className="max-h-64 w-full object-cover"
                />
              ) : (
                <div className="grid min-h-32 place-items-center p-6 text-center text-xs text-slate-500">
                  <span><ImageIcon className="mx-auto mb-2" size={24} />Image could not be loaded</span>
                </div>
              )}
            </div>
          ) : null}
          <div className="whitespace-pre-wrap px-1 py-1 text-[14px] leading-5 text-slate-100">
            {screen.message.text || <span className="italic text-slate-500">Empty message</span>}
          </div>
          <div className="mt-2 space-y-1.5">
            {screen.keyboard.map((row) => (
              <div key={row.id} className="flex gap-1.5">
                {row.buttons.map((button) => (
                  <button
                    key={button.id}
                    onClick={() => onSelectButton(row.id, button.id)}
                    className={`min-w-0 flex-1 rounded-lg border px-2 py-2 text-center text-xs font-medium text-sky-300 transition ${selectedButtonId === button.id ? "border-sky-400 bg-sky-400/15 ring-1 ring-sky-400/40" : "border-sky-800/80 bg-[#20384b] hover:bg-[#29465d]"}`}
                    title={button.action.type === "screen" ? "Go to screen" : button.action.type === "url" ? button.action.url : button.action.callbackData}
                  >
                    <span className="block truncate">{button.text || "Untitled"}</span>
                  </button>
                ))}
              </div>
            ))}
            {screen.keyboard.length === 0 ? (
              <div className="flex items-center gap-2 rounded-lg border border-dashed border-slate-600 p-3 text-xs text-slate-500">
                <AlertTriangle size={14} /> No inline keyboard
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
