import type { LogicNode, Project, Screen } from "../../domain/project/types";
import { GENERATED_CALLBACK_PREFIX } from "../../domain/telegram/limits";

function fnv1a(value: string): number {
  let hash = 0x811c9dc5;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash >>> 0;
}
function stableToken(value: string, salt = ""): string { return fnv1a(`${value}:${salt}`).toString(36); }
function buildRoutes<T extends { id: string }>(items: T[], prefix: string): Map<string, string> {
  const used = new Set<string>(); const routes = new Map<string, string>();
  for (const item of [...items].sort((a, b) => a.id.localeCompare(b.id))) {
    let attempt = 0; let route = `${GENERATED_CALLBACK_PREFIX}${prefix}:${stableToken(item.id)}`;
    while (used.has(route)) { attempt += 1; route = `${GENERATED_CALLBACK_PREFIX}${prefix}:${stableToken(item.id, String(attempt))}`; }
    used.add(route); routes.set(item.id, route);
  }
  return routes;
}
export function buildScreenRoutes(project: Project): Map<string, string> { return buildRoutes(project.screens, "s"); }
export function buildNodeRoutes(project: Project): Map<string, string> { return buildRoutes(project.logicNodes, "n"); }
export function routeForScreen(routes: Map<string, string>, screen: Screen): string {
  const route = routes.get(screen.id); if (!route) throw new Error(`Missing generated route for screen ${screen.id}`); return route;
}
export function routeForNode(routes: Map<string, string>, node: LogicNode): string {
  const route = routes.get(node.id); if (!route) throw new Error(`Missing generated route for node ${node.id}`); return route;
}
