import { describe, expect, it } from "vitest";
import { en, formatTemplate, getTranslations, ru } from "@/i18n/translations";
import { translateValidationIssue } from "@/i18n/validation-messages";

describe("application i18n", () => {
  it("ships complete English and Russian dictionaries", () => {
    expect(Object.keys(en)).toEqual(Object.keys(ru));
    expect(getTranslations("ru").nav.design).toBe("Дизайн");
    expect(getTranslations("en").nav.design).toBe("Design");
  });

  it("formats translation parameters", () => {
    expect(formatTemplate("{count} errors", { count: 3 })).toBe("3 errors");
  });

  it("localizes validation issues without translating project data", () => {
    const issue = { id: "1", severity: "error" as const, code: "DUPLICATE_REPLY_NAV_TEXT", params: { text: "Каталог" } };
    expect(translateValidationIssue(issue, "ru")).toContain("Каталог");
    expect(translateValidationIssue(issue, "en")).toContain("Каталог");
  });
});
