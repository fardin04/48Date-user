import type { MemberId, MemberLink } from "@/data/portal/types";
import type { Action } from "@/data/types";
import { toItem } from "../routes";

/** A data action for the member on screen: a `MemberLink` opens that member's page; an `Action` is used as is. */
export const forMember = (entry: Action | MemberLink, member: MemberId): Action =>
  "step" in entry ? { label: entry.label, to: toItem(entry.step, member) } : entry;
