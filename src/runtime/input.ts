import type { InputNode } from "@/domain/project/types";

export type InputValidationResult = { ok: true; value: unknown } | { ok: false; error: string };

export function validateInputValue(node: InputNode, raw: string): InputValidationResult {
  const value = raw.trim();
  if (node.required && !value) return { ok: false, error: node.invalidMessage };
  if (!value && !node.required) return { ok: true, value: "" };

  if (node.inputType === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return { ok: false, error: node.invalidMessage };
  if (node.inputType === "phone" && !/^\+?[0-9 ()-]{7,20}$/.test(value)) return { ok: false, error: node.invalidMessage };
  if (node.validation.minLength !== undefined && value.length < node.validation.minLength) return { ok: false, error: node.invalidMessage };
  if (node.validation.maxLength !== undefined && value.length > node.validation.maxLength) return { ok: false, error: node.invalidMessage };
  if (node.validation.pattern) {
    try {
      if (!new RegExp(node.validation.pattern).test(value)) return { ok: false, error: node.invalidMessage };
    } catch {
      return { ok: false, error: node.invalidMessage };
    }
  }

  if (node.inputType === "number") {
    const number = Number(value);
    if (!Number.isFinite(number)) return { ok: false, error: node.invalidMessage };
    if (node.validation.min !== undefined && number < node.validation.min) return { ok: false, error: node.invalidMessage };
    if (node.validation.max !== undefined && number > node.validation.max) return { ok: false, error: node.invalidMessage };
    return { ok: true, value: number };
  }
  return { ok: true, value };
}

export function inputVariableKey(variable: string): string {
  return variable.startsWith("input.") ? variable.slice(6) : variable;
}
