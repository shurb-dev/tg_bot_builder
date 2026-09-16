import type { Project, Screen } from "../../domain/project/types";
import { routeForScreen } from "./callbacks";
import { pyString, safePythonIdentifier } from "./templates";

function suffix(screen: Screen): string {
  return `${safePythonIdentifier(screen.name)}_${screen.id.replace(/-/g, "").slice(0, 6)}`;
}

export function inlineKeyboardFunctionName(screen: Screen): string {
  return `inline_keyboard_${suffix(screen)}`;
}

export function replyKeyboardFunctionName(screen: Screen): string {
  return `reply_keyboard_${suffix(screen)}`;
}

export const keyboardFunctionName = inlineKeyboardFunctionName;

export function generateInlineKeyboards(project: Project, routes: Map<string, string>): string {
  const parts: string[] = ["from aiogram.types import InlineKeyboardButton, InlineKeyboardMarkup", ""];

  for (const screen of project.screens) {
    const functionName = inlineKeyboardFunctionName(screen);
    parts.push(`def ${functionName}() -> InlineKeyboardMarkup | None:`);
    if (screen.inlineKeyboard.length === 0 || screen.inlineKeyboard.every((row) => row.buttons.length === 0)) {
      parts.push("    return None", "");
      continue;
    }

    parts.push("    return InlineKeyboardMarkup(", "        inline_keyboard=[");
    for (const row of screen.inlineKeyboard) {
      if (!row.buttons.length) continue;
      parts.push("            [");
      for (const button of row.buttons) {
        const action = button.action;
        if (action.type === "screen") {
          const targetScreenId = action.screenId;
          const target = project.screens.find((candidate) => candidate.id === targetScreenId);
          if (!target) throw new Error(`Button ${button.id} points to missing screen ${targetScreenId}`);
          parts.push(
            "                InlineKeyboardButton(",
            `                    text=${pyString(button.text)},`,
            `                    callback_data=${pyString(routeForScreen(routes, target))},`,
            "                ),",
          );
        } else if (action.type === "url") {
          parts.push(
            "                InlineKeyboardButton(",
            `                    text=${pyString(button.text)},`,
            `                    url=${pyString(action.url)},`,
            "                ),",
          );
        } else {
          parts.push(
            "                InlineKeyboardButton(",
            `                    text=${pyString(button.text)},`,
            `                    callback_data=${pyString(action.callbackData)},`,
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

function pyBool(value: boolean): string {
  return value ? "True" : "False";
}

export function generateReplyKeyboards(project: Project): string {
  const parts: string[] = ["from aiogram.types import KeyboardButton, ReplyKeyboardMarkup, WebAppInfo", ""];
  for (const screen of project.screens) {
    if (screen.replyKeyboard.mode !== "show") continue;
    const functionName = replyKeyboardFunctionName(screen);
    const config = screen.replyKeyboard.config;
    parts.push(`def ${functionName}() -> ReplyKeyboardMarkup:`);
    parts.push("    return ReplyKeyboardMarkup(", "        keyboard=[");
    for (const row of config.rows) {
      if (!row.buttons.length) continue;
      parts.push("            [");
      for (const button of row.buttons) {
        const action = button.action;
        if (action.type === "requestContact") {
          parts.push(`                KeyboardButton(text=${pyString(button.text)}, request_contact=True),`);
        } else if (action.type === "requestLocation") {
          parts.push(`                KeyboardButton(text=${pyString(button.text)}, request_location=True),`);
        } else if (action.type === "webApp") {
          parts.push(`                KeyboardButton(text=${pyString(button.text)}, web_app=WebAppInfo(url=${pyString(action.url)})),`);
        } else {
          parts.push(`                KeyboardButton(text=${pyString(button.text)}),`);
        }
      }
      parts.push("            ],");
    }
    parts.push(
      "        ],",
      `        resize_keyboard=${pyBool(config.resizeKeyboard)},`,
      `        one_time_keyboard=${pyBool(config.oneTimeKeyboard)},`,
      `        is_persistent=${pyBool(config.isPersistent)},`,
      `        selective=${pyBool(config.selective)},`,
      `        input_field_placeholder=${config.inputFieldPlaceholder ? pyString(config.inputFieldPlaceholder) : "None"},`,
      "    )",
      "",
    );
  }
  return `${parts.join("\n").trimEnd()}\n`;
}

export const generateKeyboards = generateInlineKeyboards;
