import type { FlowTarget, HttpRequestNode, Project, ProjectVariable } from "@/domain/project/types";
import { getLogicNode, getScreen } from "@/domain/project/selectors";
import { evaluateCondition } from "./condition";
import { inputVariableKey, validateInputValue } from "./input";
import { resolveTemplate } from "./templates";
import type { HttpAdapter, HttpRuntimeResult, RuntimeContext, SimulationMessage, SimulationState } from "./types";

export const MAX_AUTO_STEPS = 100;
const messageId = () => crypto.randomUUID();
const msg = (from: SimulationMessage["from"], text: string): SimulationMessage => ({ id: messageId(), from, text });

function defaultValue(variable: ProjectVariable): unknown {
  if (variable.defaultValue !== null) return variable.defaultValue;
  if (variable.type === "number") return 0;
  if (variable.type === "boolean") return false;
  return "";
}

export function createRuntimeContext(project: Project): RuntimeContext {
  return {
    user: { id: 1, first_name: "Test", username: "test_user" },
    input: {},
    vars: Object.fromEntries(project.variables.map((variable) => [variable.key, defaultValue(variable)])),
    http: {},
    env: Object.fromEntries(project.environmentVariables.map((item) => [item.key, ""])),
  };
}

export function createSimulationState(project: Project, start: FlowTarget | null = null): SimulationState {
  return { currentTarget: start, context: createRuntimeContext(project), waitingForInput: null, messages: [], status: start ? "running" : "idle", error: null, steps: 0 };
}

function queryString(node: HttpRequestNode, context: RuntimeContext): Record<string, string> {
  return Object.fromEntries(node.query.filter((item) => item.key.trim()).map((item) => [resolveTemplate(item.key, context), resolveTemplate(item.value, context)]));
}
function headers(node: HttpRequestNode, context: RuntimeContext): Record<string, string> {
  return Object.fromEntries(node.headers.filter((item) => item.key.trim()).map((item) => [resolveTemplate(item.key, context), resolveTemplate(item.value, context)]));
}
function requestBody(node: HttpRequestNode, context: RuntimeContext): string | null {
  return node.body.type === "none" ? null : resolveTemplate(node.body.value, context);
}

export const browserHttpAdapter: HttpAdapter = async (node, request) => {
  if (node.mock.enabled) {
    let json: unknown;
    try { json = JSON.parse(node.mock.body); } catch { json = undefined; }
    return { status: node.mock.status, ok: node.mock.status >= 200 && node.mock.status < 300, body: node.mock.body, json };
  }
  const url = new URL(request.url);
  Object.entries(request.query).forEach(([key, value]) => url.searchParams.set(key, value));
  try {
    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), node.timeoutMs);
    const response = await fetch(url, {
      method: node.method,
      headers: request.headers,
      body: node.method === "GET" || node.method === "DELETE" ? undefined : request.body,
      signal: controller.signal,
    });
    window.clearTimeout(timer);
    const body = await response.text();
    let json: unknown;
    try { json = JSON.parse(body); } catch { json = undefined; }
    return { status: response.status, ok: response.ok, body, json };
  } catch (error) {
    return { status: 0, ok: false, body: "", error: error instanceof Error ? error.message : String(error) };
  }
};

function parseVariableValue(raw: string, variable: ProjectVariable | undefined): unknown {
  if (!variable || variable.type === "string") return raw;
  if (variable.type === "number") return Number(raw);
  return raw === "true" || raw === "1";
}

export async function runSimulation(project: Project, state: SimulationState, adapter: HttpAdapter = browserHttpAdapter): Promise<SimulationState> {
  const next = structuredClone(state);
  next.status = "running";
  next.error = null;
  for (let autoSteps = 0; autoSteps < MAX_AUTO_STEPS; autoSteps += 1) {
    next.steps += 1;
    const target = next.currentTarget;
    if (!target) return { ...next, status: "finished" };

    if (target.type === "screen") {
      const screen = getScreen(project, target.screenId);
      if (!screen) return { ...next, status: "error", error: "Target screen does not exist." };
      const text = resolveTemplate(screen.message.text, next.context);
      if (text) next.messages.push(msg("bot", text));
      return { ...next, status: "idle", waitingForInput: null };
    }

    const node = getLogicNode(project, target.nodeId);
    if (!node) return { ...next, status: "error", error: "Target logic node does not exist." };
    if (node.type === "input") {
      next.messages.push(msg("bot", resolveTemplate(node.prompt, next.context)));
      return { ...next, status: "waitingInput", waitingForInput: node.id };
    }
    if (node.type === "sendMessage") {
      next.messages.push(msg("bot", resolveTemplate(node.text, next.context)));
      next.currentTarget = node.next;
      continue;
    }
    if (node.type === "setVariable") {
      const key = node.variable.startsWith("vars.") ? node.variable.slice(5) : node.variable;
      const variable = project.variables.find((item) => item.key === key);
      next.context.vars[key] = parseVariableValue(resolveTemplate(node.value, next.context), variable);
      next.currentTarget = node.next;
      continue;
    }
    if (node.type === "condition") {
      next.currentTarget = evaluateCondition(node, next.context) ? node.trueTarget : node.falseTarget;
      continue;
    }
    const result: HttpRuntimeResult = await adapter(node, {
      url: resolveTemplate(node.url, next.context), headers: headers(node, next.context), query: queryString(node, next.context), body: requestBody(node, next.context),
    });
    next.context.http[node.resultKey] = result;
    next.currentTarget = result.ok ? node.successTarget : node.errorTarget;
  }
  return { ...next, status: "error", error: `Flow stopped after ${MAX_AUTO_STEPS} automatic steps. Possible infinite loop.` };
}

export async function submitSimulationInput(project: Project, state: SimulationState, raw: string, adapter: HttpAdapter = browserHttpAdapter): Promise<SimulationState> {
  if (!state.waitingForInput) return state;
  const node = getLogicNode(project, state.waitingForInput);
  if (!node || node.type !== "input") return { ...state, status: "error", error: "Waiting input node is missing." };
  const validated = validateInputValue(node, raw);
  const next = structuredClone(state);
  next.messages.push(msg("user", raw));
  if (!validated.ok) {
    next.messages.push(msg("bot", resolveTemplate(validated.error, next.context)));
    return next;
  }
  next.context.input[inputVariableKey(node.variable)] = validated.value;
  next.waitingForInput = null;
  next.currentTarget = node.next;
  return runSimulation(project, next, adapter);
}

export async function continueSimulation(project: Project, state: SimulationState, target: FlowTarget, adapter: HttpAdapter = browserHttpAdapter): Promise<SimulationState> {
  return runSimulation(project, { ...structuredClone(state), currentTarget: target, status: "running" }, adapter);
}
