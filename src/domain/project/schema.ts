import { z } from "zod";

const flowPositionSchema = z.object({ x: z.number(), y: z.number() });
const editorSchema = z.object({ flowPosition: flowPositionSchema });
const flowTargetSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("screen"), screenId: z.string().uuid() }),
  z.object({ type: z.literal("node"), nodeId: z.string().uuid() }),
]);

const inlineActionV2Schema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("screen"), screenId: z.string().uuid() }),
  z.object({ type: z.literal("callback"), callbackData: z.string() }),
  z.object({ type: z.literal("url"), url: z.string() }),
]);

const inlineActionSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("screen"), screenId: z.string().uuid() }),
  z.object({ type: z.literal("node"), nodeId: z.string().uuid() }),
  z.object({ type: z.literal("callback"), callbackData: z.string() }),
  z.object({ type: z.literal("url"), url: z.string() }),
]);

const inlineButtonV2Schema = z.object({ id: z.string().uuid(), text: z.string(), action: inlineActionV2Schema });
const inlineButtonSchema = z.object({ id: z.string().uuid(), text: z.string(), action: inlineActionSchema });
const inlineRowV2Schema = z.object({ id: z.string().uuid(), buttons: z.array(inlineButtonV2Schema) });
const inlineRowSchema = z.object({ id: z.string().uuid(), buttons: z.array(inlineButtonSchema) });

const replyActionV2Schema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("screen"), screenId: z.string().uuid() }),
  z.object({ type: z.literal("text") }),
  z.object({ type: z.literal("requestContact") }),
  z.object({ type: z.literal("requestLocation") }),
  z.object({ type: z.literal("webApp"), url: z.string() }),
]);

const replyActionSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("screen"), screenId: z.string().uuid() }),
  z.object({ type: z.literal("node"), nodeId: z.string().uuid() }),
  z.object({ type: z.literal("text") }),
  z.object({ type: z.literal("requestContact") }),
  z.object({ type: z.literal("requestLocation") }),
  z.object({ type: z.literal("webApp"), url: z.string() }),
]);

const replyButtonV2Schema = z.object({ id: z.string().uuid(), text: z.string(), action: replyActionV2Schema });
const replyButtonSchema = z.object({ id: z.string().uuid(), text: z.string(), action: replyActionSchema });
const replyRowV2Schema = z.object({ id: z.string().uuid(), buttons: z.array(replyButtonV2Schema) });
const replyRowSchema = z.object({ id: z.string().uuid(), buttons: z.array(replyButtonSchema) });

const replyKeyboardV2Schema = z.discriminatedUnion("mode", [
  z.object({ mode: z.literal("inherit") }),
  z.object({ mode: z.literal("remove") }),
  z.object({
    mode: z.literal("show"),
    config: z.object({
      rows: z.array(replyRowV2Schema),
      resizeKeyboard: z.boolean(),
      oneTimeKeyboard: z.boolean(),
      isPersistent: z.boolean(),
      selective: z.boolean(),
      inputFieldPlaceholder: z.string().nullable(),
    }),
  }),
]);

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

const screenV2Schema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  trigger: triggerSchema,
  message: messageSchema,
  inlineKeyboard: z.array(inlineRowV2Schema),
  replyKeyboard: replyKeyboardV2Schema,
  editor: editorSchema,
});

const screenSchema = z.object({
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

const variableSchema = z.object({
  id: z.string().uuid(),
  key: z.string(),
  type: z.enum(["string", "number", "boolean"]),
  defaultValue: z.union([z.string(), z.number(), z.boolean(), z.null()]),
});
const envSchema = z.object({ id: z.string().uuid(), key: z.string() });

const conditionOperatorSchema = z.enum([
  "equals", "notEquals", "contains", "notContains", "greaterThan", "greaterThanOrEqual",
  "lessThan", "lessThanOrEqual", "exists", "notExists",
]);
const conditionRuleSchema = z.object({
  id: z.string().uuid(), left: z.string(), operator: conditionOperatorSchema, right: z.string(),
});
const kvSchema = z.object({ id: z.string().uuid(), key: z.string(), value: z.string() });

const inputNodeSchema = z.object({
  id: z.string().uuid(), type: z.literal("input"), name: z.string(), prompt: z.string(), variable: z.string(),
  inputType: z.enum(["text", "number", "email", "phone"]), required: z.boolean(),
  validation: z.object({ minLength: z.number().optional(), maxLength: z.number().optional(), min: z.number().optional(), max: z.number().optional(), pattern: z.string().optional() }),
  invalidMessage: z.string(), next: flowTargetSchema.nullable(), editor: editorSchema,
});
const conditionNodeSchema = z.object({
  id: z.string().uuid(), type: z.literal("condition"), name: z.string(), combinator: z.enum(["and", "or"]),
  rules: z.array(conditionRuleSchema), trueTarget: flowTargetSchema.nullable(), falseTarget: flowTargetSchema.nullable(), editor: editorSchema,
});
const setVariableNodeSchema = z.object({
  id: z.string().uuid(), type: z.literal("setVariable"), name: z.string(), variable: z.string(), value: z.string(), next: flowTargetSchema.nullable(), editor: editorSchema,
});
const httpBodySchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("none") }), z.object({ type: z.literal("json"), value: z.string() }), z.object({ type: z.literal("text"), value: z.string() }),
]);
const httpNodeSchema = z.object({
  id: z.string().uuid(), type: z.literal("http"), name: z.string(), method: z.enum(["GET", "POST", "PUT", "PATCH", "DELETE"]),
  url: z.string(), headers: z.array(kvSchema), query: z.array(kvSchema), body: httpBodySchema, resultKey: z.string(), timeoutMs: z.number(),
  mock: z.object({ enabled: z.boolean(), status: z.number(), body: z.string() }), successTarget: flowTargetSchema.nullable(), errorTarget: flowTargetSchema.nullable(), editor: editorSchema,
});
const sendMessageNodeSchema = z.object({
  id: z.string().uuid(), type: z.literal("sendMessage"), name: z.string(), text: z.string(), parseMode: z.enum(["none", "HTML", "MarkdownV2"]), next: flowTargetSchema.nullable(), editor: editorSchema,
});
const logicNodeSchema = z.discriminatedUnion("type", [inputNodeSchema, conditionNodeSchema, setVariableNodeSchema, httpNodeSchema, sendMessageNodeSchema]);

