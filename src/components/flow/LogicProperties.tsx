"use client";

import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Field, inputClass, textareaClass } from "@/components/ui/Field";
import type { ConditionOperator, FlowTarget, HttpRequestNode, LogicNode } from "@/domain/project/types";
import { getV12Translations } from "@/i18n/v12-translations";
import { usePreferencesStore } from "@/store/preferences-store";
import { useProjectStore } from "@/store/project-store";

function targetValue(target: FlowTarget | null): string {
  if (!target) return "";
  return target.type === "screen" ? `screen:${target.screenId}` : `node:${target.nodeId}`;
}
function parseTarget(value: string): FlowTarget | null {
  if (!value) return null;
  const [type, id] = value.split(":", 2);
  return type === "screen" ? { type: "screen", screenId: id } : { type: "node", nodeId: id };
}

function TargetSelect({ label, value, onChange, excludeNodeId }: { label: string; value: FlowTarget | null; onChange: (target: FlowTarget | null) => void; excludeNodeId: string }) {
  const locale = usePreferencesStore((state) => state.locale);
  const t = getV12Translations(locale);
  const project = useProjectStore((state) => state.project);
  return <Field label={label}><select aria-label={label} className={inputClass} value={targetValue(value)} onChange={(event) => onChange(parseTarget(event.target.value))}><option value="">{t.noTarget}</option><optgroup label={t.screenTarget}>{project.screens.map((screen) => <option key={screen.id} value={`screen:${screen.id}`}>{screen.name}</option>)}</optgroup><optgroup label={t.nodeTarget}>{project.logicNodes.filter((node) => node.id !== excludeNodeId).map((node) => <option key={node.id} value={`node:${node.id}`}>{node.name}</option>)}</optgroup></select></Field>;
}

const operators: ConditionOperator[] = ["equals", "notEquals", "contains", "notContains", "greaterThan", "greaterThanOrEqual", "lessThan", "lessThanOrEqual", "exists", "notExists"];

