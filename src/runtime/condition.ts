import type { ConditionNode, ConditionRule } from "@/domain/project/types";
import type { RuntimeContext } from "./types";
import { getPathValue, resolveTemplate } from "./templates";

function operand(raw: string, context: RuntimeContext): unknown {
  const trimmed = raw.trim();
  const exact = /^\{\{\s*([a-zA-Z_][a-zA-Z0-9_.]*)\s*\}\}$/.exec(trimmed);
  if (exact) return getPathValue(context, exact[1]);
  if (trimmed === "true") return true;
  if (trimmed === "false") return false;
  if (trimmed === "null") return null;
  if (trimmed !== "" && Number.isFinite(Number(trimmed))) return Number(trimmed);
  return resolveTemplate(raw, context);
}

export function evaluateConditionRule(rule: ConditionRule, context: RuntimeContext): boolean {
  const left = operand(rule.left, context);
  const right = operand(rule.right, context);
  switch (rule.operator) {
    case "exists": return left !== undefined && left !== null && left !== "";
    case "notExists": return left === undefined || left === null || left === "";
    case "equals": return left === right || String(left ?? "") === String(right ?? "");
    case "notEquals": return !(left === right || String(left ?? "") === String(right ?? ""));
    case "contains": return String(left ?? "").includes(String(right ?? ""));
    case "notContains": return !String(left ?? "").includes(String(right ?? ""));
    case "greaterThan": return Number(left) > Number(right);
    case "greaterThanOrEqual": return Number(left) >= Number(right);
    case "lessThan": return Number(left) < Number(right);
    case "lessThanOrEqual": return Number(left) <= Number(right);
  }
}

export function evaluateCondition(node: ConditionNode, context: RuntimeContext): boolean {
  if (node.rules.length === 0) return false;
  const values = node.rules.map((rule) => evaluateConditionRule(rule, context));
  return node.combinator === "and" ? values.every(Boolean) : values.some(Boolean);
}
