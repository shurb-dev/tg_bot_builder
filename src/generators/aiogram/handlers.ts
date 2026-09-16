import type { Project, Screen } from "../../domain/project/types";
import { normalizeCommand } from "../../domain/project/validation";
import { inlineKeyboardFunctionName, replyKeyboardFunctionName } from "./keyboards";
import { routeForScreen } from "./callbacks";
import { pyString, safePythonIdentifier } from "./templates";

function senderName(screen: Screen): string {
  return `send_${safePythonIdentifier(screen.name)}_${screen.id.replace(/-/g, "").slice(0, 6)}`;
}

function parseModeArgument(screen: Screen): string {
  return screen.message.parseMode === "none" ? "None" : pyString(screen.message.parseMode);
}

function replyMarkup(screen: Screen): string {
  if (screen.replyKeyboard.mode === "show") return `${replyKeyboardFunctionName(screen)}()`;
  if (screen.replyKeyboard.mode === "remove") return "ReplyKeyboardRemove()";
  return `${inlineKeyboardFunctionName(screen)}()`;
}

function renderSender(screen: Screen): string[] {
  const lines = [`async def ${senderName(screen)}(message: Message) -> None:`];
  const text = pyString(screen.message.text);
  const parseMode = parseModeArgument(screen);
  const markup = replyMarkup(screen);
  if (screen.message.media?.type === "photo") {
    lines.push("    await message.answer_photo(", `        photo=${pyString(screen.message.media.url)},`, `        caption=${text},`, `        parse_mode=${parseMode},`, `        reply_markup=${markup},`, "    )");
  } else {
    lines.push("    await message.answer(", `        text=${text},`, `        parse_mode=${parseMode},`, `        reply_markup=${markup},`, "    )");
  }
  return lines;
}

export function generateHandlers(project: Project, routes: Map<string, string>): string {
  const inlineImports = project.screens.map(inlineKeyboardFunctionName).join(",\n    ");
  const replyScreens = project.screens.filter((screen) => screen.replyKeyboard.mode === "show");
  const replyImports = replyScreens.map(replyKeyboardFunctionName).join(",\n    ");
  const lines: string[] = [
    "from aiogram import F, Router",
    "from aiogram.filters import Command",
    "from aiogram.types import CallbackQuery, Message, ReplyKeyboardRemove",
    "",
    "from keyboards.inline import (",
    `    ${inlineImports}`,
    ")",
  ];
  if (replyImports) lines.push("from keyboards.reply import (", `    ${replyImports}`, ")");
  lines.push("", "router = Router()", "");

  for (const screen of project.screens) lines.push(...renderSender(screen), "");

  for (const screen of project.screens) {
    if (!screen.trigger) continue;
    const command = normalizeCommand(screen.trigger.command);
    lines.push(`@router.message(Command(${pyString(command)}))`, `async def command_${safePythonIdentifier(command)}_${screen.id.replace(/-/g, "").slice(0, 6)}(message: Message) -> None:`, `    await ${senderName(screen)}(message)`, "");
  }

  for (const screen of project.screens) {
    const route = routeForScreen(routes, screen);
    lines.push(
      `@router.callback_query(F.data == ${pyString(route)})`,
      `async def screen_${safePythonIdentifier(screen.name)}_${screen.id.replace(/-/g, "").slice(0, 6)}(callback: CallbackQuery) -> None:`,
      "    await callback.answer()",
      "    if not isinstance(callback.message, Message):",
      "        return",
      `    await ${senderName(screen)}(callback.message)`,
      "",
    );
  }

  for (const screen of project.screens) {
    if (screen.replyKeyboard.mode !== "show") continue;
    for (const row of screen.replyKeyboard.config.rows) {
      for (const button of row.buttons) {
        if (button.action.type !== "screen") continue;
        const target = project.screens.find((candidate) => candidate.id === button.action.screenId);
        if (!target) throw new Error(`Reply button ${button.id} points to missing screen ${button.action.screenId}`);
        lines.push(`@router.message(F.text == ${pyString(button.text)})`, `async def reply_nav_${button.id.replace(/-/g, "").slice(0, 10)}(message: Message) -> None:`, `    await ${senderName(target)}(message)`, "");
      }
    }
  }

  const textActions = [...new Set(project.screens.flatMap((screen) => screen.replyKeyboard.mode === "show" ? screen.replyKeyboard.config.rows.flatMap((row) => row.buttons.flatMap((button) => button.action.type === "text" ? [button.text] : [])) : []))].sort();
  textActions.forEach((text, index) => lines.push(`@router.message(F.text == ${pyString(text)})`, `async def reply_text_${index + 1}(message: Message) -> None:`, "    # TODO: Replace this stub with application-specific logic.", "    await message.answer(\"Action received\")", ""));

  const hasContact = project.screens.some((screen) => screen.replyKeyboard.mode === "show" && screen.replyKeyboard.config.rows.some((row) => row.buttons.some((button) => button.action.type === "requestContact")));
  if (hasContact) lines.push("@router.message(F.contact)", "async def received_contact(message: Message) -> None:", "    # TODO: Handle the shared contact.", "    await message.answer(\"Contact received\")", "");
  const hasLocation = project.screens.some((screen) => screen.replyKeyboard.mode === "show" && screen.replyKeyboard.config.rows.some((row) => row.buttons.some((button) => button.action.type === "requestLocation")));
  if (hasLocation) lines.push("@router.message(F.location)", "async def received_location(message: Message) -> None:", "    # TODO: Handle the shared location.", "    await message.answer(\"Location received\")", "");
  const hasWebApp = project.screens.some((screen) => screen.replyKeyboard.mode === "show" && screen.replyKeyboard.config.rows.some((row) => row.buttons.some((button) => button.action.type === "webApp")));
  if (hasWebApp) lines.push("@router.message(F.web_app_data)", "async def received_web_app_data(message: Message) -> None:", "    # TODO: Handle data sent back by the Web App.", "    await message.answer(\"Web App data received\")", "");

  const customCallbacks = [...new Set(project.screens.flatMap((screen) => screen.inlineKeyboard.flatMap((row) => row.buttons.flatMap((button) => button.action.type === "callback" ? [button.action.callbackData] : []))))].sort();
  customCallbacks.forEach((callbackData, index) => lines.push(`@router.callback_query(F.data == ${pyString(callbackData)})`, `async def custom_callback_${index + 1}(callback: CallbackQuery) -> None:`, "    # TODO: Replace this stub with your application-specific business logic.", "    await callback.answer(\"Action received\")", ""));

  return `${lines.join("\n").trimEnd()}\n`;
}
