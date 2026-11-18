import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { swipePhotoFrame } from "@/lib/control-sizes";
import { fill } from "@/lib/format";
import { getDiscoverPage } from "@/stores/portal-store";

/** Phase 7 fixes, read from the source (Vitest runs in node; the zoom and back checks are in the QA report). */
const source = (path: string) => readFileSync(join(process.cwd(), "src/components", path), "utf8");
const view = source("sections/portal/discover/discover-view.tsx");
const matchNew = source("sections/portal/discover/match-new-screen.tsx");
const card = source("pieces/cards/swipe-card.tsx");

describe("first screen (rule 60)", () => {
  it("caps the swipe photo by the viewport so the name and Pass / Like / Super Like fit at 1440×900", () => {
    expect(card).toContain('"relative aspect-[448/464] w-full select-none", swipePhotoFrame');
    // 464px as drawn at most; from 1024px the photo leaves 31rem (496px) for everything below it.
    expect(swipePhotoFrame).toBe("max-h-[min(29rem,max(10rem,calc(var(--svh)-21.5rem)))] lg:max-h-[min(29rem,max(14rem,calc(var(--svh)-31rem)))]");
  });

  it("crops the portrait centre-top so faces stay in a capped frame (rule 50)", () => {
    expect(card).toContain('className="pointer-events-none object-cover object-top"');
  });
});

describe("MATCH-NEW counts down to the server's deadline (rule 3)", () => {
  it("reads the match clock instead of the drawn 48:00:00", () => {
    expect(matchNew).toContain("const clock = useMatchClock(member);");
    expect(matchNew).toContain('timer={live ? fill(copy.timerLive, live) : copy.timer}');
    expect(view).toContain("<MatchNewScreen member={shownMatch} onKeepDiscovering={keepDiscovering} />");
    expect(view).not.toContain("copy.matchNew.timer");
  });

  it("formats the live timer and its spoken label", () => {
    const copy = getDiscoverPage().matchNew;
    expect(fill(copy.timerLive, { hours: "41", minutes: "07" })).toBe("41:07");
    expect(fill(copy.timerLiveLabel, { hours: "41", minutes: "07" })).toBe("41 hours 07 minutes left to agree on a date");
  });
});

describe("Back (rules 51–52)", () => {
  it("DISCOVER-EMPTY and FILTERS-EMPTY go back through the shared history-first Back, not router.back()", () => {
    expect(view).not.toContain("router.back()");
    expect(view).toContain("back={<PortalBack action={shell.back} />}");
  });

  it("MATCH-NEW Back keeps discovering", () => {
    expect(matchNew).toContain("back={<PortalBack action={getPortalShell().back} onClick={onKeepDiscovering} />}");
  });
});
