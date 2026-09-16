import type { Project, Screen } from "../../domain/project/types";
import { routeForScreen } from "./callbacks";
import { pyString, safePythonIdentifier } from "./templates";

function screenFunctionName(screen: Screen): string {
  return `keyboard_${safePythonIdentifier(screen.name)}_${screen.id.replace(/-/g, "").slice(0, 6)}`;
}

export function keyboardFunctionName(screen: Screen): string {
  return screenFunctionName(screen);
}

export function generateKeyboards(project: Project, routes: Map<string, string>): string {
  const parts: string[] = [
    "from aiogram.types import InlineKeyboardButton, InlineKeyboardMarkup",
    "",
  ];

  for (const screen of project.screens) {
    const functionName = screenFunctionName(screen);
    parts.push(`def ${functionName}() -> InlineKeyboardMarkup | None:`);
    if (screen.keyboard.length === 0 || screen.keyboard.every((row) => row.buttons.length === 0)) {
      parts.push("    return None", "");
      continue;
    }

    parts.push("    return InlineKeyboardMarkup(", "        inline_keyboard=[");
    for (const row of screen.keyboard) {
      if (row.buttons.length === 0) continue;
      parts.push("            [");
      for (const button of row.buttons) {
        if (button.action.type === "screen") {
          const targetScreenId = button.action.screenId;
          const target = project.screens.find((candidate) => candidate.id === targetScreenId);
          if (!target) throw new Error(`Button ${button.id} points to missing screen ${targetScreenId}`);
          parts.push(
            "                InlineKeyboardButton(",
            `                    text=${pyString(button.text)},`,
            `                    callback_data=${pyString(routeForScreen(routes, target))},`,
            "                ),",
          );
        } else if (button.action.type === "url") {
          parts.push(
            "                InlineKeyboardButton(",
            `                    text=${pyString(button.text)},`,
            `                    url=${pyString(button.action.url)},`,
            "                ),",
          );
        } else {
          parts.push(
            "                InlineKeyboardButton(",
            `                    text=${pyString(button.text)},`,
            `                    callback_data=${pyString(button.action.callbackData)},`,
            "                ),",
          );
        }
      }
      parts.push("            ],");
    }
    parts.push("        ]", "    )", "");
  }

  return `${parts.join("\n").trimEnd()}\n`;
}
