import { describe, expect, it } from "vitest";
import { FRAME_MAX, FRAME_MIN, PLACEHOLDER_RATIO, clampRatio, cssAspect, frameRatio, ratioOf } from "./aspect";

describe("ratioOf", () => {
  it.each([
    [1920, 1080, 16 / 9],
    [1080, 1920, 9 / 16],
    [1600, 1200, 4 / 3],
    [1200, 1600, 3 / 4],
    [1000, 1000, 1],
    [2520, 1080, 21 / 9],
    [500, 1500, 1 / 3],
  ])("%i×%i → %f", (w, h, expected) => {
    expect(ratioOf(w, h)).toBeCloseTo(expected, 6);
  });

  it("rejects zero, negative, NaN, infinite and missing sides", () => {
    expect(ratioOf(0, 100)).toBeNull();
    expect(ratioOf(100, 0)).toBeNull();
    expect(ratioOf(-1, 100)).toBeNull();
    expect(ratioOf(Number.NaN, 100)).toBeNull();
    expect(ratioOf(100, Number.POSITIVE_INFINITY)).toBeNull();
    expect(ratioOf(undefined, 100)).toBeNull();
    expect(ratioOf(100, null)).toBeNull();
  });
});

describe("frameRatio", () => {
  it("keeps every common upload ratio unchanged", () => {
    expect(frameRatio(1920, 1080)).toBeCloseTo(16 / 9, 6);
    expect(frameRatio(1080, 1920)).toBeCloseTo(9 / 16, 6);
    expect(frameRatio(4, 3)).toBeCloseTo(4 / 3, 6);
    expect(frameRatio(3, 4)).toBeCloseTo(3 / 4, 6);
    expect(frameRatio(1, 1)).toBe(1);
    expect(frameRatio(21, 9)).toBeCloseTo(21 / 9, 6);
  });

  it("stops extreme photos at the 9:21 / 21:9 frame (the photo is contained, never cropped)", () => {
    expect(frameRatio(1, 3)).toBe(FRAME_MIN);
    expect(frameRatio(5, 1)).toBe(FRAME_MAX);
    expect(clampRatio(0.1)).toBe(FRAME_MIN);
  });

  it("uses the placeholder until dimensions are known", () => {
    expect(frameRatio()).toBe(PLACEHOLDER_RATIO);
    expect(frameRatio(0, 0)).toBe(PLACEHOLDER_RATIO);
    expect(frameRatio(Number.NaN, 4)).toBe(PLACEHOLDER_RATIO);
  });
});

describe("cssAspect", () => {
  it("renders a stable, rounded value", () => {
    expect(cssAspect(16 / 9)).toBe("1.7778");
    expect(cssAspect(9 / 16)).toBe("0.5625");
    expect(cssAspect(1)).toBe("1");
  });
});
