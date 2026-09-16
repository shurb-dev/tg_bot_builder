"use client";

import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Field, inputClass } from "@/components/ui/Field";
import { useTranslations } from "@/i18n/use-translations";
import { useProjectStore } from "@/store/project-store";
import { isValidHttpsUrl } from "@/domain/project/validation";

export function BotSettingsPanel() {
  const t = useTranslations();
  const project = useProjectStore((state) => state.project);
  const addBotCommand = useProjectStore((state) => state.addBotCommand);
  const updateBotCommand = useProjectStore((state) => state.updateBotCommand);
  const deleteBotCommand = useProjectStore((state) => state.deleteBotCommand);
  const setMenuButton = useProjectStore((state) => state.setMenuButton);
  const menu = project.botSettings.menuButton;

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 rounded-2xl border border-slate-800 bg-slate-950/70 p-6">
      <div><h2 className="text-lg font-semibold text-slate-100">{t.botSettings.title}</h2><p className="mt-1 text-sm text-slate-500">{t.botSettings.hint}</p></div>
      <section className="space-y-3">
        <div className="flex items-center justify-between"><h3 className="text-sm font-semibold text-slate-200">{t.botSettings.commands}</h3><Button className="h-8" onClick={addBotCommand}><Plus size={14} />{t.botSettings.addCommand}</Button></div>
        <div className="space-y-2">
          {project.botSettings.commands.map((command) => (
            <div key={command.id} className="grid grid-cols-[180px_1fr_auto] gap-2 rounded-xl border border-slate-800 bg-slate-900/40 p-3">
              <Field label={t.botSettings.command}><div className="relative"><span className="absolute left-3 top-2.5 text-slate-600">/</span><input className={`${inputClass} pl-6`} value={command.command} onChange={(event) => updateBotCommand(command.id, { command: event.target.value.replace(/^\/+/, "") })} /></div></Field>
              <Field label={t.botSettings.description}><input className={inputClass} value={command.description} onChange={(event) => updateBotCommand(command.id, { description: event.target.value })} /></Field>
              <button className="mt-6 rounded-lg p-2 text-slate-500 hover:bg-rose-500/10 hover:text-rose-300" onClick={() => deleteBotCommand(command.id)} aria-label={t.botSettings.deleteCommand} title={t.botSettings.deleteCommand}><Trash2 size={15} /></button>
            </div>
          ))}
        </div>
      </section>
      <section className="space-y-4 border-t border-slate-800 pt-5">
        <Field label={t.botSettings.menuButton}>
          <select className={inputClass} value={menu.type} onChange={(event) => {
            const type = event.target.value as "commands" | "default" | "webApp";
            setMenuButton(type === "webApp" ? { type, text: "Open app", url: "https://example.com" } : { type });
          }}>
            <option value="commands">{t.botSettings.commandsMenu}</option><option value="default">{t.botSettings.defaultMenu}</option><option value="webApp">{t.botSettings.webAppMenu}</option>
          </select>
        </Field>
        {menu.type === "webApp" ? <div className="grid grid-cols-2 gap-3"><Field label={t.botSettings.menuText}><input className={inputClass} value={menu.text} onChange={(event) => setMenuButton({ ...menu, text: event.target.value })} /></Field><Field label={t.botSettings.menuUrl} error={!isValidHttpsUrl(menu.url) ? t.botSettings.webAppHttps : undefined}><input className={inputClass} value={menu.url} onChange={(event) => setMenuButton({ ...menu, url: event.target.value })} /></Field></div> : null}
      </section>
    </div>
  );
}
