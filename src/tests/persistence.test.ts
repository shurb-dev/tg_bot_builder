import { describe, expect, it } from "vitest";
import { createDemoProject } from "@/domain/project/defaults";
import { exportProjectJson, importProjectJson } from "@/export/json";
import { INVALID_PROJECT_BACKUP_KEY, loadLocalProject, PROJECT_STORAGE_KEY } from "@/persistence/local-project";

function memoryStorage(seed: Record<string, string> = {}) {
  const values = new Map(Object.entries(seed));
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => { values.set(key, value); },
    values,
  };
}

describe("project persistence v3", () => {
  it("round-trips schema v3 JSON without semantic loss", () => {
    const project = createDemoProject();
    project.variables.push({ id: crypto.randomUUID(), key: "score", type: "number", defaultValue: 7 });
    project.environmentVariables.push({ id: crypto.randomUUID(), key: "CRM_TOKEN" });
    expect(importProjectJson(exportProjectJson(project))).toEqual(project);
  });

  it("migrates schema v1 through v2 to v3", () => {
    const current = createDemoProject();
    const legacy = {
      schemaVersion: 1,
      id: current.id,
      name: current.name,
      createdAt: current.createdAt,
      updatedAt: current.updatedAt,
      screens: current.screens.map((screen) => ({
        id: screen.id,
        name: screen.name,
        trigger: screen.trigger,
        message: screen.message,
        keyboard: screen.inlineKeyboard,
        editor: screen.editor,
      })),
    };
    const migrated = importProjectJson(JSON.stringify(legacy));
    expect(migrated.schemaVersion).toBe(3);
    expect(migrated.screens[0].inlineKeyboard).toEqual(current.screens[0].inlineKeyboard);
    expect(migrated.screens.every((screen) => screen.replyKeyboard.mode === "inherit")).toBe(true);
    expect(migrated.botSettings.menuButton).toEqual({ type: "commands" });
    expect(migrated.logicNodes).toEqual([]);
    expect(migrated.variables).toEqual([]);
    expect(migrated.environmentVariables).toEqual([]);
  });

  it("migrates schema v2 projects to v3 without losing V1.1 fields", () => {
    const current = createDemoProject();
    const legacyV2 = {
      schemaVersion: 2,
      id: current.id,
      name: current.name,
      createdAt: current.createdAt,
      updatedAt: current.updatedAt,
      botSettings: current.botSettings,
      screens: current.screens,
    };
    const migrated = importProjectJson(JSON.stringify(legacyV2));
    expect(migrated.schemaVersion).toBe(3);
    expect(migrated.screens).toEqual(current.screens);
    expect(migrated.botSettings).toEqual(current.botSettings);
    expect(migrated.logicNodes).toEqual([]);
    expect(migrated.variables).toEqual([]);
    expect(migrated.environmentVariables).toEqual([]);
  });

  it("backs up corrupted localStorage", () => {
    const storage = memoryStorage({ [PROJECT_STORAGE_KEY]: "{bad json" });
    const result = loadLocalProject(storage);
    expect(result.status).toBe("invalid");
    expect(storage.values.get(INVALID_PROJECT_BACKUP_KEY)).toBe("{bad json");
  });
});