const projectSchemaBase = z.object({
  schemaVersion: z.literal(3), id: z.string().uuid(), name: z.string(), createdAt: z.string(), updatedAt: z.string(),
  botSettings: botSettingsSchema, screens: z.array(screenSchema), logicNodes: z.array(logicNodeSchema), variables: z.array(variableSchema), environmentVariables: z.array(envSchema),
});

function addUniqueIdChecks(value: z.infer<typeof projectSchemaBase>, ctx: z.RefinementCtx): void {
  const seen = new Set<string>();
  const register = (id: string, path: (string | number)[]) => {
    if (seen.has(id)) ctx.addIssue({ code: "custom", message: `Duplicate persistent id: ${id}`, path });
    seen.add(id);
  };
  register(value.id, ["id"]);
  value.botSettings.commands.forEach((item, i) => register(item.id, ["botSettings", "commands", i, "id"]));
  value.variables.forEach((item, i) => register(item.id, ["variables", i, "id"]));
  value.environmentVariables.forEach((item, i) => register(item.id, ["environmentVariables", i, "id"]));
  value.screens.forEach((screen, si) => {
    register(screen.id, ["screens", si, "id"]);
    screen.inlineKeyboard.forEach((row, ri) => {
      register(row.id, ["screens", si, "inlineKeyboard", ri, "id"]);
      row.buttons.forEach((button, bi) => register(button.id, ["screens", si, "inlineKeyboard", ri, "buttons", bi, "id"]));
    });
    if (screen.replyKeyboard.mode === "show") screen.replyKeyboard.config.rows.forEach((row, ri) => {
      register(row.id, ["screens", si, "replyKeyboard", "config", "rows", ri, "id"]);
      row.buttons.forEach((button, bi) => register(button.id, ["screens", si, "replyKeyboard", "config", "rows", ri, "buttons", bi, "id"]));
    });
  });
  value.logicNodes.forEach((node, ni) => {
    register(node.id, ["logicNodes", ni, "id"]);
    if (node.type === "condition") node.rules.forEach((rule, ri) => register(rule.id, ["logicNodes", ni, "rules", ri, "id"]));
    if (node.type === "http") {
      node.headers.forEach((item, i) => register(item.id, ["logicNodes", ni, "headers", i, "id"]));
      node.query.forEach((item, i) => register(item.id, ["logicNodes", ni, "query", i, "id"]));
    }
  });
}

export const projectSchema = projectSchemaBase.superRefine(addUniqueIdChecks);

export const projectV2Schema = z.object({
  schemaVersion: z.literal(2), id: z.string().uuid(), name: z.string(), createdAt: z.string(), updatedAt: z.string(),
  botSettings: botSettingsSchema, screens: z.array(screenV2Schema),
});

const screenV1Schema = z.object({
  id: z.string().uuid(), name: z.string(), trigger: triggerSchema, message: messageSchema, keyboard: z.array(inlineRowV2Schema), editor: editorSchema,
});
export const projectV1Schema = z.object({
  schemaVersion: z.literal(1), id: z.string().uuid(), name: z.string(), createdAt: z.string(), updatedAt: z.string(), screens: z.array(screenV1Schema),
});

export type ParsedProject = z.infer<typeof projectSchema>;
export type ParsedProjectV2 = z.infer<typeof projectV2Schema>;
export type ParsedProjectV1 = z.infer<typeof projectV1Schema>;
