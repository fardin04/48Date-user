import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import * as landing from "@/stores/landing-store";

type Found = { path: string; image: Record<string, unknown> };

/** Every `{ src: "/images/…" }` object reachable from the landing store. */
function findImages(value: unknown, path: string, out: Found[]) {
  if (!value || typeof value !== "object") return out;
  const record = value as Record<string, unknown>;
  if (typeof record.src === "string" && /\.(png|jpe?g|webp|svg|avif)$/.test(record.src)) out.push({ path, image: record });
  for (const [key, child] of Object.entries(record)) findImages(child, `${path}.${key}`, out);
  return out;
}

const images = Object.entries(landing)
  .filter(([name]) => name !== "getAnchors")
  .flatMap(([name, get]) => findImages((get as () => unknown)(), name, []));

describe("landing images (rules 14 / 50)", () => {
  it("finds the landing photography", () => {
    expect(images.length).toBeGreaterThan(10);
  });

  it.each(images.map((found) => [found.path, found.image] as const))("%s has alt text and intrinsic size", (_path, image) => {
    // Empty alt marks a decorative image; it must still be set explicitly.
    expect(typeof image.alt).toBe("string");
    expect(Number.isFinite(image.width) && (image.width as number) > 0).toBe(true);
    expect(Number.isFinite(image.height) && (image.height as number) > 0).toBe(true);
  });

  it.each(images.map((found) => [found.path, found.image.src as string] as const))("%s exists in public/", (_path, src) => {
    expect(existsSync(join(process.cwd(), "public", src))).toBe(true);
  });
});
