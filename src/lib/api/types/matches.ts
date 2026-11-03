import type { Availability } from "./discovery";

/** User / 04 - Matches. Enums are case-sensitive. */

export type MatchTabParam = "all" | "cancelled" | "completed";

export type MatchDisplayStatus = "NEW" | "ACTIVE" | "EXPIRING_SOON" | "DATE_PENDING" | "DATE_SET" | "COMPLETED" | "CANCELLED" | "EXPIRED" | string;

export type MatchAction = "MESSAGE" | "PLAN_DATE" | "VIEW_DETAILS" | "VIEW_DATE" | string;

export type OtherUser = {
  availability: Availability;
  nickname: string;
  age: number | null;
  mainPhotoUrl: string | null;
  isVerified: boolean;
};

/** The live API sends the place as `place: { name, address }` (the collection shows `venueName`). */
export type MatchLatestDate = {
  id: string;
  status: string;
  venueName?: string | null;
  place?: { name: string | null; address: string | null } | null;
  scheduledAt?: string | null;
  proposedByMe?: boolean;
  myRatingDone?: boolean;
} | null;

export type MatchItem = {
  id: string;
  otherUser: OtherUser;
  displayStatus: MatchDisplayStatus;
  actions: MatchAction[];
  createdAt: string;
  expiresAt: string | null;
  clockStoppedAt: string | null;
  latestDate: MatchLatestDate;
  conversationId: string | null;
  lastMessagePreview: string | null;
  lastActivityAt: string | null;
};

export type MatchDetail = MatchItem & { dateHistory: unknown[] };

export type MatchesMeta = { nextCursor: string | null; hasMore: boolean; activeCount?: number; serverTime?: string };
