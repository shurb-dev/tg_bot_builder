"use client";

import { Plus } from "lucide-react";
import { ScreenSidebar } from "./ScreenSidebar";
import { PropertiesPanel } from "./PropertiesPanel";
import { TelegramPreview } from "@/components/telegram/TelegramPreview";
import { KeyboardBuilder } from "@/components/telegram/KeyboardBuilder";
import { Button } from "@/components/ui/Button";
import { useProjectStore } from "@/store/project-store";
import { getScreen } from "@/domain/project/selectors";

export function DesignWorkspace() {
  const project = useProjectStore((state) => state.project);
  const selectedScreenId = useProjectStore((state) => state.selectedScreenId);
  const selection = useProjectStore((state) => state.selection);
  const selectButton = useProjectStore((state) => state.selectButton);
  const createScreen = useProjectStore((state) => state.createScreen);
  const screen = selectedScreenId ? getScreen(project, selectedScreenId) : undefined;
  const selectedButtonId = selection?.type === "button" ? selection.buttonId : undefined;

  return (
    <div className="flex min-h-0 flex-1">
      <ScreenSidebar />
      <main className="min-w-0 flex-1 overflow-y-auto bg-slate-900/40 p-6">
        {screen ? (
          <div className="mx-auto grid max-w-6xl grid-cols-[minmax(360px,440px)_minmax(360px,1fr)] gap-6">
            <div>
              <div className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Telegram preview</div>
              <TelegramPreview screen={screen} selectedButtonId={selectedButtonId} onSelectButton={(rowId, buttonId) => selectButton(screen.id, rowId, buttonId)} />
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 shadow-xl shadow-black/10">
              <KeyboardBuilder screenId={screen.id} keyboard={screen.keyboard} selectedButtonId={selectedButtonId} />
            </div>
          </div>
        ) : (
          <div className="grid h-full place-items-center text-center">
            <div><div className="text-base font-medium text-slate-300">No screen selected</div><div className="mt-1 text-sm text-slate-600">Select a screen or create a new one.</div><Button className="mt-4" onClick={createScreen}><Plus size={15} /> Create screen</Button></div>
          </div>
        )}
      </main>
      <PropertiesPanel />
    </div>
  );
}
