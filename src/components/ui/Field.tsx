import type { PropsWithChildren, ReactNode } from "react";

export function Field({ label, hint, error, children }: PropsWithChildren<{ label: string; hint?: ReactNode; error?: string }>) {
  return (
    <label className="grid gap-1.5 text-sm text-slate-300">
      <span className="flex items-center justify-between gap-3 font-medium">
        {label}
        {hint ? <span className="text-xs font-normal text-slate-500">{hint}</span> : null}
      </span>
      {children}
      {error ? <span className="text-xs text-rose-400">{error}</span> : null}
    </label>
  );
}

export const inputClass = "h-10 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 text-sm text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20";
export const textareaClass = `${inputClass} min-h-28 resize-y py-2`;
