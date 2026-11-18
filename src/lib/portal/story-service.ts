import type { Story, StoryComment } from "@/data/portal/stories";
import type { ImageAsset } from "@/data/types";
import { apiEnabled } from "@/lib/api/config";
import { apiStoryService } from "@/lib/portal/api-story-service";
import { mockStoryService } from "@/lib/portal/mocks/mock-story-service";
import type { CommentItem } from "@/lib/portal/story-comments";

/** `met` is a chosen option of `getMeetOptions` (a month with the mock, a completed date with the API). */
export type StoryDraft = { title: string; met: string; body: string; consent: boolean };

/** The member's own submission: waiting for consent or moderation, or sent back for an edit. */
export type Submission = StoryDraft & {
  status: "pending" | "rejected";
  subStatus?: "PENDING_PARTNER" | "PENDING_REVIEW" | "APPROVED" | "REJECTED" | "DECLINED";
  statusNote?: string;
  statusBadge?: string;
  rejectionReason?: string | null;
  /** How "When did you meet?" reads ("June 2026", "18 Oct · Cafe Nero"). */
  metLabel: string;
  photo: ImageAsset | null;
};

export type MeetOption = { value: string; label: string };

/**
 * Contract the stories screens talk to (rule 37). Stories are published only after moderation;
 * a failed submission keeps the draft so it can be retried (handoff).
 */
export type StoryService = {
  /** The API publishes a story with a photo of the two of them; the mock uses the sample photo. */
  photoRequired: boolean;
  getStories: () => Promise<Story[]>;
  /** A page of the feed from `cursor` (the first without); `next` is null on the last page. */
  getStoryPage: (cursor?: string | null) => Promise<{ stories: Story[]; next: string | null }>;
  getStory: (id: string) => Promise<Story | null>;
  /** Likes (or, when `liked`, unlikes) the story; resolves with the server's count. */
  toggleLike: (id: string, liked: boolean) => Promise<{ count: number; liked: boolean }>;
  /** The invited partner's answer: share (goes to review) or don't. */
  respond: (id: string, accept: boolean) => Promise<void>;
  /** Comments are shown under the member's nickname ("You" in the build). */
  addComment: (id: string, text: string) => Promise<StoryComment>;
  /** A page of comments from `cursor` (the first without), marking the member's own. */
  getComments: (id: string, cursor?: string | null) => Promise<{ comments: CommentItem[]; next: string | null }>;
  /** Deletes one of the member's own comments. */
  deleteComment: (id: string, commentId: string) => Promise<void>;
  /** The choices for "When did you meet?". */
  getMeetOptions: () => Promise<MeetOption[]>;
  /** The saved draft while writing (kept after a failed submission). */
  getDraft: () => Promise<StoryDraft | null>;
  saveDraft: (draft: StoryDraft) => Promise<void>;
  /** Resolves with the submission, or rejects when it could not be sent (STORY-ERROR). */
  submit: (draft: StoryDraft, photo: File | null, onProgress?: (percent: number) => void) => Promise<Submission>;
  getSubmission: () => Promise<Submission | null>;
  removeSubmission: () => Promise<void>;
  /** Stories waiting for the current user's approval as a date partner. */
  getPendingPartnerStories: () => Promise<Story[]>;
};

/** The API (`NEXT_PUBLIC_API_BASE_URL` set) or the marked mock. */
export const storyService: StoryService = apiEnabled ? apiStoryService : mockStoryService;
