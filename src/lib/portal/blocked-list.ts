import type { MemberId } from "@/data/portal/types";
import { fill } from "@/lib/format";

/**
 * Phase 31: Blocked users list pure logic.
 * Handles page merging, deduplication, member removal after unblock, and empty state checks.
 */

/** Flattens cursor-paginated blocked member pages, keeping insertion order and removing duplicates. */
export function mergeBlockedPages(pages: Array<{ items: MemberId[] }> | null | undefined): MemberId[] {
  if (!pages || pages.length === 0) return [];
  const seen = new Set<MemberId>();
  const merged: MemberId[] = [];
  for (const page of pages) {
    for (const id of page.items) {
      if (!seen.has(id)) {
        seen.add(id);
        merged.push(id);
      }
    }
  }
  return merged;
}

/** Pure removal of an unblocked member from the cached or active list. */
export function removeBlockedMember(list: MemberId[] | null | undefined, memberToRemove: MemberId): MemberId[] {
  if (!list || list.length === 0) return [];
  return list.filter((id) => id !== memberToRemove);
}

/** Checks if the blocked list is empty (transition to BLOCKED-EMPTY state). */
export function isBlockedEmpty(items: MemberId[] | null | undefined): boolean {
  return !items || items.length === 0;
}

/** Formats unblock action strings (e.g. "Unblock {name}"). */
export function formatUnblockLabel(template: string, name: string): string {
  return fill(template, { name });
}
