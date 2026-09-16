import type { Project } from "./types";
import { utf8ByteLength } from "../telegram/utf8";
import {
  TELEGRAM_CALLBACK_DATA_MAX_BYTES,
  TELEGRAM_CALLBACK_DATA_MIN_BYTES,
  GENERATED_CALLBACK_PREFIX,
} from "../telegram/limits";

export type ValidationIssue = {
  id: string;
  severity: "error" | "warning";
  code: string;
  message: string;
  screenId?: string;
  buttonId?: string;
};

function issue(
  severity: ValidationIssue["severity"],
  code: string,
  message: string,
  screenId?: string,
  buttonId?: string,
): ValidationIssue {
  return { id: [severity, code, screenId, buttonId, message].filter(Boolean).join(":"), severity, code, message, screenId, buttonId };
}

export function normalizeCommand(value: string): string {
  return value.trim().replace(/^\/+/, "");
}

export function isValidCommand(value: string): boolean {
  const normalized = normalizeCommand(value);
  return /^[A-Za-z0-9_]{1,32}$/.test(normalized);
}

export function isValidHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export function validateProject(project: Project): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  if (project.screens.length === 0) {
    issues.push(issue("error", "NO_SCREENS", "Project must contain at least one screen."));
    return issues;
  }

  const screenIds = new Set(project.screens.map((screen) => screen.id));
  const commandOwners = new Map<string, string[]>();

  for (const screen of project.screens) {
    const name = screen.name.trim() || "Unnamed screen";

    if (screen.trigger) {
      const command = normalizeCommand(screen.trigger.command);
      if (!isValidCommand(command)) {
        issues.push(issue("error", "INVALID_COMMAND", `Screen “${name}” has an invalid command trigger.`, screen.id));
      } else {
        commandOwners.set(command, [...(commandOwners.get(command) ?? []), screen.id]);
      }
    }

    if (!screen.message.text.trim() && !screen.message.media) {
      issues.push(issue("warning", "EMPTY_CONTENT", `Screen “${name}” has no message text or media.`, screen.id));
    }

    if (screen.message.media && !isValidHttpUrl(screen.message.media.url)) {
      issues.push(issue("error", "INVALID_MEDIA_URL", `Screen “${name}” has an invalid photo URL.`, screen.id));
    }

    const buttonCount = screen.keyboard.reduce((sum, row) => sum + row.buttons.length, 0);
    if (buttonCount === 0) {
      issues.push(issue("warning", "NO_BUTTONS", `Screen “${name}” has no inline buttons.`, screen.id));
    }

    for (const row of screen.keyboard) {
      for (const button of row.buttons) {
        if (!button.text.trim()) {
          issues.push(issue("error", "EMPTY_BUTTON_TEXT", `A button on “${name}” has no text.`, screen.id, button.id));
        }

        if (button.action.type === "screen" && !screenIds.has(button.action.screenId)) {
          issues.push(issue("error", "MISSING_SCREEN_TARGET", `Button “${button.text || "Untitled"}” points to a missing screen.`, screen.id, button.id));
        }

        if (button.action.type === "callback") {
          const bytes = utf8ByteLength(button.action.callbackData);
          if (bytes < TELEGRAM_CALLBACK_DATA_MIN_BYTES || bytes > TELEGRAM_CALLBACK_DATA_MAX_BYTES) {
            issues.push(issue("error", "INVALID_CALLBACK_LENGTH", `Callback for “${button.text || "Untitled"}” must be 1–64 UTF-8 bytes; current value is ${bytes} bytes.`, screen.id, button.id));
          }
          if (button.action.callbackData.startsWith(GENERATED_CALLBACK_PREFIX)) {
            issues.push(issue("error", "RESERVED_CALLBACK_PREFIX", `Callback for “${button.text || "Untitled"}” uses the reserved ${GENERATED_CALLBACK_PREFIX} prefix.`, screen.id, button.id));
          }
        }

        if (button.action.type === "url" && !isValidHttpUrl(button.action.url)) {
          issues.push(issue("error", "INVALID_URL", `Button “${button.text || "Untitled"}” has an invalid HTTP/HTTPS URL.`, screen.id, button.id));
        }
      }
    }
  }

  for (const [command, owners] of commandOwners.entries()) {
    if (owners.length > 1) {
      for (const screenId of owners) {
        issues.push(issue("error", "DUPLICATE_COMMAND", `Command /${command} is assigned to multiple screens.`, screenId));
      }
    }
  }

  if (!commandOwners.has("start")) {
    issues.push(issue("warning", "NO_START", "No /start command trigger exists."));
  }

  const roots = project.screens.filter((screen) => screen.trigger && isValidCommand(screen.trigger.command)).map((screen) => screen.id);
  const adjacency = new Map<string, string[]>();
  for (const screen of project.screens) {
    adjacency.set(
      screen.id,
      screen.keyboard.flatMap((row) =>
        row.buttons.flatMap((button) => button.action.type === "screen" && screenIds.has(button.action.screenId) ? [button.action.screenId] : []),
      ),
    );
  }

  const reachable = new Set<string>();
  const queue = [...roots];
  while (queue.length > 0) {
    const current = queue.shift();
    if (!current || reachable.has(current)) continue;
    reachable.add(current);
    for (const next of adjacency.get(current) ?? []) {
      if (!reachable.has(next)) queue.push(next);
    }
  }

  for (const screen of project.screens) {
    if (roots.length > 0 && !reachable.has(screen.id)) {
      issues.push(issue("warning", "UNREACHABLE_SCREEN", `Screen “${screen.name || "Unnamed screen"}” cannot be reached from a command entry point.`, screen.id));
    }

    const hasIncoming = project.screens.some((candidate) =>
      candidate.keyboard.some((row) => row.buttons.some((button) => button.action.type === "screen" && button.action.screenId === screen.id)),
    );
    if (!screen.trigger && !hasIncoming) {
      issues.push(issue("warning", "NO_ENTRY", `Screen “${screen.name || "Unnamed screen"}” has no incoming transition and no command trigger.`, screen.id));
    }
  }

  return issues;
}

export function hasBlockingErrors(issues: ValidationIssue[]): boolean {
  return issues.some((item) => item.severity === "error");
}
