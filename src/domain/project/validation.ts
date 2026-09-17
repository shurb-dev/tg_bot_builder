import type { FlowTarget, LogicNode, Project } from "./types";
import { utf8ByteLength } from "../telegram/utf8";
import { GENERATED_CALLBACK_PREFIX, TELEGRAM_CALLBACK_DATA_MAX_BYTES, TELEGRAM_CALLBACK_DATA_MIN_BYTES } from "../telegram/limits";
import { deriveFlowEdges, targetExists } from "./selectors";

export type ValidationSeverity = "error" | "warning";
export type ValidationButtonKind = "inline" | "reply";
export type ValidationIssue = {
  id: string;
  severity: ValidationSeverity;
  code: string;
  params?: Record<string, string | number>;
  screenId?: string;
  nodeId?: string;
  buttonId?: string;
  buttonKind?: ValidationButtonKind;
};

function issue(severity: ValidationSeverity, code: string, params?: Record<string, string | number>, screenId?: string, buttonId?: string, buttonKind?: ValidationButtonKind, nodeId?: string): ValidationIssue {
  return { id: [severity, code, screenId, nodeId, buttonId, buttonKind, JSON.stringify(params ?? {})].filter(Boolean).join(":"), severity, code, params, screenId, nodeId, buttonId, buttonKind };
}

export function normalizeCommand(value: string): string { return value.trim().replace(/^\/+/, ""); }
export function isValidCommand(value: string): boolean { return /^[A-Za-z0-9_]{1,32}$/.test(normalizeCommand(value)); }
export function isValidBotCommand(value: string): boolean { return /^[a-z0-9_]{1,32}$/.test(normalizeCommand(value)); }
export function isValidHttpUrl(value: string): boolean {
  try { const url = new URL(value); return url.protocol === "http:" || url.protocol === "https:"; } catch { return false; }
}
export function isValidHttpsUrl(value: string): boolean { try { return new URL(value).protocol === "https:"; } catch { return false; } }
const characterLength = (value: string): number => Array.from(value).length;
const VARIABLE_KEY = /^[a-zA-Z_][a-zA-Z0-9_]*$/;
const ENV_KEY = /^[A-Z_][A-Z0-9_]*$/;
const RESERVED = new Set(["user", "input", "vars", "http", "env"]);
const TEMPLATE = /\{\{\s*([a-zA-Z_][a-zA-Z0-9_.]*)\s*\}\}/g;

function templatePaths(value: string): string[] { return [...value.matchAll(TEMPLATE)].map((match) => match[1]); }
function validateTemplate(value: string, project: Project, issues: ValidationIssue[], owner: string, nodeId?: string): void {
  const variables = new Set(project.variables.map((item) => item.key));
  const env = new Set(project.environmentVariables.map((item) => item.key));
  for (const path of templatePaths(value)) {
    if (path.startsWith("http.") || path.startsWith("input.") || ["user.id", "user.first_name", "user.last_name", "user.username"].includes(path)) continue;
    if (path.startsWith("vars.") && variables.has(path.slice(5))) continue;
    if (path.startsWith("env.") && env.has(path.slice(4))) continue;
    issues.push(issue(path.startsWith("http.") ? "warning" : "error", "UNKNOWN_TEMPLATE_PATH", { path, owner }, undefined, undefined, undefined, nodeId));
  }
}

function targetRequired(target: FlowTarget | null, project: Project, issues: ValidationIssue[], code: string, node: LogicNode): void {
  if (!target) issues.push(issue("error", code, { node: node.name || node.type }, undefined, undefined, undefined, node.id));
  else if (!targetExists(project, target)) issues.push(issue("error", "MISSING_FLOW_TARGET", { node: node.name || node.type }, undefined, undefined, undefined, node.id));
}

function validateReachability(project: Project, issues: ValidationIssue[]): void {
  const adjacency = new Map<string, string[]>();
  for (const edge of deriveFlowEdges(project)) adjacency.set(edge.source, [...(adjacency.get(edge.source) ?? []), edge.target]);
  const roots = project.screens.filter((screen) => screen.trigger).map((screen) => screen.id);
  if (roots.length === 0 && project.screens[0]) roots.push(project.screens[0].id);
  const visited = new Set<string>(roots);
  const stack = [...roots];
  while (stack.length > 0) {
    const current = stack.pop()!;
    for (const target of adjacency.get(current) ?? []) {
      if (visited.has(target)) continue;
      visited.add(target);
      stack.push(target);
    }
  }
  for (const screen of project.screens) {
    if (!screen.trigger && !visited.has(screen.id)) issues.push(issue("warning", "UNREACHABLE_SCREEN", { screen: screen.name.trim() || "Unnamed screen" }, screen.id));
  }
}

