import type { Project } from "./types";
import { projectSchema, projectV1Schema, projectV2Schema } from "./schema";

function migrateV2(input: unknown): Project {
  const legacy = projectV2Schema.parse(input);
  return projectSchema.parse({
    ...legacy,
    schemaVersion: 3,
    logicNodes: [],
    variables: [],
    environmentVariables: [],
  }) as Project;
}

export function migrateProject(input: unknown): Project {
  if (!input || typeof input !== "object") throw new Error("Project data must be an object.");
  const version = (input as { schemaVersion?: unknown }).schemaVersion;
  if (version === 3) return projectSchema.parse(input) as Project;
  if (version === 2) return migrateV2(input);
  if (version === 1) {
    const legacy = projectV1Schema.parse(input);
    const v2 = {
      schemaVersion: 2 as const,
      id: legacy.id,
      name: legacy.name,
      createdAt: legacy.createdAt,
      updatedAt: legacy.updatedAt,
      botSettings: { commands: [], menuButton: { type: "commands" as const } },
      screens: legacy.screens.map((screen) => ({
        id: screen.id,
        name: screen.name,
        trigger: screen.trigger,
        message: screen.message,
        inlineKeyboard: screen.keyboard,
        replyKeyboard: { mode: "inherit" as const },
        editor: screen.editor,
      })),
    };
    return migrateV2(v2);
  }
  throw new Error(`Unsupported project schema version: ${String(version)}`);
}
