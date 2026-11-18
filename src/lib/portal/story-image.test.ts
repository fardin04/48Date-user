import { describe, expect, it } from "vitest";
import { cssAspect, FRAME_MIN, frameRatio, frameStyle, PLACEHOLDER_RATIO } from "@/lib/media/aspect";

/** Phase 20 / 21: story photos keep their own ratio (rule 50); the height cap narrows the frame instead of cropping. */
describe("story photo frames", () => {
  const cases: [string, number, number, number][] = [
    ["16:9", 1920, 1080, 16 / 9],
    ["9:16", 1080, 1920, 9 / 16],
    ["4:3", 1600, 1200, 4 / 3],
    ["3:4", 1200, 1600, 3 / 4],
    ["1:1", 1000, 1000, 1],
    ["21:9", 2520, 1080, 21 / 9],
  ];

  it.each(cases)("frames a %s photo at its own ratio", (_, width, height, ratio) => {
    expect(frameRatio(width, height)).toBeCloseTo(ratio, 6);
  });

  it("letterboxes a very tall 1:3 photo inside a 9:21 frame (still contained, never cropped)", () => {
    expect(frameRatio(600, 1800)).toBeCloseTo(FRAME_MIN, 6);
  });

  it("holds a 4:3 placeholder until the API-less photo is measured", () => {
    expect(frameRatio(undefined, undefined)).toBe(PLACEHOLDER_RATIO);
    expect(frameRatio(0, 900)).toBe(PLACEHOLDER_RATIO);
  });

  it("caps the height and narrows the width by the same ratio", () => {
    const style = frameStyle(9 / 16, "20rem");
    expect(style).toEqual({ aspectRatio: cssAspect(9 / 16), maxHeight: "20rem", maxWidth: "calc(20rem * 0.5625)" });
    expect(frameStyle(16 / 9, "20rem").maxWidth).toBe("calc(20rem * 1.7778)");
  });
});
