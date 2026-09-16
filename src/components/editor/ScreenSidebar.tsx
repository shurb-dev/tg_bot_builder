"use client";

import { Copy, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useProjectStore } from "@/store/project-store";

export function ScreenSidebar() {
  const project = useProjectStore((state) => state.project);
  const selectedScreenId = useProjectStore((state) => state.selectedScreenId);
  const selectScreen = useProjectStore((state) => state.selectScreen);
  const createScreen = useProjectStore((state) => state.createScreen);
  const duplicateScreen = useProjectStore((state) => state.duplicateScreen);
  const deleteScreen = useProjectStore((state) => state.deleteScreen);

  function confirmDelete(screenId: string, screenName: string) {
    const inbound = project.screens.reduce(
      (count, screen) => count + screen.keyboard.reduce((rowCount, row) => rowCount + row.buttons.filter((button) => button.action.type === "screen" && button.action.screenId === screenId).length, 0),
      0,
    );
    const extra = inbound > 0 ? ` ${inbound} referencing button(s) will also be removed.` : "";
    if (window.confirm(`Delete “${screenName}”?${extra}`)) deleteScreen(screenId);
  }

  return (
    <aside className="flex min-h-0 w-64 shrink-0 flex-col border-r border-slate-800 bg-slate-950/80">
      <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Screens</div>
          <div className="mt-0.5 text-xs text-slate-600">{project.screens.length} total</div>
        </div>
        <Button className="h-8 w-8 p-0" onClick={createScreen} aria-label="Create screen" title="Create screen">
          <Plus size={15} />
        </Button>
      </div>
      <div className="min-h-0 flex-1 space-y-1 overflow-y-auto p-2">
        {project.screens.map((screen) => {
          const selected = screen.id === selectedScreenId;
          const buttonCount = screen.keyboard.reduce((sum, row) => sum + row.buttons.length, 0);
          return (
            <div key={screen.id} className={`group rounded-xl border p-2 transition ${selected ? "border-sky-500/50 bg-sky-500/10" : "border-transparent hover:border-slate-800 hover:bg-slate-900"}`}>
              <button className="w-full text-left" onClick={() => selectScreen(screen.id)}>
                <div className="truncate text-sm font-medium text-slate-200">{screen.name || "Unnamed screen"}</div>
                <div className="mt-1 flex items-center gap-2 text-[11px] text-slate-500">
                  <span>{screen.trigger ? `/${screen.trigger.command}` : "No trigger"}</span>
                  <span>•</span>
                  <span>{buttonCount} buttons</span>
                </div>
              </button>
              <div className="mt-2 hidden gap-1 group-hover:flex">
                <button className="rounded-md p-1.5 text-slate-500 hover:bg-slate-800 hover:text-slate-200" onClick={() => duplicateScreen(screen.id)} title="Duplicate screen" aria-label={`Duplicate ${screen.name}`}>
                  <Copy size={13} />
                </button>
                <button className="rounded-md p-1.5 text-slate-500 hover:bg-rose-500/10 hover:text-rose-400 disabled:opacity-30" disabled={project.screens.length <= 1} onClick={() => confirmDelete(screen.id, screen.name)} title="Delete screen" aria-label={`Delete ${screen.name}`}>
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
      <div className="border-t border-slate-800 p-3">
        <Button className="w-full" onClick={createScreen}><Plus size={15} /> Add screen</Button>
      </div>
    </aside>
  );
}
