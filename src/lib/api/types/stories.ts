/** User / 14 - Success Stories. Enums are case-sensitive. */

export type StoryStatus = "PENDING_PARTNER" | "PENDING_REVIEW" | "APPROVED" | "REJECTED" | "DECLINED";

export type StoryPerson = { availability: "ACTIVE" | "UNAVAILABLE"; nickname: string; age: number | null; mainPhotoUrl: string | null; isVerified: boolean };

export type ApiStory = {
  id: string;
  datePlanId: string;
  matchId: string;
  title: string;
  body: string;
  imageUrl: string | null;
  /** The photo's pixel size from its upload record (B2); null for older stories without one. */
  imageWidth: number | null;
  imageHeight: number | null;
  status: StoryStatus;
  rejectionReason: string | null;
  likesCount: number;
  commentsCount: number;
  isLikedByMe: boolean;
  author: StoryPerson;
  partner: StoryPerson;
  createdAt: string;
  updatedAt: string;
};

export type ApiStoryComment = { id: string; storyId: string; body: string; author: StoryPerson; createdAt: string };

export type EligibleDate = { datePlanId: string; matchId: string; scheduledAt: string; venueName: string; partner: StoryPerson };

export type StoryBody = { datePlanId: string; title: string; body: string; imageUrl: string };
