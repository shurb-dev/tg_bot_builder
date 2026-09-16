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

describe("project persistence", () => {
  it("round-trips JSON without semantic loss", () => {
    const project = createDemoProject();
    expect(importProjectJson(exportProjectJson(project))).toEqual(project);
  });

  it("backs up corrupted localStorage", () => {
    const storage = memoryStorage({ [PROJECT_STORAGE_KEY]: "{bad json" });
    const result = loadLocalProject(storage);
    expect(result.status).toBe("invalid");
    expect(storage.values.get(INVALID_PROJECT_BACKUP_KEY)).toBe("{bad json");
  });
});