export function validateProject(project: Project): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  if (project.screens.length === 0) issues.push(issue("error", "NO_SCREENS"));
  const screenIds = new Set(project.screens.map((screen) => screen.id));
  const nodeIds = new Set(project.logicNodes.map((node) => node.id));
  const commandOwners = new Map<string, string[]>();
  const replyTextRoutes = new Map<string, { screenId: string; buttonId: string }[]>();

  for (const screen of project.screens) {
    const name = screen.name.trim() || "Unnamed screen";
    if (screen.trigger) {
      const command = normalizeCommand(screen.trigger.command);
      if (!isValidCommand(command)) issues.push(issue("error", "INVALID_COMMAND", { screen: name }, screen.id));
      else commandOwners.set(command, [...(commandOwners.get(command) ?? []), screen.id]);
    }
    if (!screen.message.text.trim() && !screen.message.media) issues.push(issue("warning", "EMPTY_CONTENT", { screen: name }, screen.id));
    if (screen.message.text) validateTemplate(screen.message.text, project, issues, name);
    if (screen.message.media && !isValidHttpUrl(screen.message.media.url)) issues.push(issue("error", "INVALID_MEDIA_URL", { screen: name }, screen.id));
    const inlineCount = screen.inlineKeyboard.reduce((sum, row) => sum + row.buttons.length, 0);
    const replyCount = screen.replyKeyboard.mode === "show" ? screen.replyKeyboard.config.rows.reduce((sum, row) => sum + row.buttons.length, 0) : 0;
    if (inlineCount === 0 && replyCount === 0) issues.push(issue("warning", "NO_BUTTONS", { screen: name }, screen.id));
    if (inlineCount > 0 && screen.replyKeyboard.mode !== "inherit") issues.push(issue("error", "INLINE_REPLY_CONFLICT", { screen: name }, screen.id));

    for (const row of screen.inlineKeyboard) for (const button of row.buttons) {
      const label = button.text || "Untitled";
      if (!button.text.trim()) issues.push(issue("error", "EMPTY_BUTTON_TEXT", { screen: name }, screen.id, button.id, "inline"));
      if (button.action.type === "screen" && !screenIds.has(button.action.screenId)) issues.push(issue("error", "MISSING_SCREEN_TARGET", { button: label }, screen.id, button.id, "inline"));
      if (button.action.type === "node" && !nodeIds.has(button.action.nodeId)) issues.push(issue("error", "MISSING_NODE_TARGET", { button: label }, screen.id, button.id, "inline"));
      if (button.action.type === "callback") {
        const bytes = utf8ByteLength(button.action.callbackData);
        if (bytes < TELEGRAM_CALLBACK_DATA_MIN_BYTES || bytes > TELEGRAM_CALLBACK_DATA_MAX_BYTES) issues.push(issue("error", "INVALID_CALLBACK_LENGTH", { button: label, bytes, max: 64 }, screen.id, button.id, "inline"));
        if (button.action.callbackData.startsWith(GENERATED_CALLBACK_PREFIX)) issues.push(issue("error", "RESERVED_CALLBACK_PREFIX", { button: label, prefix: GENERATED_CALLBACK_PREFIX }, screen.id, button.id, "inline"));
      }
      if (button.action.type === "url" && !isValidHttpUrl(button.action.url)) issues.push(issue("error", "INVALID_URL", { button: label }, screen.id, button.id, "inline"));
    }

    if (screen.replyKeyboard.mode === "show") {
      const config = screen.replyKeyboard.config;
      if (replyCount === 0) issues.push(issue("warning", "EMPTY_REPLY_KEYBOARD", { screen: name }, screen.id));
      if (config.oneTimeKeyboard && config.isPersistent) issues.push(issue("error", "REPLY_OPTION_CONFLICT", { screen: name }, screen.id));
      if (config.inputFieldPlaceholder !== null) {
        const length = characterLength(config.inputFieldPlaceholder);
        if (length < 1 || length > 64) issues.push(issue("error", "INVALID_REPLY_PLACEHOLDER", { screen: name, length }, screen.id));
      }
      for (const row of config.rows) for (const button of row.buttons) {
        const label = button.text || "Untitled";
        if (!button.text.trim()) issues.push(issue("error", "EMPTY_REPLY_BUTTON_TEXT", { screen: name }, screen.id, button.id, "reply"));
        if (button.action.type === "screen" && !screenIds.has(button.action.screenId)) issues.push(issue("error", "MISSING_REPLY_SCREEN_TARGET", { button: label }, screen.id, button.id, "reply"));
        if (button.action.type === "node" && !nodeIds.has(button.action.nodeId)) issues.push(issue("error", "MISSING_NODE_TARGET", { button: label }, screen.id, button.id, "reply"));
        if (button.action.type === "screen" || button.action.type === "node" || button.action.type === "text") {
          const key = button.text.trim(); if (key) replyTextRoutes.set(key, [...(replyTextRoutes.get(key) ?? []), { screenId: screen.id, buttonId: button.id }]);
        }
        if (button.action.type === "webApp" && !isValidHttpsUrl(button.action.url)) issues.push(issue("error", "INVALID_WEBAPP_URL", { button: label }, screen.id, button.id, "reply"));
      }
    }
  }

  for (const [command, owners] of commandOwners) if (owners.length > 1) owners.forEach((screenId) => issues.push(issue("error", "DUPLICATE_COMMAND", { command }, screenId)));
  if (!commandOwners.has("start")) issues.push(issue("warning", "NO_START"));
  for (const [text, owners] of replyTextRoutes) if (owners.length > 1) owners.forEach(({ screenId, buttonId }) => issues.push(issue("error", "DUPLICATE_REPLY_NAV_TEXT", { text }, screenId, buttonId, "reply")));

  const botCommandOwners = new Map<string, string[]>();
  for (const command of project.botSettings.commands) {
    const normalized = normalizeCommand(command.command);
    if (!isValidBotCommand(normalized)) issues.push(issue("error", "INVALID_BOT_COMMAND", { command: command.command }));
    if (!command.description.trim() || characterLength(command.description) > 256) issues.push(issue("error", "INVALID_BOT_COMMAND_DESCRIPTION", { command: normalized || command.command }));
    if (normalized) botCommandOwners.set(normalized, [...(botCommandOwners.get(normalized) ?? []), command.id]);
  }
  for (const [command, ids] of botCommandOwners) if (ids.length > 1) issues.push(issue("error", "DUPLICATE_BOT_COMMAND", { command }));
  if (project.botSettings.menuButton.type === "webApp") {
    if (!project.botSettings.menuButton.text.trim()) issues.push(issue("error", "EMPTY_MENU_BUTTON_TEXT"));
    if (!isValidHttpsUrl(project.botSettings.menuButton.url)) issues.push(issue("error", "INVALID_MENU_WEBAPP_URL"));
  }

  const variableOwners = new Map<string, string[]>();
  for (const variable of project.variables) {
    if (!VARIABLE_KEY.test(variable.key) || RESERVED.has(variable.key)) issues.push(issue("error", "INVALID_VARIABLE_KEY", { key: variable.key }));
    if (variable.key) variableOwners.set(variable.key, [...(variableOwners.get(variable.key) ?? []), variable.id]);
    if (variable.defaultValue !== null && typeof variable.defaultValue !== variable.type) issues.push(issue("error", "VARIABLE_TYPE_MISMATCH", { key: variable.key }));
  }
  for (const [key, ids] of variableOwners) if (ids.length > 1) issues.push(issue("error", "DUPLICATE_VARIABLE_KEY", { key }));

  const envOwners = new Map<string, string[]>();
  for (const env of project.environmentVariables) {
    if (!ENV_KEY.test(env.key)) issues.push(issue("error", "INVALID_ENV_KEY", { key: env.key }));
    if (env.key) envOwners.set(env.key, [...(envOwners.get(env.key) ?? []), env.id]);
  }
  for (const [key, ids] of envOwners) if (ids.length > 1) issues.push(issue("error", "DUPLICATE_ENV_KEY", { key }));

  for (const node of project.logicNodes) {
    const nodeName = node.name.trim() || node.type;
    if (!node.name.trim()) issues.push(issue("warning", "EMPTY_NODE_NAME", { node: node.type }, undefined, undefined, undefined, node.id));
    if (node.type === "input") {
      if (!node.prompt.trim()) issues.push(issue("error", "EMPTY_INPUT_PROMPT", { node: nodeName }, undefined, undefined, undefined, node.id));
      if (!/^input\.[a-zA-Z_][a-zA-Z0-9_]*$/.test(node.variable)) issues.push(issue("error", "INVALID_INPUT_VARIABLE", { node: nodeName }, undefined, undefined, undefined, node.id));
      if (node.validation.minLength !== undefined && node.validation.maxLength !== undefined && node.validation.minLength > node.validation.maxLength) issues.push(issue("error", "INVALID_INPUT_BOUNDS", { node: nodeName }, undefined, undefined, undefined, node.id));
      if (node.validation.min !== undefined && node.validation.max !== undefined && node.validation.min > node.validation.max) issues.push(issue("error", "INVALID_INPUT_BOUNDS", { node: nodeName }, undefined, undefined, undefined, node.id));
      if (node.validation.pattern) { try { new RegExp(node.validation.pattern); } catch { issues.push(issue("error", "INVALID_INPUT_PATTERN", { node: nodeName }, undefined, undefined, undefined, node.id)); } }
      targetRequired(node.next, project, issues, "MISSING_NEXT_TARGET", node);
      validateTemplate(node.prompt, project, issues, nodeName, node.id);
    } else if (node.type === "condition") {
      if (node.rules.length === 0) issues.push(issue("error", "EMPTY_CONDITION", { node: nodeName }, undefined, undefined, undefined, node.id));
      for (const rule of node.rules) {
        if (!rule.left.trim()) issues.push(issue("error", "EMPTY_CONDITION_OPERAND", { node: nodeName }, undefined, undefined, undefined, node.id));
        if (!["exists", "notExists"].includes(rule.operator) && !rule.right.trim()) issues.push(issue("error", "EMPTY_CONDITION_OPERAND", { node: nodeName }, undefined, undefined, undefined, node.id));
        validateTemplate(rule.left, project, issues, nodeName, node.id); validateTemplate(rule.right, project, issues, nodeName, node.id);
      }
      targetRequired(node.trueTarget, project, issues, "MISSING_TRUE_TARGET", node); targetRequired(node.falseTarget, project, issues, "MISSING_FALSE_TARGET", node);
    } else if (node.type === "setVariable") {
      const key = node.variable.startsWith("vars.") ? node.variable.slice(5) : node.variable;
      if (!project.variables.some((variable) => variable.key === key)) issues.push(issue("error", "UNKNOWN_SET_VARIABLE", { key }, undefined, undefined, undefined, node.id));
      validateTemplate(node.value, project, issues, nodeName, node.id); targetRequired(node.next, project, issues, "MISSING_NEXT_TARGET", node);
    } else if (node.type === "http") {
      if (!isValidHttpUrl(node.url) && !node.url.includes("{{")) issues.push(issue("error", "INVALID_HTTP_URL", { node: nodeName }, undefined, undefined, undefined, node.id));
      if (!VARIABLE_KEY.test(node.resultKey)) issues.push(issue("error", "INVALID_HTTP_RESULT_KEY", { key: node.resultKey }, undefined, undefined, undefined, node.id));
      if (node.timeoutMs < 100 || node.timeoutMs > 120000) issues.push(issue("error", "INVALID_HTTP_TIMEOUT", { node: nodeName }, undefined, undefined, undefined, node.id));
      if (node.body.type === "json") { try { JSON.parse(node.body.value.replace(TEMPLATE, "0")); } catch { issues.push(issue("error", "INVALID_HTTP_JSON", { node: nodeName }, undefined, undefined, undefined, node.id)); } }
      if (node.mock.status < 100 || node.mock.status > 599) issues.push(issue("error", "INVALID_HTTP_MOCK_STATUS", { node: nodeName }, undefined, undefined, undefined, node.id));
      validateTemplate(node.url, project, issues, nodeName, node.id); node.headers.forEach((item) => { validateTemplate(item.key, project, issues, nodeName, node.id); validateTemplate(item.value, project, issues, nodeName, node.id); });
      node.query.forEach((item) => { validateTemplate(item.key, project, issues, nodeName, node.id); validateTemplate(item.value, project, issues, nodeName, node.id); });
      if (node.body.type !== "none") validateTemplate(node.body.value, project, issues, nodeName, node.id);
      targetRequired(node.successTarget, project, issues, "MISSING_SUCCESS_TARGET", node); targetRequired(node.errorTarget, project, issues, "MISSING_ERROR_TARGET", node);
    } else {
      if (!node.text.trim()) issues.push(issue("warning", "EMPTY_SEND_MESSAGE", { node: nodeName }, undefined, undefined, undefined, node.id));
      validateTemplate(node.text, project, issues, nodeName, node.id); targetRequired(node.next, project, issues, "MISSING_NEXT_TARGET", node);
    }
  }

  const httpKeys = new Map<string, number>();
  project.logicNodes.filter((node): node is Extract<LogicNode, { type: "http" }> => node.type === "http").forEach((node) => httpKeys.set(node.resultKey, (httpKeys.get(node.resultKey) ?? 0) + 1));
  for (const [key, count] of httpKeys) if (count > 1) issues.push(issue("error", "DUPLICATE_HTTP_RESULT_KEY", { key }));

  validateReachability(project, issues);
  return issues;
}

export function hasBlockingErrors(issues: ValidationIssue[]): boolean { return issues.some((item) => item.severity === "error"); }
