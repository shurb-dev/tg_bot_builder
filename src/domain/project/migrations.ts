import type { Project } from "./types";
import { projectSchema, projectV1Schema } from "./schema";

export function migrateProject(input: unknown): Project {
  if (!input || typeof input !== "object") {
    throw new Error("Project data must be an object.");
  }

  const version = (input as { schemaVersion?: unknown }).schemaVersion;
  if (version === 2) return projectSchema.parse(input) as Project;

  if (version === 1) {
    const legacy = projectV1Schema.parse(input);
    const migrated: Project = {
      schemaVersion: 2,
      id: legacy.id,
      name: legacy.name,
      createdAt: legacy.createdAt,
      updatedAt: legacy.updatedAt,
      botSettings: { commands: [], menuButton: { type: "commands" } },
      screens: legacy.screens.map((screen) => ({
        id: screen.id,
        name: screen.name,
        trigger: screen.trigger,
        message: screen.message,
        inlineKeyboard: screen.keyboard,
        replyKeyboard: { mode: "inherit" },
        editor: screen.editor,
      })),
    };
    return projectSchema.parse(migrated) as Project;
  }

  throw new Error(`Unsupported project schema version: ${String(version)}`);
}
