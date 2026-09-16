import type { Project, Screen } from "../../domain/project/types";
import { normalizeCommand } from "../../domain/project/validation";
import { keyboardFunctionName } from "./keyboards";
import { routeForScreen } from "./callbacks";
import { pyString, safePythonIdentifier } from "./templates";

function senderName(screen: Screen): string {
  return `send_${safePythonIdentifier(screen.name)}_${screen.id.replace(/-/g, "").slice(0, 6)}`;
}

function parseModeArgument(screen: Screen): string {
  return screen.message.parseMode === "none" ? "None" : pyString(screen.message.parseMode);
}

function renderSender(screen: Screen): string[] {
  const name = senderName(screen);
  const keyboard = keyboardFunctionName(screen);
  const parseMode = parseModeArgument(screen);
  const text = pyString(screen.message.text);

  const lines = [`async def ${name}(message: Message) -> None:`];
  if (screen.message.media?.type === "photo") {
    lines.push(
      "    await message.answer_photo(",
      `        photo=${pyString(screen.message.media.url)},`,
      `        caption=${text},`,
      `        parse_mode=${parseMode},`,
      `        reply_markup=${keyboard}(),`,
      "    )",
    );
  } else {
    lines.push(
      "    await message.answer(",
      `        text=${text},`,
      `        parse_mode=${parseMode},`,
      `        reply_markup=${keyboard}(),`,
      "    )",
    );
  }
  return lines;
}

export function generateHandlers(project: Project, routes: Map<string, string>): string {
  const keyboardImports = project.screens.map(keyboardFunctionName).join(",\n    ");
  const lines: string[] = [
    "from aiogram import F, Router",
    "from aiogram.filters import Command",
    "from aiogram.types import CallbackQuery, Message",
    "",
    "from keyboards.screens import (",
    `    ${keyboardImports}`,
    ")",
    "",
    "router = Router()",
    "",
  ];

  for (const screen of project.screens) {
    lines.push(...renderSender(screen), "");
  }

  for (const screen of project.screens) {
    if (!screen.trigger) continue;
    const command = normalizeCommand(screen.trigger.command);
    const handlerName = `command_${safePythonIdentifier(command)}_${screen.id.replace(/-/g, "").slice(0, 6)}`;
    lines.push(
      `@router.message(Command(${pyString(command)}))`,
      `async def ${handlerName}(message: Message) -> None:`,
      `    await ${senderName(screen)}(message)`,
      "",
    );
  }

  for (const screen of project.screens) {
    const route = routeForScreen(routes, screen);
    const handlerName = `screen_${safePythonIdentifier(screen.name)}_${screen.id.replace(/-/g, "").slice(0, 6)}`;
    lines.push(
      `@router.callback_query(F.data == ${pyString(route)})`,
      `async def ${handlerName}(callback: CallbackQuery) -> None:`,
      "    await callback.answer()",
      "    if not isinstance(callback.message, Message):",
      "        return",
      `    await ${senderName(screen)}(callback.message)`,
      "",
    );
  }

  const customCallbacks = [...new Set(project.screens.flatMap((screen) => screen.keyboard.flatMap((row) => row.buttons.flatMap((button) => button.action.type === "callback" ? [button.action.callbackData] : []))))].sort();
  for (const [index, callbackData] of customCallbacks.entries()) {
    lines.push(
      `@router.callback_query(F.data == ${pyString(callbackData)})`,
      `async def custom_callback_${index + 1}(callback: CallbackQuery) -> None:`,
      "    # TODO: Replace this stub with your application-specific business logic.",
      "    await callback.answer(\"Action received\")",
      "",
    );
  }

  return `${lines.join("\n").trimEnd()}\n`;
}
