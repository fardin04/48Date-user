import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { photoStore } from "@/lib/onboarding/photo-store";

let revoked: string[];
beforeEach(() => {
  vi.spyOn(URL, "revokeObjectURL").mockImplementation((url: string) => void revoked.push(url));
  revoked = [];
  photoStore.clear();
  revoked = [];
});
afterEach(() => vi.restoreAllMocks());

describe("photoStore (in-memory object URLs, rule 34)", () => {
  it("keeps photos in the order added, the first as main", () => {
    photoStore.add("blob:one", "file-1");
    photoStore.add("blob:two");
    expect(photoStore.read().map((photo) => [photo.url, photo.fileId])).toEqual([
      ["blob:one", "file-1"],
      ["blob:two", undefined],
    ]);
  });

  it("revokes a removed photo's URL, and only that one", () => {
    photoStore.add("blob:one");
    photoStore.add("blob:two");
    photoStore.remove(photoStore.read()[0].id);
    expect(revoked).toEqual(["blob:one"]);
    expect(photoStore.read().map((photo) => photo.url)).toEqual(["blob:two"]);
  });

  it("revokes every URL when the photos are discarded (sign-out, leaving sign-up)", () => {
    photoStore.add("blob:one");
    photoStore.add("blob:two");
    photoStore.add("blob:three");
    photoStore.clear();
    expect([...revoked].sort()).toEqual(["blob:one", "blob:three", "blob:two"]);
    expect(photoStore.read()).toEqual([]);
  });

  it("making a photo main reorders without revoking anything", () => {
    photoStore.add("blob:one");
    photoStore.add("blob:two");
    photoStore.makeMain(photoStore.read()[1].id);
    expect(photoStore.read().map((photo) => photo.url)).toEqual(["blob:two", "blob:one"]);
    expect(revoked).toEqual([]);
  });

  it("ignores unknown ids", () => {
    photoStore.add("blob:one");
    photoStore.remove("missing");
    photoStore.makeMain("missing");
    expect(photoStore.read()).toHaveLength(1);
    expect(revoked).toEqual([]);
  });
});