export function LogicProperties({ node }: { node: LogicNode }) {
  const locale = usePreferencesStore((state) => state.locale);
  const t = getV12Translations(locale);
  const project = useProjectStore((state) => state.project);
  const update = useProjectStore((state) => state.updateLogicNode);
  const setTarget = useProjectStore((state) => state.setLogicNodeTarget);
  const remove = useProjectStore((state) => state.deleteLogicNode);
  const addRule = useProjectStore((state) => state.addConditionRule);
  const updateRule = useProjectStore((state) => state.updateConditionRule);
  const deleteRule = useProjectStore((state) => state.deleteConditionRule);
  const addPair = useProjectStore((state) => state.addHttpPair);
  const updatePair = useProjectStore((state) => state.updateHttpPair);
  const deletePair = useProjectStore((state) => state.deleteHttpPair);

  const target = (port: "next" | "true" | "false" | "success" | "error", value: FlowTarget | null) => setTarget(node.id, port, value);
  return (
    <aside className="w-96 shrink-0 overflow-y-auto border-l border-slate-800 bg-slate-950/90 p-4">
      <div className="mb-4 text-xs font-semibold uppercase tracking-[0.18em] text-violet-300">{t.flowBuilder}</div>
      <div className="space-y-4">
        <Field label={t.nodeName}><input aria-label={t.nodeName} className={inputClass} value={node.name} onChange={(event) => update(node.id, { name: event.target.value }, `node:${node.id}:name`)} /></Field>

        {node.type === "input" ? <>
          <Field label={t.prompt}><textarea aria-label={t.prompt} className={textareaClass} value={node.prompt} onChange={(event) => update(node.id, { prompt: event.target.value } as Partial<LogicNode>, `node:${node.id}:prompt`)} /></Field>
          <Field label={t.saveTo}><input aria-label={t.saveTo} className={inputClass} value={node.variable} onChange={(event) => update(node.id, { variable: event.target.value } as Partial<LogicNode>, `node:${node.id}:variable`)} /></Field>
          <Field label={t.inputType}><select aria-label={t.inputType} className={inputClass} value={node.inputType} onChange={(event) => update(node.id, { inputType: event.target.value } as Partial<LogicNode>)}><option value="text">text</option><option value="number">number</option><option value="email">email</option><option value="phone">phone</option></select></Field>
          <label className="flex items-center gap-2 text-xs text-slate-300"><input type="checkbox" checked={node.required} onChange={(event) => update(node.id, { required: event.target.checked } as Partial<LogicNode>)} />{t.required}</label>
          <Field label={t.invalidMessage}><input aria-label={t.invalidMessage} className={inputClass} value={node.invalidMessage} onChange={(event) => update(node.id, { invalidMessage: event.target.value } as Partial<LogicNode>)} /></Field>
          <div className="grid grid-cols-2 gap-2"><Field label={t.minLength}><input aria-label={t.minLength} type="number" className={inputClass} value={node.validation.minLength ?? ""} onChange={(event) => update(node.id, { validation: { ...node.validation, minLength: event.target.value ? Number(event.target.value) : undefined } } as Partial<LogicNode>)} /></Field><Field label={t.maxLength}><input aria-label={t.maxLength} type="number" className={inputClass} value={node.validation.maxLength ?? ""} onChange={(event) => update(node.id, { validation: { ...node.validation, maxLength: event.target.value ? Number(event.target.value) : undefined } } as Partial<LogicNode>)} /></Field></div>
          {node.inputType === "number" ? <div className="grid grid-cols-2 gap-2"><Field label={t.min}><input aria-label={t.min} type="number" className={inputClass} value={node.validation.min ?? ""} onChange={(event) => update(node.id, { validation: { ...node.validation, min: event.target.value ? Number(event.target.value) : undefined } } as Partial<LogicNode>)} /></Field><Field label={t.max}><input aria-label={t.max} type="number" className={inputClass} value={node.validation.max ?? ""} onChange={(event) => update(node.id, { validation: { ...node.validation, max: event.target.value ? Number(event.target.value) : undefined } } as Partial<LogicNode>)} /></Field></div> : null}
          <Field label={t.pattern}><input aria-label={t.pattern} className={inputClass} value={node.validation.pattern ?? ""} onChange={(event) => update(node.id, { validation: { ...node.validation, pattern: event.target.value || undefined } } as Partial<LogicNode>)} /></Field>
          <TargetSelect label={t.nextTarget} value={node.next} excludeNodeId={node.id} onChange={(value) => target("next", value)} />
        </> : null}

        {node.type === "condition" ? <>
          <Field label={t.combinator}><select aria-label={t.combinator} className={inputClass} value={node.combinator} onChange={(event) => update(node.id, { combinator: event.target.value } as Partial<LogicNode>)}><option value="and">AND</option><option value="or">OR</option></select></Field>
          <div className="space-y-2">{node.rules.map((rule) => <div key={rule.id} className="space-y-2 rounded-xl border border-slate-800 p-3"><Field label={t.left}><input aria-label={`${t.left} ${rule.id}`} className={inputClass} value={rule.left} onChange={(event) => updateRule(node.id, rule.id, { left: event.target.value })} /></Field><Field label={t.operator}><select aria-label={`${t.operator} ${rule.id}`} className={inputClass} value={rule.operator} onChange={(event) => updateRule(node.id, rule.id, { operator: event.target.value as ConditionOperator })}>{operators.map((op) => <option key={op} value={op}>{op}</option>)}</select></Field>{!['exists','notExists'].includes(rule.operator) ? <Field label={t.right}><input aria-label={`${t.right} ${rule.id}`} className={inputClass} value={rule.right} onChange={(event) => updateRule(node.id, rule.id, { right: event.target.value })} /></Field> : null}<Button className="h-7 w-full border-rose-500/20 text-rose-300" onClick={() => deleteRule(node.id, rule.id)}><Trash2 size={12} />{t.deleteRule}</Button></div>)}</div>
          <Button className="w-full" onClick={() => addRule(node.id)}><Plus size={13} />{t.addRule}</Button>
          <TargetSelect label={t.trueTarget} value={node.trueTarget} excludeNodeId={node.id} onChange={(value) => target("true", value)} /><TargetSelect label={t.falseTarget} value={node.falseTarget} excludeNodeId={node.id} onChange={(value) => target("false", value)} />
        </> : null}

        {node.type === "setVariable" ? <><Field label={t.variable}><select aria-label={t.variable} className={inputClass} value={node.variable} onChange={(event) => update(node.id, { variable: event.target.value } as Partial<LogicNode>)}><option value="">—</option>{project.variables.map((variable) => <option key={variable.id} value={`vars.${variable.key}`}>{variable.key}</option>)}</select></Field><Field label={t.value}><input aria-label={t.value} className={inputClass} value={node.value} onChange={(event) => update(node.id, { value: event.target.value } as Partial<LogicNode>, `node:${node.id}:value`)} /></Field><TargetSelect label={t.nextTarget} value={node.next} excludeNodeId={node.id} onChange={(value) => target("next", value)} /></> : null}

        {node.type === "http" ? <HttpFields node={node} update={update} setTarget={target} addPair={addPair} updatePair={updatePair} deletePair={deletePair} /> : null}

        {node.type === "sendMessage" ? <><Field label={t.message}><textarea aria-label={t.message} className={textareaClass} value={node.text} onChange={(event) => update(node.id, { text: event.target.value } as Partial<LogicNode>, `node:${node.id}:text`)} /></Field><TargetSelect label={t.nextTarget} value={node.next} excludeNodeId={node.id} onChange={(value) => target("next", value)} /></> : null}

        <Button className="w-full border-rose-500/30 text-rose-300 hover:bg-rose-500/10" onClick={() => remove(node.id)}><Trash2 size={14} />{t.deleteNode}</Button>
      </div>
    </aside>
  );
}

