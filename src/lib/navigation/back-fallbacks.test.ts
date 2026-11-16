import { describe, expect, it } from "vitest";
import { screens } from "@/lib/routes";
import {
  getAccountPage,
  getChatPage,
  getCompatPage,
  getDatePage,
  getDiscoverPage,
  getFiltersPage,
  getGamePage,
  getInboxPage,
  getMatchDetailPage,
  getMatchesPage,
  getMembershipPage,
  getPortalShell,
  getProfilePage,
  getStoriesPage,
} from "@/stores/portal-store";

/** Every `back` action reachable from the portal pages' copy, with its path for the failure message. */
function backActions(value: unknown, path: string, found: { path: string; action: Record<string, unknown> }[] = []) {
  if (Array.isArray(value)) value.forEach((item, i) => backActions(item, `${path}[${i}]`, found));
  else if (value && typeof value === "object") {
    for (const [key, child] of Object.entries(value)) {
      if (key === "back" && child && typeof child === "object" && "label" in child) found.push({ path: `${path}.${key}`, action: child as Record<string, unknown> });
      else backActions(child, `${path}.${key}`, found);
    }
  }
  return found;
}

const pages = {
  shell: getPortalShell(),
  discover: getDiscoverPage(),
  filters: getFiltersPage(),
  profile: getProfilePage(),
  compat: getCompatPage(),
  matches: getMatchesPage(),
  matchDetail: getMatchDetailPage(),
  inbox: getInboxPage(),
  chat: getChatPage(),
  date: getDatePage(),
  game: getGamePage(),
  stories: getStoriesPage(),
  account: getAccountPage(),
  membership: getMembershipPage(),
};

/** Date steps take their Back target from the member on screen (the conversation), set by the view. */
const TARGET_SET_BY_VIEW = new Set(["date.back"]);

describe("portal Back fallbacks (rule 52)", () => {
  const all = backActions(pages, "").map(({ path, action }) => ({ path: path.slice(1), action }));

  it("finds the portal Back actions", () => {
    expect(all.length).toBeGreaterThan(20);
  });

  it.each(all.map(({ path, action }) => [path, action] as const))("%s has a screen fallback for direct entry", (path, action) => {
    if (TARGET_SET_BY_VIEW.has(path)) return expect(action.to).toBeUndefined();
    const to = action.to as { screen?: string } | undefined;
    expect(to, `${path} needs a fallback "to"`).toBeDefined();
    expect(to && "screen" in to, `${path} must fall back to a screen, not a not-functional target`).toBe(true);
    expect(Object.keys(screens)).toContain(to?.screen);
  });
});
