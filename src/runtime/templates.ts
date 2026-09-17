import type { RuntimeContext } from "./types";

const TEMPLATE = /\{\{\s*([a-zA-Z_][a-zA-Z0-9_.]*)\s*\}\}/g;

export function getPathValue(context: RuntimeContext, path: string): unknown {
  const [root, ...parts] = path.split(".");
  let value: unknown;
  if (root === "user") value = context.user;
  else if (root === "input") value = context.input;
  else if (root === "vars") value = context.vars;
  else if (root === "http") value = context.http;
  else if (root === "env") value = context.env;
  else return undefined;
  for (const part of parts) {
    if (!value || typeof value !== "object" || !(part in value)) return undefined;
    value = (value as Record<string, unknown>)[part];
  }
  return value;
}

export function resolveTemplate(template: string, context: RuntimeContext): string {
  return template.replace(TEMPLATE, (_match, path: string) => {
    const value = getPathValue(context, path);
    if (value === undefined || value === null) return "";
    if (typeof value === "string") return value;
    if (typeof value === "number" || typeof value === "boolean") return String(value);
    try { return JSON.stringify(value); } catch { return ""; }
  });
}

export function extractTemplatePaths(template: string): string[] {
  const paths: string[] = [];
  for (const match of template.matchAll(TEMPLATE)) paths.push(match[1]);
  return paths;
}

export function isKnownTemplatePath(path: string, variableKeys: Set<string>, envKeys: Set<string>): boolean | "dynamic" {
  if (["user.id", "user.first_name", "user.last_name", "user.username"].includes(path)) return true;
  if (path.startsWith("input.")) return true;
  if (path.startsWith("http.")) return "dynamic";
  if (path.startsWith("vars.")) return variableKeys.has(path.slice(5));
  if (path.startsWith("env.")) return envKeys.has(path.slice(4));
  return false;
}
