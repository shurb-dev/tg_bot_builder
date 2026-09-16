import { z } from "zod";

const inlineActionSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("screen"), screenId: z.string().uuid() }),
  z.object({ type: z.literal("callback"), callbackData: z.string() }),
  z.object({ type: z.literal("url"), url: z.string() }),
]);

const inlineButtonSchema = z.object({
  id: z.string().uuid(),
  text: z.string(),
  action: inlineActionSchema,
});

const inlineRowSchema = z.object({
  id: z.string().uuid(),
  buttons: z.array(inlineButtonSchema),
});

const replyActionSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("screen"), screenId: z.string().uuid() }),
  z.object({ type: z.literal("text") }),
  z.object({ type: z.literal("requestContact") }),
  z.object({ type: z.literal("requestLocation") }),
  z.object({ type: z.literal("webApp"), url: z.string() }),
]);

const replyButtonSchema = z.object({
  id: z.string().uuid(),
  text: z.string(),
  action: replyActionSchema,
});

const replyRowSchema = z.object({
  id: z.string().uuid(),
  buttons: z.array(replyButtonSchema),
});

const replyKeyboardSchema = z.discriminatedUnion("mode", [
  z.object({ mode: z.literal("inherit") }),
  z.object({ mode: z.literal("remove") }),
  z.object({
    mode: z.literal("show"),
    config: z.object({
      rows: z.array(replyRowSchema),
      resizeKeyboard: z.boolean(),
      oneTimeKeyboard: z.boolean(),
      isPersistent: z.boolean(),
      selective: z.boolean(),
      inputFieldPlaceholder: z.string().nullable(),
    }),
  }),
]);

const triggerSchema = z.object({ type: z.literal("command"), command: z.string() }).nullable();
const messageSchema = z.object({
  text: z.string(),
  parseMode: z.enum(["none", "HTML", "MarkdownV2"]),
  media: z.object({ type: z.literal("photo"), url: z.string() }).nullable(),
});
const editorSchema = z.object({ flowPosition: z.object({ x: z.number(), y: z.number() }) });

const screenV2Schema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  trigger: triggerSchema,
  message: messageSchema,
  inlineKeyboard: z.array(inlineRowSchema),
  replyKeyboard: replyKeyboardSchema,
  editor: editorSchema,
});

const menuButtonSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("commands") }),
  z.object({ type: z.literal("default") }),
  z.object({ type: z.literal("webApp"), text: z.string(), url: z.string() }),
]);

const botSettingsSchema = z.object({
  commands: z.array(z.object({ id: z.string().uuid(), command: z.string(), description: z.string() })),
  menuButton: menuButtonSchema,
});

function addUniqueIdChecks(value: z.infer<typeof projectSchemaBase>, ctx: z.RefinementCtx): void {
  const seen = new Set<string>();
  const register = (id: string, path: (string | number)[]) => {
    if (seen.has(id)) ctx.addIssue({ code: "custom", message: `Duplicate persistent id: ${id}`, path });
    seen.add(id);
  };
  register(value.id, ["id"]);
  value.botSettings.commands.forEach((command, index) => register(command.id, ["botSettings", "commands", index, "id"]));
  value.screens.forEach((screen, screenIndex) => {
    register(screen.id, ["screens", screenIndex, "id"]);
    screen.inlineKeyboard.forEach((row, rowIndex) => {
      register(row.id, ["screens", screenIndex, "inlineKeyboard", rowIndex, "id"]);
      row.buttons.forEach((button, buttonIndex) => register(button.id, ["screens", screenIndex, "inlineKeyboard", rowIndex, "buttons", buttonIndex, "id"]));
    });
    if (screen.replyKeyboard.mode === "show") {
      screen.replyKeyboard.config.rows.forEach((row, rowIndex) => {
        register(row.id, ["screens", screenIndex, "replyKeyboard", "config", "rows", rowIndex, "id"]);
        row.buttons.forEach((button, buttonIndex) => register(button.id, ["screens", screenIndex, "replyKeyboard", "config", "rows", rowIndex, "buttons", buttonIndex, "id"]));
      });
    }
  });
}

const projectSchemaBase = z.object({
  schemaVersion: z.literal(2),
  id: z.string().uuid(),
  name: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
  botSettings: botSettingsSchema,
  screens: z.array(screenV2Schema),
});

export const projectSchema = projectSchemaBase.superRefine(addUniqueIdChecks);

const screenV1Schema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  trigger: triggerSchema,
  message: messageSchema,
  keyboard: z.array(inlineRowSchema),
  editor: editorSchema,
});

export const projectV1Schema = z.object({
  schemaVersion: z.literal(1),
  id: z.string().uuid(),
  name: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
  screens: z.array(screenV1Schema),
});

export type ParsedProject = z.infer<typeof projectSchema>;
export type ParsedProjectV1 = z.infer<typeof projectV1Schema>;
