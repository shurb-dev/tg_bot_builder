import type { Project } from "@/domain/project/types";
import { migrateProject } from "@/domain/project/migrations";

export const PROJECT_STORAGE_KEY = "telegram-bot-visual-builder:project:v1";
export const INVALID_PROJECT_BACKUP_KEY = "telegram-bot-visual-builder:project:invalid-backup";

export type ProjectLoadResult =
  | { status: "empty" }
  | { status: "ok"; project: Project }
  | { status: "invalid"; error: string; raw: string };

export function serializeProject(project: Project): string {
  return JSON.stringify(project, null, 2);
}

export function parseProjectJson(raw: string): Project {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error("The project file is not valid JSON.");
  }
  return migrateProject(parsed);
}

export function loadLocalProject(storage: Pick<Storage, "getItem" | "setItem">): ProjectLoadResult {
  const raw = storage.getItem(PROJECT_STORAGE_KEY);
  if (!raw) return { status: "empty" };

  try {
    return { status: "ok", project: parseProjectJson(raw) };
  } catch (error) {
    storage.setItem(INVALID_PROJECT_BACKUP_KEY, raw);
    return {
      status: "invalid",
      error: error instanceof Error ? error.message : "Stored project is invalid.",
      raw,
    };
  }
}

export function saveLocalProject(storage: Pick<Storage, "setItem">, project: Project): void {
  storage.setItem(PROJECT_STORAGE_KEY, serializeProject(project));
}
