import type { Project } from "./types";
import { utf8ByteLength } from "../telegram/utf8";
import { GENERATED_CALLBACK_PREFIX, TELEGRAM_CALLBACK_DATA_MAX_BYTES, TELEGRAM_CALLBACK_DATA_MIN_BYTES } from "../telegram/limits";

export type ValidationSeverity = "error" | "warning";
export type ValidationButtonKind = "inline" | "reply";

export type ValidationIssue = {
  id: string;
  severity: ValidationSeverity;
  code: string;
  params?: Record<string, string | number>;
  screenId?: string;
  buttonId?: string;
  buttonKind?: ValidationButtonKind;
};

function issue(severity: ValidationSeverity, code: string, params?: Record<string, string | number>, screenId?: string, buttonId?: string, buttonKind?: ValidationButtonKind): ValidationIssue {
  return { id: [severity, code, screenId, buttonId, buttonKind, JSON.stringify(params ?? {})].filter(Boolean).join(":"), severity, code, params, screenId, buttonId, buttonKind };
}

export function normalizeCommand(value: string): string {
  return value.trim().replace(/^\/+/, "");
}

export function isValidCommand(value: string): boolean {
  return /^[A-Za-z0-9_]{1,32}$/.test(normalizeCommand(value));
}

export function isValidHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export function isValidHttpsUrl(value: string): boolean {
  try { return new URL(value).protocol === "https:"; } catch { return false; }
}

