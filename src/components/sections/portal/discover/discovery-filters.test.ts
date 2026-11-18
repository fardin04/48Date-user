import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { getDiscoverPage, getFiltersPage } from "@/stores/portal-store";

/** Phase 8 fixes on FILTERS (and the Discover decision failure), read from the source; the zoom and Back checks are in the QA report. */
const source = (path: string) => readFileSync(join(process.cwd(), "src/components", path), "utf8");
const filters = source("sections/portal/discover/filters-view.tsx");
const discover = source("sections/portal/discover/discover-view.tsx");

describe("FILTERS saving (rules 51, 54)", () => {
  it("Show matches and Reset filters replace FILTERS with DISCOVER, so Back from the deck doesn't reopen the form", () => {
    expect(filters).toContain('replaceRoute(router, hrefFor("DISCOVER"));');
    expect(filters).not.toContain("router.push(");
  });

  it("a failed save or reset shows the API's reason (or its own copy), keeps the values and frees the buttons", () => {
    expect(filters).toMatch(/catch \(error\) \{\s*setFailure\(failureReason\(error\) \?\? copy\.failed\);\s*setBusy\(false\);/);
    expect(filters).toContain('{failure && <StatusNote variant="alert" message={failure} />}');
    // Reset goes through the same guarded path (it used to stay "busy" forever on a refusal).
    expect(filters).toContain("if (!busy) void run(portalService.resetPreferences);");
    expect(getFiltersPage().failed).toBe("We couldn’t save your preferences. Check your connection and try again.");
  });

  it("a failed read of the saved preferences shows the error state with Retry instead of an empty form", () => {
    expect(filters).toContain("if (!saved && error) return <LoadFailed onRetry={() => void reload()} error={error} />;");
  });

  it("keeps Show matches and Reset filters pinned and side by side on short screens (rule 49)", () => {
    expect(filters).toContain('<ActionRow className={cn("flex-row", layout.stickyActions)}>');
  });
});

describe("Discover decisions", () => {
  it("a decision that fails without an API reason (offline) still says so; the card stays", () => {
    expect(discover).toContain("setFailure(failureReason(error) ?? copy.card.failed);");
    expect(getDiscoverPage().card.failed).toBe("That didn’t go through. Try again.");
  });
});
