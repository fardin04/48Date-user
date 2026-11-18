import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { hrefFor } from "@/lib/routes";
import { resolvePortalView, portalViewParams } from "@/lib/portal/views";
import { getLikesPage } from "@/stores/portal-store";

/** Phase 10: the header heart, the /likes route and the profile decisions from LIKES. */
const source = (path: string) => readFileSync(join(process.cwd(), "src/components", path), "utf8");
const header = source("pieces/shells/header-menu.tsx");
const decisions = source("sections/portal/discover/profile-decisions.tsx");
const view = source("sections/portal/likes/likes-view.tsx");

describe("header heart", () => {
  it("targets LIKES with an accessible name", () => {
    const { heart } = getLikesPage();
    expect(heart).toMatchObject({ label: "Likes received", icon: "favourite", to: { screen: "LIKES" } });
    expect(hrefFor("LIKES")).toBe("/likes");
  });

  it("comes before the bell and the avatar", () => {
    const heart = header.indexOf("to={likes.to}");
    const bell = header.indexOf("to={shell.notifications.to}");
    const avatar = header.indexOf("to={shell.profile.to}");
    expect(heart).toBeGreaterThan(0);
    expect(heart).toBeLessThan(bell);
    expect(bell).toBeLessThan(avatar);
  });
});

describe("/likes route", () => {
  it("resolves and prerenders the one LIKES view", () => {
    expect(resolvePortalView("likes", undefined)).toEqual({ kind: "likes" });
    expect(resolvePortalView("likes", ["anything"])).toBeNull();
    expect(portalViewParams("likes")).toEqual([{ view: [] }]);
  });
});

describe("LIKES behaviour", () => {
  it("a profile opened from LIKES sends its decision back to LIKES (replace), not to the deck", () => {
    expect(decisions).toContain('const fromLikes = readTrail().at(-2) === hrefFor("LIKES");');
    expect(decisions).toContain('(fromLikes ? likesIntent : deckIntent).set({ member, decision });');
    expect(decisions).toContain('replaceRoute(router, hrefFor(fromLikes ? "LIKES" : "DISCOVER"));');
  });

  it("a like back shows MATCH-NEW with Keep browsing and marks it seen; a gone card is removed, a refusal keeps it", () => {
    expect(view).toContain("<MatchNewScreen member={matched} keepLabel={copy.keepBrowsing}");
    expect(view).toContain("if (matched) void portalService.markMatchSeen(matched);");
    expect(view).toContain("if (isGoneLike(error)) remove(member);");
    expect(view).toContain("setNotice(failureReason(error) ?? copy.failed);");
  });

  it("pages come from TanStack (no polling) and Show more appears only while there is more", () => {
    expect(view).toContain("getNextPageParam: nextLikesPage");
    expect(view).not.toContain("refetchInterval");
    expect(view).toContain("{query.hasNextPage && (");
  });
});
