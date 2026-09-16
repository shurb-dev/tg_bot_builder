import type { Project } from "@/domain/project/types";
import { projectSchema } from "@/domain/project/schema";
import { parseProjectJson, serializeProject } from "@/persistence/local-project";

export function exportProjectJson(project: Project): string {
  projectSchema.parse(project);
  return serializeProject(project);
}

export function importProjectJson(raw: string): Project {
  return parseProjectJson(raw);
}

export function projectFilename(name: string): string {
  const slug = name.trim().toLowerCase().replace(/[^a-z0-9а-яё]+/gi, "-").replace(/^-+|-+$/g, "") || "telegram-bot";
  return `${slug}.tgbot.json`;
}
