import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { selfieFrameHeight } from "@/lib/control-sizes";
import { interestChoices } from "@/lib/onboarding/options";
import { getChoiceSteps } from "@/stores/onboarding-store";

/** Phase 6 fixes, read from the source (Vitest runs in node; the camera and zoom checks are in the QA report). */
const source = (path: string) => readFileSync(join(process.cwd(), "src/components", path), "utf8");
const photos = source("sections/onboarding/photos-step.tsx");
const verify = source("sections/onboarding/verify-step.tsx");
const ready = source("sections/onboarding/ready-step.tsx");
const tile = source("pieces/media/photo-tile.tsx");
const selfie = source("pieces/media/selfie-frame.tsx");

describe("camera release (rule 36)", () => {
  it.each([
    ["PHOTOS", photos],
    ["VERIFY", verify],
  ])("%s releases a camera granted after the member left, and never reopens it", (_name, code) => {
    // Each request is numbered; leaving bumps the number, so a late grant is stopped at once.
    expect(code).toMatch(/const request = \+\+cameraRequest\.current;/);
    expect(code).toMatch(/if \(request !== cameraRequest\.current\) \{\s*\/\/[^\n]*\n\s*media\.getTracks\(\)\.forEach\(\(track\) => track\.stop\(\)\);\s*return;/);
    // stopCamera and the unmount cleanup both invalidate a pending request.
    expect(code).toMatch(/const stopCamera = \(\) => \{\s*cameraRequest\.current \+= 1;/);
    expect(code).toMatch(/(?:return \(\) => \{|\(\) => \(\) => \{)[\s\S]*?cameraRequest\.current \+= 1;\s*stream\.current\?\.getTracks\(\)\.forEach\(\(track\) => track\.stop\(\)\);/);
  });
});

describe("photos keep the ratio of their purpose (rule 50)", () => {
  it("PHOTO-PREVIEW shows the whole photo at its own ratio (MediaFrame, contained)", () => {
    expect(photos).toMatch(/<MediaFrame src=\{pending\.url\}[^>]*maxHeight="preview"/);
    expect(photos).not.toMatch(/<PhotoTile src=\{pending\.url\}/);
  });

  it("profile tiles stay cover with the face in frame (centre-top)", () => {
    expect(tile).toContain('const focus = { tile: "object-top", preview: "", manage: "object-top" } as const;');
    expect(tile).toContain('className={cn("object-cover", focus[frame])}');
  });

  it("the selfie frame keeps 300px and shrinks in short viewports, never under 160px", () => {
    expect(selfie).toContain("style={{ height: selfieFrameHeight }}");
    expect(selfieFrameHeight).toBe("min(18.75rem, max(10rem, calc(var(--svh) - 16rem)))");
  });
});

describe("READY shows the interests the member chose", () => {
  it("maps API interest ids back to the cards, as INTERESTS saved them", () => {
    expect(ready).toContain("interestChoices(cards, useOnboardingOptions()?.interests, cards[0].icon)");
    const cards = getChoiceSteps().interests.choices;
    const api = [
      { id: "uuid-coffee", key: "coffee", label: "Coffee" },
      { id: "uuid-travel", key: "travel", label: "Travel" },
      { id: "uuid-art", key: "art", label: "Art" },
      { id: "uuid-hiking", key: "hiking", label: "Hiking" },
    ];
    const chosen = interestChoices(cards, api, cards[0].icon).filter((choice) => ["uuid-coffee", "uuid-art"].includes(choice.value));
    expect(chosen.map((choice) => choice.value)).toEqual(["uuid-coffee", "uuid-art"]);
  });
});