function HttpFields({ node, update, setTarget, addPair, updatePair, deletePair }: {
  node: HttpRequestNode;
  update: (nodeId: string, patch: Partial<LogicNode>, historyKey?: string) => void;
  setTarget: (port: "next" | "true" | "false" | "success" | "error", target: FlowTarget | null) => void;
  addPair: (nodeId: string, kind: "headers" | "query") => void;
  updatePair: (nodeId: string, kind: "headers" | "query", pairId: string, patch: { key?: string; value?: string }) => void;
  deletePair: (nodeId: string, kind: "headers" | "query", pairId: string) => void;
}) {
  const locale = usePreferencesStore((state) => state.locale); const t = getV12Translations(locale);
  const pairSection = (kind: "headers" | "query", title: string) => <div className="space-y-2"><div className="flex items-center justify-between text-xs font-semibold text-slate-300"><span>{title}</span><button className="text-sky-300" onClick={() => addPair(node.id, kind)}>+ {t.addPair}</button></div>{node[kind].map((pair) => <div key={pair.id} className="grid grid-cols-[1fr_1fr_auto] gap-1"><input aria-label={`${title} key`} className={inputClass} value={pair.key} onChange={(event) => updatePair(node.id, kind, pair.id, { key: event.target.value })} /><input aria-label={`${title} value`} className={inputClass} value={pair.value} onChange={(event) => updatePair(node.id, kind, pair.id, { value: event.target.value })} /><button aria-label={`Delete ${title}`} className="p-2 text-rose-300" onClick={() => deletePair(node.id, kind, pair.id)}><Trash2 size={13} /></button></div>)}</div>;
  return <>
    <div className="grid grid-cols-[100px_1fr] gap-2"><Field label={t.method}><select aria-label={t.method} className={inputClass} value={node.method} onChange={(event) => update(node.id, { method: event.target.value } as Partial<LogicNode>)}>{["GET","POST","PUT","PATCH","DELETE"].map((m) => <option key={m}>{m}</option>)}</select></Field><Field label={t.url}><input aria-label={t.url} className={inputClass} value={node.url} onChange={(event) => update(node.id, { url: event.target.value } as Partial<LogicNode>)} /></Field></div>
    {pairSection("headers", t.headers)}{pairSection("query", t.query)}
    <Field label={t.bodyType}><select aria-label={t.bodyType} className={inputClass} value={node.body.type} onChange={(event) => update(node.id, { body: event.target.value === "none" ? { type: "none" } : { type: event.target.value, value: "" } } as Partial<LogicNode>)}><option value="none">none</option><option value="json">json</option><option value="text">text</option></select></Field>
    {node.body.type !== "none" ? <Field label={t.body}><textarea aria-label={t.body} className={textareaClass} value={node.body.value} onChange={(event) => update(node.id, { body: { ...node.body, value: event.target.value } } as Partial<LogicNode>)} /></Field> : null}
    <div className="grid grid-cols-2 gap-2"><Field label={t.resultKey}><input aria-label={t.resultKey} className={inputClass} value={node.resultKey} onChange={(event) => update(node.id, { resultKey: event.target.value } as Partial<LogicNode>)} /></Field><Field label={t.timeout}><input aria-label={t.timeout} type="number" className={inputClass} value={node.timeoutMs} onChange={(event) => update(node.id, { timeoutMs: Number(event.target.value) } as Partial<LogicNode>)} /></Field></div>
    <label className="flex items-center gap-2 text-xs text-slate-300"><input aria-label={t.mock} type="checkbox" checked={node.mock.enabled} onChange={(event) => update(node.id, { mock: { ...node.mock, enabled: event.target.checked } } as Partial<LogicNode>)} />{t.mock}</label>
    {node.mock.enabled ? <><Field label={t.mockStatus}><input aria-label={t.mockStatus} type="number" className={inputClass} value={node.mock.status} onChange={(event) => update(node.id, { mock: { ...node.mock, status: Number(event.target.value) } } as Partial<LogicNode>)} /></Field><Field label={t.mockBody}><textarea aria-label={t.mockBody} className={textareaClass} value={node.mock.body} onChange={(event) => update(node.id, { mock: { ...node.mock, body: event.target.value } } as Partial<LogicNode>)} /></Field></> : null}
    <TargetSelect label={t.successTarget} value={node.successTarget} excludeNodeId={node.id} onChange={(value) => setTarget("success", value)} /><TargetSelect label={t.errorTarget} value={node.errorTarget} excludeNodeId={node.id} onChange={(value) => setTarget("error", value)} />
  </>;
}
