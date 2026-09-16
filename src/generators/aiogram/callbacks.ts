import type { Project, Screen } from "../../domain/project/types";
import { GENERATED_CALLBACK_PREFIX } from "../../domain/telegram/limits";

function fnv1a(value: string): number {
  let hash = 0x811c9dc5;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash >>> 0;
}

function stableToken(value: string, salt = ""): string {
  return fnv1a(`${value}:${salt}`).toString(36);
}

export function buildScreenRoutes(project: Project): Map<string, string> {
  const used = new Set<string>();
  const routes = new Map<string, string>();
  const screens = [...project.screens].sort((a, b) => a.id.localeCompare(b.id));

  for (const screen of screens) {
    let attempt = 0;
    let route = `${GENERATED_CALLBACK_PREFIX}${stableToken(screen.id)}`;
    while (used.has(route)) {
      attempt += 1;
      route = `${GENERATED_CALLBACK_PREFIX}${stableToken(screen.id, String(attempt))}`;
    }
    used.add(route);
    routes.set(screen.id, route);
  }

  return routes;
}

export function routeForScreen(routes: Map<string, string>, screen: Screen): string {
  const route = routes.get(screen.id);
  if (!route) throw new Error(`Missing generated route for screen ${screen.id}`);
  return route;
}