export function validateProject(project: Project): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  if (project.screens.length === 0) return [issue("error", "NO_SCREENS")];

  const screenIds = new Set(project.screens.map((screen) => screen.id));
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
    if (screen.message.media && !isValidHttpUrl(screen.message.media.url)) issues.push(issue("error", "INVALID_MEDIA_URL", { screen: name }, screen.id));

    const inlineCount = screen.inlineKeyboard.reduce((sum, row) => sum + row.buttons.length, 0);
    const replyCount = screen.replyKeyboard.mode === "show" ? screen.replyKeyboard.config.rows.reduce((sum, row) => sum + row.buttons.length, 0) : 0;
    if (inlineCount === 0 && replyCount === 0) issues.push(issue("warning", "NO_BUTTONS", { screen: name }, screen.id));

    if (inlineCount > 0 && screen.replyKeyboard.mode !== "inherit") {
      issues.push(issue("error", "INLINE_REPLY_CONFLICT", { screen: name }, screen.id));
    }

    for (const row of screen.inlineKeyboard) {
      for (const button of row.buttons) {
        const label = button.text || "Untitled";
        if (!button.text.trim()) issues.push(issue("error", "EMPTY_BUTTON_TEXT", { screen: name }, screen.id, button.id, "inline"));
        if (button.action.type === "screen" && !screenIds.has(button.action.screenId)) issues.push(issue("error", "MISSING_SCREEN_TARGET", { button: label }, screen.id, button.id, "inline"));
        if (button.action.type === "callback") {
          const bytes = utf8ByteLength(button.action.callbackData);
          if (bytes < TELEGRAM_CALLBACK_DATA_MIN_BYTES || bytes > TELEGRAM_CALLBACK_DATA_MAX_BYTES) issues.push(issue("error", "INVALID_CALLBACK_LENGTH", { button: label, bytes, max: 64 }, screen.id, button.id, "inline"));
          if (button.action.callbackData.startsWith(GENERATED_CALLBACK_PREFIX)) issues.push(issue("error", "RESERVED_CALLBACK_PREFIX", { button: label, prefix: GENERATED_CALLBACK_PREFIX }, screen.id, button.id, "inline"));
        }
        if (button.action.type === "url" && !isValidHttpUrl(button.action.url)) issues.push(issue("error", "INVALID_URL", { button: label }, screen.id, button.id, "inline"));
      }
    }

    if (screen.replyKeyboard.mode === "show") {
      const config = screen.replyKeyboard.config;
      if (replyCount === 0) issues.push(issue("warning", "EMPTY_REPLY_KEYBOARD", { screen: name }, screen.id));
      if (config.oneTimeKeyboard && config.isPersistent) issues.push(issue("error", "REPLY_OPTION_CONFLICT", { screen: name }, screen.id));
      for (const row of config.rows) {
        for (const button of row.buttons) {
          const label = button.text || "Untitled";
          if (!button.text.trim()) issues.push(issue("error", "EMPTY_REPLY_BUTTON_TEXT", { screen: name }, screen.id, button.id, "reply"));
          if (button.action.type === "screen" && !screenIds.has(button.action.screenId)) {
            issues.push(issue("error", "MISSING_REPLY_SCREEN_TARGET", { button: label }, screen.id, button.id, "reply"));
          }
          if (button.action.type === "screen" || button.action.type === "text") {
            const key = button.text.trim();
            if (key) replyTextRoutes.set(key, [...(replyTextRoutes.get(key) ?? []), { screenId: screen.id, buttonId: button.id }]);
          }
          if (button.action.type === "webApp" && !isValidHttpsUrl(button.action.url)) issues.push(issue("error", "INVALID_WEBAPP_URL", { button: label }, screen.id, button.id, "reply"));
        }
      }
    }
  }

  for (const [command, owners] of commandOwners) {
    if (owners.length > 1) owners.forEach((screenId) => issues.push(issue("error", "DUPLICATE_COMMAND", { command }, screenId)));
  }
  if (!commandOwners.has("start")) issues.push(issue("warning", "NO_START"));

  for (const [text, owners] of replyTextRoutes) {
    if (owners.length > 1) owners.forEach(({ screenId, buttonId }) => issues.push(issue("error", "DUPLICATE_REPLY_NAV_TEXT", { text }, screenId, buttonId, "reply")));
  }

  const botCommandOwners = new Map<string, string[]>();
  for (const command of project.botSettings.commands) {
    const normalized = normalizeCommand(command.command);
    if (!isValidCommand(normalized)) issues.push(issue("error", "INVALID_BOT_COMMAND", { command: command.command }));
    if (!command.description.trim() || command.description.length > 256) issues.push(issue("error", "INVALID_BOT_COMMAND_DESCRIPTION", { command: normalized || command.command }));
    if (normalized) botCommandOwners.set(normalized, [...(botCommandOwners.get(normalized) ?? []), command.id]);
  }
  for (const [command, ids] of botCommandOwners) if (ids.length > 1) issues.push(issue("error", "DUPLICATE_BOT_COMMAND", { command }));
  if (project.botSettings.menuButton.type === "webApp") {
    if (!project.botSettings.menuButton.text.trim()) issues.push(issue("error", "EMPTY_MENU_BUTTON_TEXT"));
    if (!isValidHttpsUrl(project.botSettings.menuButton.url)) issues.push(issue("error", "INVALID_MENU_WEBAPP_URL"));
  }

  const roots = project.screens.filter((screen) => screen.trigger && isValidCommand(screen.trigger.command)).map((screen) => screen.id);
  const adjacency = new Map<string, string[]>();
  for (const screen of project.screens) {
    const inlineTargets = screen.inlineKeyboard.flatMap((row) => row.buttons.flatMap((button) => button.action.type === "screen" && screenIds.has(button.action.screenId) ? [button.action.screenId] : []));
    const replyTargets = screen.replyKeyboard.mode === "show" ? screen.replyKeyboard.config.rows.flatMap((row) => row.buttons.flatMap((button) => button.action.type === "screen" && screenIds.has(button.action.screenId) ? [button.action.screenId] : [])) : [];
    adjacency.set(screen.id, [...inlineTargets, ...replyTargets]);
  }
  const reachable = new Set<string>();
  const queue = [...roots];
  while (queue.length) {
    const current = queue.shift();
    if (!current || reachable.has(current)) continue;
    reachable.add(current);
    for (const next of adjacency.get(current) ?? []) if (!reachable.has(next)) queue.push(next);
  }
  for (const screen of project.screens) {
    if (roots.length > 0 && !reachable.has(screen.id)) issues.push(issue("warning", "UNREACHABLE_SCREEN", { screen: screen.name || "Unnamed screen" }, screen.id));
    const hasIncoming = project.screens.some((candidate) => adjacency.get(candidate.id)?.includes(screen.id));
    if (!screen.trigger && !hasIncoming) issues.push(issue("warning", "NO_ENTRY", { screen: screen.name || "Unnamed screen" }, screen.id));
  }

  return issues;
}

export function hasBlockingErrors(issues: ValidationIssue[]): boolean {
  return issues.some((item) => item.severity === "error");
}
