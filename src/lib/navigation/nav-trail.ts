import { onCacheClear } from "@/lib/api/cache";

/**
 * The in-app pages this tab has visited, newest last (rules 51–53). `NavigationTracker` records
 * every path change; history-aware Back reads the previous entry. Kept in sessionStorage so a
 * refresh keeps it and a new tab starts empty; sign-out clears every `48date.*` key.
 */
export const TRAIL_KEY = "48date.nav.trail";
export const TRAIL_CAP = 50;

/** Pages Back must never return to: the sign-in / sign-up steps and the guided setup. */
const NOT_BACK_TARGETS = ["/signin", "/signup", "/onboarding"];

/** The next trail after visiting `path`: a browser Back pops, a replace swaps the last entry. */
export function nextTrail(trail: readonly string[], path: string, replace = false): string[] {
  const last = trail.at(-1);
  if (last === path) return [...trail];
  if (replace && trail.length > 0) return [...trail.slice(0, -1), path];
  if (trail.at(-2) === path) return trail.slice(0, -1);
  return [...trail, path].slice(-TRAIL_CAP);
}

/** Where Back goes: the previous page of this trail when there is a usable one, else the fallback. */
export function resolveBack(trail: readonly string[], current: string, fallbackHref: string) {
  const previous = trail.at(-1) === current ? trail.at(-2) : undefined;
  const usable = previous !== undefined && previous !== current && !NOT_BACK_TARGETS.some((prefix) => previous.startsWith(prefix));
  return usable ? ({ kind: "history", href: previous } as const) : ({ kind: "push", href: fallbackHref } as const);
}

/** Validated read: anything that isn't a list of in-app paths is dropped. */
export function parseTrail(raw: string | null): string[] {
  if (!raw) return [];
  try {
    const value: unknown = JSON.parse(raw);
    if (!Array.isArray(value)) return [];
    return value.filter((entry): entry is string => typeof entry === "string" && entry.startsWith("/")).slice(-TRAIL_CAP);
  } catch {
    return [];
  }
}

function storage(): Storage | null {
  try {
    return typeof sessionStorage === "undefined" ? null : sessionStorage;
  } catch {
    return null;
  }
}

export function readTrail(): string[] {
  return parseTrail(storage()?.getItem(TRAIL_KEY) ?? null);
}

let replaceNext = false;

/** Records a visit; called on every path change. */
export function record(path: string) {
  const next = nextTrail(readTrail(), path, replaceNext);
  replaceNext = false;
  try {
    storage()?.setItem(TRAIL_KEY, JSON.stringify(next));
  } catch {
    // Storage full or blocked: Back falls back to the data target.
  }
}

/** The next recorded visit replaces the current entry (used by `replaceRoute`). */
export function markReplace() {
  replaceNext = true;
}

export function clear() {
  replaceNext = false;
  storage()?.removeItem(TRAIL_KEY);
}

// A rejected session clears the cache without the sign-out key sweep; drop the trail with it.
onCacheClear(clear);
