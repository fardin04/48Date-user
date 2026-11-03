/** User / 14 - Success Stories. Enums are case-sensitive. */

export type StoryStatus = "PENDING_PARTNER" | "PENDING_REVIEW" | "APPROVED" | "REJECTED" | "DECLINED";

export type StoryPerson = { availability: "ACTIVE" | "UNAVAILABLE"; nickname: string; age: number | null; avatarUrl: string | null; isVerified: boolean };

export type ApiStory = {
  id: string;
  datePlanId: string;
  matchId: string;
  title: string;
  body: string;
  imageUrl: string | null;
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
