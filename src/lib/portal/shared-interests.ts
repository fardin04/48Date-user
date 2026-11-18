import type { Member } from "@/data/portal/types";
import type { InterestTag } from "@/lib/api/types/discovery";
import { fill } from "@/lib/format";
import { getMemberCopy } from "@/stores/portal-store";

/** "3 shared interests": shown where the samples show a compatibility score the API doesn't have. */
export function sharedInterestsText(member: Member) {
  const { shared } = getMemberCopy();
  const count = member.sharedInterests?.length ?? 0;
  if (count === 0) return shared.none;
  return count === 1 ? shared.one : fill(shared.some, { count });
}

/**
 * The other member's interests that the member shares, as labels in the profile's order. The
 * member's own list may hold interest ids or labels (labels compare without case), so a
 * catalogue id change on either side still matches by name.
 */
export function sharedInterestLabels(theirs: InterestTag[], own: string[]) {
  const ids = new Set(own);
  const labels = new Set(own.map((value) => value.trim().toLowerCase()));
  return theirs.filter((interest) => ids.has(interest.id) || labels.has(interest.label.trim().toLowerCase())).map((interest) => interest.label);
}
