import { z } from "zod";

const buttonActionSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("screen"), screenId: z.string().uuid() }),
  z.object({ type: z.literal("callback"), callbackData: z.string() }),
  z.object({ type: z.literal("url"), url: z.string() }),
]);

const buttonSchema = z.object({
  id: z.string().uuid(),
  text: z.string(),
  action: buttonActionSchema,
});

const rowSchema = z.object({
  id: z.string().uuid(),
  buttons: z.array(buttonSchema),
});

const screenSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  trigger: z
    .object({ type: z.literal("command"), command: z.string() })
    .nullable(),
  message: z.object({
    text: z.string(),
    parseMode: z.enum(["none", "HTML", "MarkdownV2"]),
    media: z
      .object({ type: z.literal("photo"), url: z.string() })
      .nullable(),
  }),
  keyboard: z.array(rowSchema),
  editor: z.object({
    flowPosition: z.object({ x: z.number(), y: z.number() }),
  }),
});

export const projectSchema = z.object({
  schemaVersion: z.literal(1),
  id: z.string().uuid(),
  name: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
  screens: z.array(screenSchema),
});

export type ParsedProject = z.infer<typeof projectSchema>;
