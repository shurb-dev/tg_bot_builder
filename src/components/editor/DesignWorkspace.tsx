"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { ScreenSidebar } from "./ScreenSidebar";
import { PropertiesPanel } from "./PropertiesPanel";
import { MessageEditor } from "./MessageEditor";
import { BotSettingsPanel } from "./BotSettingsPanel";
import { TelegramPreview } from "@/components/telegram/TelegramPreview";
import { KeyboardBuilder } from "@/components/telegram/KeyboardBuilder";
import { ReplyKeyboardBuilder } from "@/components/telegram/ReplyKeyboardBuilder";
import { Button } from "@/components/ui/Button";
import { useProjectStore } from "@/store/project-store";
import { getScreen } from "@/domain/project/selectors";
import { useTranslations } from "@/i18n/use-translations";

type DesignTab = "message" | "inline" | "bottom";

export function DesignWorkspace() {
  const t = useTranslations();
  const project = useProjectStore((state) => state.project);
  const selectedScreenId = useProjectStore((state) => state.selectedScreenId);
  const selection = useProjectStore((state) => state.selection);
  const selectInlineButton = useProjectStore((state) => state.selectInlineButton);
  const selectReplyButton = useProjectStore((state) => state.selectReplyButton);
  const createScreen = useProjectStore((state) => state.createScreen);
  const [tab, setTab] = useState<DesignTab>("inline");
  const screen = selectedScreenId ? getScreen(project, selectedScreenId) : undefined;

  if (selection?.type === "botSettings") {
    return <div className="flex min-h-0 flex-1"><ScreenSidebar /><main className="min-w-0 flex-1 overflow-y-auto bg-slate-900/40 p-6"><BotSettingsPanel /></main></div>;
  }

  const activeTab: DesignTab = selection?.type === "replyButton" ? "bottom" : selection?.type === "inlineButton" ? "inline" : tab;
  const selectedInlineButtonId = selection?.type === "inlineButton" ? selection.buttonId : undefined;
  const selectedReplyButtonId = selection?.type === "replyButton" ? selection.buttonId : undefined;

  return (
    <div className="flex min-h-0 flex-1">
      <ScreenSidebar />
      <main className="min-w-0 flex-1 overflow-y-auto bg-slate-900/40 p-6">
        {screen ? <div className="mx-auto grid max-w-6xl grid-cols-[minmax(360px,440px)_minmax(360px,1fr)] gap-6">
          <div><div className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{t.design.preview}</div><TelegramPreview screen={screen} selectedInlineButtonId={selectedInlineButtonId} selectedReplyButtonId={selectedReplyButtonId} onSelectInlineButton={(rowId, buttonId) => { selectInlineButton(screen.id, rowId, buttonId); setTab("inline"); }} onSelectReplyButton={(rowId, buttonId) => { selectReplyButton(screen.id, rowId, buttonId); setTab("bottom"); }} /></div>
          <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 shadow-xl shadow-black/10">
            <div className="mb-4 grid grid-cols-3 rounded-xl border border-slate-800 bg-slate-900 p-1">{(["message", "inline", "bottom"] as const).map((item) => <button key={item} onClick={() => setTab(item)} className={`rounded-lg px-3 py-2 text-xs font-medium ${activeTab === item ? "bg-slate-700 text-white" : "text-slate-500 hover:text-slate-200"}`}>{item === "message" ? t.design.messageTab : item === "inline" ? t.design.inlineTab : t.design.bottomTab}</button>)}</div>
            {activeTab === "message" ? <MessageEditor screenId={screen.id} /> : null}
            {activeTab === "inline" ? <KeyboardBuilder screenId={screen.id} keyboard={screen.inlineKeyboard} selectedButtonId={selectedInlineButtonId} /> : null}
            {activeTab === "bottom" ? <ReplyKeyboardBuilder screen={screen} selectedButtonId={selectedReplyButtonId} /> : null}
          </div>
        </div> : <div className="grid h-full place-items-center text-center"><div><div className="text-base font-medium text-slate-300">{t.design.noScreen}</div><div className="mt-1 text-sm text-slate-600">{t.design.noScreenHint}</div><Button className="mt-4" onClick={createScreen}><Plus size={15} />{t.design.create}</Button></div></div>}
      </main>
      <PropertiesPanel />
    </div>
  );
}
