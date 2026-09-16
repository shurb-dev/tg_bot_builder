import { describe, expect, it } from "vitest";
import { createDemoProject } from "@/domain/project/defaults";
import { exportProjectJson, importProjectJson } from "@/export/json";
import { INVALID_PROJECT_BACKUP_KEY, loadLocalProject, PROJECT_STORAGE_KEY } from "@/persistence/local-project";

function memoryStorage(seed: Record<string, string> = {}) {
  const values = new Map(Object.entries(seed));
  return { getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, value: string) => { values.set(key, value); }, values };
}

describe("project persistence v2", () => {
  it("round-trips schema v2 JSON without semantic loss", () => {
    const project = createDemoProject();
    expect(importProjectJson(exportProjectJson(project))).toEqual(project);
  });

  it("migrates schema v1 keyboard data to v2", () => {
    const current = createDemoProject();
    const legacy = {
      schemaVersion: 1,
      id: current.id,
      name: current.name,
      createdAt: current.createdAt,
      updatedAt: current.updatedAt,
      screens: current.screens.map(({ inlineKeyboard, replyKeyboard: _replyKeyboard, ...screen }) => ({ ...screen, keyboard: inlineKeyboard })),
    };
    const migrated = importProjectJson(JSON.stringify(legacy));
    expect(migrated.schemaVersion).toBe(2);
    expect(migrated.screens[0].inlineKeyboard).toEqual(current.screens[0].inlineKeyboard);
    expect(migrated.screens.every((screen) => screen.replyKeyboard.mode === "inherit")).toBe(true);
    expect(migrated.botSettings.menuButton).toEqual({ type: "commands" });
  });

  it("backs up corrupted localStorage", () => {
    const storage = memoryStorage({ [PROJECT_STORAGE_KEY]: "{bad json" });
    const result = loadLocalProject(storage);
    expect(result.status).toBe("invalid");
    expect(storage.values.get(INVALID_PROJECT_BACKUP_KEY)).toBe("{bad json");
  });
});
