import { describe, expect, it } from "vitest";
import { getPhotosStep } from "@/stores/onboarding-store";
import { isAcceptedPhoto } from "@/lib/onboarding/photo-file";

const { accept, maxBytes, required, max } = getPhotosStep();
const file = (type: string, size: number) => ({ type, size });

describe("photo file check before upload (JPG / PNG / WebP up to 10 MB)", () => {
  it("uses the documented limits: 2 to 6 photos, JPG / PNG / WebP, 10 MB", () => {
    expect([...accept].sort()).toEqual(["image/jpeg", "image/png", "image/webp"]);
    expect(maxBytes).toBe(10 * 1024 * 1024);
    expect([required, max]).toEqual([2, 6]);
  });

  it.each(["image/jpeg", "image/png", "image/webp"])("accepts %s up to the limit", (type) => {
    expect(isAcceptedPhoto(file(type, 1), accept, maxBytes)).toBe(true);
    expect(isAcceptedPhoto(file(type, maxBytes), accept, maxBytes)).toBe(true);
  });

  it("rejects a file over 10 MB", () => {
    expect(isAcceptedPhoto(file("image/jpeg", maxBytes + 1), accept, maxBytes)).toBe(false);
  });

  it.each(["image/gif", "image/heic", "application/pdf", "video/mp4", ""])("rejects %j", (type) => {
    expect(isAcceptedPhoto(file(type, 1000), accept, maxBytes)).toBe(false);
  });

  it("rejects an empty file", () => {
    expect(isAcceptedPhoto(file("image/png", 0), accept, maxBytes)).toBe(false);
  });
});
