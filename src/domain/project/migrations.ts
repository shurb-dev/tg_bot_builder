import type { Project } from "./types";
import { projectSchema } from "./schema";

export function migrateProject(input: unknown): Project {
  if (!input || typeof input !== "object") {
    throw new Error("Project data must be an object.");
  }

  const version = (input as { schemaVersion?: unknown }).schemaVersion;
  if (version !== 1) {
    throw new Error(`Unsupported project schema version: ${String(version)}`);
  }

  return projectSchema.parse(input) as Project;
}
