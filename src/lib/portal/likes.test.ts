import type { InfiniteData } from "@tanstack/react-query";
import { describe, expect, it } from "vitest";
import type { LikeReceived, LikesPage } from "@/data/portal/types";
import type { LikeReceivedItem } from "@/lib/api/types/discovery";
import { likeDistance, nextLikesPage, toLike, toLikesPage, withoutLike } from "./likes";

const like = (id: string): LikeReceived => ({ id, name: id, age: 25, photo: { src: "/x.jpg", alt: id, width: 400, height: 500 }, verified: true, superLike: false, distanceKm: 3, locked: false });
const page = (n: number, ids: string[], hasMore: boolean): LikesPage => ({ items: ids.map(like), page: n, hasMore, total: 5 });
const data = (...pages: LikesPage[]): InfiniteData<LikesPage, number> => ({ pages, pageParams: pages.map((p) => p.page) });

const item = (overrides: Partial<LikeReceivedItem> = {}): LikeReceivedItem => ({
  id: "u1",
  nickname: "Wildflower",
  age: 25,
  mainPhotoUrl: "https://cdn.example.com/w.jpg",
  isVerified: true,
  isSuperLike: false,
  likedAt: "2026-10-30T16:00:00.000Z",
  distanceKm: 4,
  bio: null,
  occupation: null,
  photos: [],
  interests: [],
  isLocked: false,
  ...overrides,
});

describe("removing a card from the cached pages", () => {
  it("drops the member from whichever page holds them and lowers the total", () => {
    const next = withoutLike(data(page(1, ["a", "b"], true), page(2, ["c"], false)), "c");
    expect(next?.pages.flatMap((p) => p.items.map((i) => i.id))).toEqual(["a", "b"]);
    expect(next?.pages.every((p) => p.total === 4)).toBe(true);
  });

  it("leaves the cache untouched when the member isn't listed, or nothing is cached", () => {
    const before = data(page(1, ["a"], false));
    expect(withoutLike(before, "zz")).toBe(before);
    expect(withoutLike(undefined, "a")).toBeUndefined();
  });
});

describe("paging", () => {
  it("asks for the next page only while the API says there is more", () => {
    expect(nextLikesPage(page(1, ["a"], true))).toBe(2);
    expect(nextLikesPage(page(3, ["a"], false))).toBeUndefined();
  });

  it("maps the page meta", () => {
    expect(toLikesPage({ items: [item()], mode: "ALL_UNBLURRED", meta: { page: 2, limit: 20, total: 21, totalPages: 2, hasMore: false, nextCursor: null } })).toMatchObject({
      page: 2,
      hasMore: false,
      total: 21,
    });
  });
});

describe("locked mode", () => {
  it("locks every item in paywall mode, and any item the API marks locked", () => {
    expect(toLike(item(), "PAYWALL_BLURRED").locked).toBe(true);
    expect(toLike(item({ isLocked: true }), "ALL_UNBLURRED").locked).toBe(true);
    expect(toLike(item(), "ALL_UNBLURRED").locked).toBe(false);
  });

  it("uses the placeholder when there is no photo", () => {
    expect(toLike(item({ mainPhotoUrl: null }), "ALL_UNBLURRED").photo.src).toContain("member-placeholder");
  });
});

describe("distance in km", () => {
  it("shows whole km, at least 1, and nothing when hidden", () => {
    expect(likeDistance(4)).toBe("4 km away");
    expect(likeDistance(12.6)).toBe("13 km away");
    expect(likeDistance(0.2)).toBe("1 km away");
    expect(likeDistance(null)).toBeNull();
  });
});
