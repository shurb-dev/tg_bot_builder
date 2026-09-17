import { describe, expect, it } from "vitest";
import { getV12Translations } from "@/i18n/v12-translations";
import { en, formatTemplate, getTranslations, ru } from "@/i18n/translations";
import { translateValidationIssue, validationMessages } from "@/i18n/validation-messages";

const V12_VALIDATION_CODES = [
  "MISSING_NODE_TARGET",
  "UNKNOWN_TEMPLATE_PATH",
  "INVALID_VARIABLE_KEY",
  "VARIABLE_TYPE_MISMATCH",
  "DUPLICATE_VARIABLE_KEY",
  "INVALID_ENV_KEY",
  "DUPLICATE_ENV_KEY",
  "EMPTY_NODE_NAME",
  "EMPTY_INPUT_PROMPT",
  "INVALID_INPUT_VARIABLE",
  "INVALID_INPUT_BOUNDS",
  "INVALID_INPUT_PATTERN",
  "MISSING_NEXT_TARGET",
  "EMPTY_CONDITION",
  "EMPTY_CONDITION_OPERAND",
  "MISSING_TRUE_TARGET",
  "MISSING_FALSE_TARGET",
  "UNKNOWN_SET_VARIABLE",
  "INVALID_HTTP_URL",
  "INVALID_HTTP_RESULT_KEY",
  "INVALID_HTTP_TIMEOUT",
  "INVALID_HTTP_JSON",
  "INVALID_HTTP_MOCK_STATUS",
  "MISSING_SUCCESS_TARGET",
  "MISSING_ERROR_TARGET",
  "EMPTY_SEND_MESSAGE",
  "MISSING_FLOW_TARGET",
  "DUPLICATE_HTTP_RESULT_KEY",
] as const;

describe("application i18n", () => {
  it("ships complete English and Russian base dictionaries", () => {
    expect(Object.keys(en)).toEqual(Object.keys(ru));
    expect(getTranslations("ru").nav.design).toBe("Дизайн");
    expect(getTranslations("en").nav.design).toBe("Design");
  });

  it("ships complete English and Russian V1.2 dictionaries", () => {
    const english = getV12Translations("en");
    const russian = getV12Translations("ru");
    expect(Object.keys(english)).toEqual(Object.keys(russian));
    for (const key of Object.keys(english) as Array<keyof typeof english>) {
      expect(english[key].trim(), `Missing EN V1.2 translation for ${key}`).not.toBe("");
      expect(russian[key].trim(), `Missing RU V1.2 translation for ${key}`).not.toBe("");
    }
    expect(english.test).toBe("Test");
    expect(russian.test).toBe("Тест");
    expect(english.simulator).toBe("Test simulator");
    expect(russian.simulator).toBe("Тестовый симулятор");
  });

  it("keeps validation dictionaries in parity and localizes every V1.2 validation code", () => {
    expect(Object.keys(validationMessages.en).sort()).toEqual(Object.keys(validationMessages.ru).sort());
    for (const code of V12_VALIDATION_CODES) {
      expect(validationMessages.en[code], `Missing EN validation message for ${code}`).toBeTruthy();
      expect(validationMessages.ru[code], `Missing RU validation message for ${code}`).toBeTruthy();
      const issue = { id: code, severity: "error" as const, code, params: { node: "Node", key: "KEY", path: "vars.x", owner: "Owner", button: "Button" } };
      expect(translateValidationIssue(issue, "en")).not.toBe(code);
      expect(translateValidationIssue(issue, "ru")).not.toBe(code);
    }
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
