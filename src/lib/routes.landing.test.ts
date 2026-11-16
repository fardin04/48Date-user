import { describe, expect, it } from "vitest";
import { getAnchors } from "@/stores/landing-store";
import { getNav } from "@/stores/site-store";
import { hrefFor, notFoundSegment, sectionFromParam, type ScreenCode } from "@/lib/routes";

const ids = Object.values(getAnchors());

describe("landing section routes (L02)", () => {
  it("builds one top-level path per anchor, never a #hash", () => {
    for (const id of ids) {
      expect(hrefFor("L02", id)).toBe(`/${id}`);
      expect(hrefFor("L02", id)).not.toContain("#");
    }
    expect(hrefFor("L02")).toBe("/");
  });

  it("uses URL-safe, unique section ids", () => {
    for (const id of ids) expect(id).toMatch(/^[a-z]+(-[a-z]+)*$/);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("accepts the landing root and every anchor", () => {
    expect(sectionFromParam(undefined, ids)).toEqual({ valid: true, section: undefined });
    expect(sectionFromParam([], ids)).toEqual({ valid: true, section: undefined });
    for (const id of ids) expect(sectionFromParam([id], ids)).toEqual({ valid: true, section: id });
  });

  it("rejects unknown, nested and not-found segments", () => {
    expect(sectionFromParam(["pricing"], ids).valid).toBe(false);
    expect(sectionFromParam([notFoundSegment], ids).valid).toBe(false);
    expect(sectionFromParam([ids[0], ids[1]], ids).valid).toBe(false);
    expect(sectionFromParam([ids[0], "extra"], ids).valid).toBe(false);
    expect(sectionFromParam(["How-It-Works"], ids).valid).toBe(false);
  });

  it("points every nav section link at a real landing section", () => {
    for (const link of getNav().links) {
      const target = link.to as { screen?: ScreenCode; section?: string };
      if (target.screen !== "L02" || !target.section) continue;
      expect(ids).toContain(target.section);
    }
  });
});
