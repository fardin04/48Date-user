import type { Member } from "@/data/portal/types";
import { fill } from "@/lib/format";
import { getMemberCopy } from "@/stores/portal-store";

/** "3 shared interests": shown where the samples show a compatibility score the API doesn't have. */
export function sharedInterestsText(member: Member) {
  const { shared } = getMemberCopy();
  const count = member.sharedInterests?.length ?? 0;
  if (count === 0) return shared.none;
  return count === 1 ? shared.one : fill(shared.some, { count });
}
