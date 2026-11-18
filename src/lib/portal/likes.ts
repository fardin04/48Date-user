import type { InfiniteData } from "@tanstack/react-query";
import type { LikeReceived, LikesPage, MemberId } from "@/data/portal/types";
import type { LikeReceivedItem, LikesReceivedData } from "@/lib/api/types/discovery";
import { isApiError } from "@/lib/api/errors";
import { fill } from "@/lib/format";
import { memberPhoto } from "@/lib/portal/api-members";
import { getLikesPage } from "@/stores/portal-store";

/** One API item as a like card. A locked item keeps the API's masked name and blurred photo (never unblurred here). */
export function toLike(item: LikeReceivedItem, mode: LikesReceivedData["mode"]): LikeReceived {
  const locked = item.isLocked || mode === "PAYWALL_BLURRED";
  return {
    id: item.nickname,
    name: item.nickname,
    age: item.age,
    photo: memberPhoto(item.nickname, item.mainPhotoUrl),
    verified: item.isVerified,
    superLike: item.isSuperLike,
    distanceKm: item.distanceKm,
    locked,
  };
}

export function toLikesPage(data: LikesReceivedData): LikesPage {
  return { items: data.items.map((item) => toLike(item, data.mode)), page: data.meta.page, hasMore: data.meta.hasMore, total: data.meta.total };
}

/** The page to load after `last`, or undefined when there is no more. */
export const nextLikesPage = (last: LikesPage) => (last.hasMore ? last.page + 1 : undefined);

/** Every loaded page with this member's card removed (after a like back or a pass); the total follows. */
export function withoutLike(data: InfiniteData<LikesPage, number> | undefined, member: MemberId): InfiniteData<LikesPage, number> | undefined {
  if (!data) return data;
  const removed = data.pages.some((page) => page.items.some((item) => item.id === member));
  if (!removed) return data;
  return {
    ...data,
    pages: data.pages.map((page) => ({ ...page, items: page.items.filter((item) => item.id !== member), total: Math.max(0, page.total - 1) })),
  };
}

/** "4 km away" (this page speaks km, as the API sends it); null when the distance is hidden. */
export function likeDistance(km: number | null) {
  return km === null ? null : fill(getLikesPage().distance, { km: Math.max(1, Math.round(km)) });
}

/** A like back or pass on someone who already matched or left (404 / 409): their card goes, with the API's message. */
export const isGoneLike = (error: unknown) => isApiError(error) && (error.status === 404 || error.status === 409);
