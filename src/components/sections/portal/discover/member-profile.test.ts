import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/** Phase 9 fixes on DISCOVER-PROFILE, read from the source; zoom and Back are in the QA report. */
const source = (path: string) => readFileSync(join(process.cwd(), "src/components", path), "utf8");
const profile = source("sections/portal/discover/profile-view.tsx");
const decisions = source("sections/portal/discover/profile-decisions.tsx");

describe("photos keep faces in frame (rule 50)", () => {
  it("never crops a portrait from the bottom", () => {
    expect(profile).not.toContain("object-bottom");
  });

  it("the main photo keeps its 600:660 frame at every width, cover, centre-top", () => {
    expect(profile).toContain('"relative aspect-[600/660] w-full self-start overflow-hidden rounded-16"');
    expect(profile).not.toContain("lg:aspect-auto");
    expect(profile).toContain('sizes="(min-width: 1024px) 600px, 100vw" className="object-cover object-top"');
  });

  it("more photos sit in an auto-fill grid with a fixed frame ratio, cover, centre-top", () => {
    expect(profile).toContain("grid-cols-[repeat(auto-fill,minmax(min(100%,18rem),1fr))]");
    expect(profile).toContain('className="relative aspect-[600/320] overflow-hidden rounded-16"');
    expect(profile).not.toContain("h-80");
  });
});

describe("Back and decisions (rules 49, 51)", () => {
  it("Back is the shared history-first Back, so it returns to whichever page opened the profile", () => {
    expect(profile).toContain("<PortalBack action={getPortalShell().back} revealDelay={0} />");
  });

  it("a decision replaces the profile with DISCOVER (or LIKES when opened from there), so Back can't reopen it", () => {
    expect(decisions).toContain('replaceRoute(router, hrefFor(fromLikes ? "LIKES" : "DISCOVER"))');
    expect(decisions).not.toContain("router.push(");
  });

  it("Like / Pass are pinned above the tab bar on short screens", () => {
    expect(decisions).toContain('className={cn("flex w-full gap-3 sm:w-auto", layout.stickyActions)}');
  });
});
