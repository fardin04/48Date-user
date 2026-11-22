import type { PhotoSize, Story } from "@/data/portal/stories";
import { isApiError } from "@/lib/api/errors";
import { onboardingApi } from "@/lib/api/modules/onboarding-api";
import { storiesApi } from "@/lib/api/modules/stories-api";
import { usersApi } from "@/lib/api/modules/users-api";
import type { ApiStory } from "@/lib/api/types/stories";
import { fill } from "@/lib/format";
import { memberPhoto } from "@/lib/portal/api-members";
import { formatDayMonth, formatMonth } from "@/lib/portal/date-format";
import type { StoryDraft, StoryService, Submission } from "@/lib/portal/story-service";
import { getLiveStoryCopy, getStoriesPage } from "@/stores/portal-store";

const DRAFT_KEY = "48date.stories.draft";

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null && !Array.isArray(value);

function readDraft(): StoryDraft | null {
  try {
    const value: unknown = JSON.parse(sessionStorage.getItem(DRAFT_KEY) ?? "null");
    if (!isRecord(value)) return null;
    const { title, met, body, consent } = value;
    const { limits } = getStoriesPage().create;
    if (typeof title !== "string" || typeof met !== "string" || typeof body !== "string" || typeof consent !== "boolean") return null;
    return { title: title.slice(0, limits.title), met: met.slice(0, 64), body: body.slice(0, limits.body), consent };
  } catch {
    return null;
  }
}

function writeDraft(draft: StoryDraft | null) {
  try {
    if (draft) sessionStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    else sessionStorage.removeItem(DRAFT_KEY);
  } catch {
    // Blocked storage: the draft lasts only for this page.
  }
}

/** The API's real photo size (B2); without it `MediaFrame` measures the photo on load. */
function photoSize({ imageWidth, imageHeight }: ApiStory): PhotoSize | undefined {
  return imageWidth && imageHeight ? { width: imageWidth, height: imageHeight } : undefined;
}

function toStory(story: ApiStory): Story {
  const copy = getLiveStoryCopy();
  const couple = fill(copy.couple, { author: story.author.nickname, partner: story.partner.nickname });
  const excerpt = story.body.length > copy.excerptMax ? `${story.body.slice(0, copy.excerptMax - 1).trimEnd()}…` : story.body;
  return {
    id: story.id,
    title: story.title,
    detailTitle: story.title,
    couple,
    met: fill(copy.shared, { month: formatMonth(story.createdAt.slice(0, 10)) }),
    excerpt,
    body: story.body,
    photo: { ...memberPhoto(couple, story.imageUrl, story.title), height: 1080 },
    photoSize: photoSize(story),
    comments: [],
    likes: { count: story.likesCount, liked: story.isLikedByMe },
    stage: story.status,
    rejectionReason: story.rejectionReason,
  };
}

/** The member's newest story still in consent or moderation, or sent back. Approved stories live in the feed. */
async function currentSubmission(): Promise<ApiStory | null> {
  const { data } = await storiesApi.mine();
  return (
    [...data]
      .filter((story) => story.status !== "APPROVED")
      .sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt))[0] ?? null
  );
}

function toSubmission(story: ApiStory): Submission {
  const isRejected = story.status === "REJECTED" || story.status === "DECLINED";
  const mineCopy = getStoriesPage().mine;
  let statusBadge: string | undefined;
  let statusNote: string | undefined;
  if (story.status === "PENDING_PARTNER") {
    statusBadge = mineCopy.waitingPartnerBadge;
    statusNote = mineCopy.waitingPartnerNote;
  } else if (story.status === "PENDING_REVIEW") {
    statusBadge = mineCopy.waitingAdminBadge;
    statusNote = mineCopy.waitingAdminNote;
  } else if (story.status === "DECLINED") {
    statusBadge = mineCopy.declinedBadge;
    statusNote = mineCopy.declinedNote;
  } else if (story.status === "REJECTED") {
    statusBadge = mineCopy.rejectedBadge;
    statusNote = story.rejectionReason ?? mineCopy.rejectedNote;
  }
  return {
    title: story.title,
    met: story.datePlanId,
    metLabel: fill(getLiveStoryCopy().shared, { month: formatMonth(story.createdAt.slice(0, 10)) }),
    body: story.body,
    consent: true,
    status: isRejected ? "rejected" : "pending",
    subStatus: story.status,
    statusBadge: isRejected ? undefined : statusBadge,
    statusNote: isRejected ? undefined : statusNote,
    rejectionReason: story.rejectionReason,
    photo: story.imageUrl ? { ...memberPhoto(story.title, story.imageUrl, getLiveStoryCopy().photo.alt), height: 1080 } : null,
    photoSize: photoSize(story),
  };
}

/** User / 14 - Success Stories: a story is tied to a completed date and shown only after consent and moderation. */
export const apiStoryService: StoryService = {
  photoRequired: true,
  async getStories() {
    return (await storiesApi.feed()).data.map(toStory);
  },
  async getStoryPage(cursor) {
    const { data, meta } = await storiesApi.feed(cursor ?? undefined);
    return { stories: data.map(toStory), next: meta?.hasMore ? (meta.nextCursor ?? null) : null };
  },
  async getStory(id) {
    try {
      const { data: story } = await storiesApi.detail(id);
      // A story waiting for consent has no comments yet; the partner sees it to answer.
      if (story.status !== "APPROVED") {
        const me = await usersApi.me().then(({ data }) => data.nickname).catch(() => null);
        const asked = story.status === "PENDING_PARTNER" && me !== null && me.toLowerCase() === story.partner.nickname.toLowerCase();
        return { ...toStory(story), ...(asked ? { consent: { author: story.author.nickname } } : {}) };
      }
      const { data: comments } = await storiesApi.comments(id);
      return { ...toStory(story), comments: comments.map((comment) => ({ author: comment.author.nickname, text: comment.body })) };
    } catch (error) {
      if (isApiError(error) && error.status === 404) return null;
      throw error;
    }
  },
  async toggleLike(id, liked) {
    const { data } = await (liked ? storiesApi.unlike(id) : storiesApi.like(id));
    return { count: data.likesCount, liked: data.isLiked };
  },
  async respond(id, accept) {
    await storiesApi.respond(id, accept);
  },
  async addComment(id, text) {
    const { data } = await storiesApi.addComment(id, text);
    return { author: data.author.nickname, text: data.body };
  },
  async getComments(id, cursor) {
    const [{ data, meta }, me] = await Promise.all([storiesApi.comments(id, cursor ?? undefined), usersApi.me().then(({ data: user }) => user.nickname.toLowerCase()).catch(() => null)]);
    return {
      comments: data.map((comment) => ({ id: comment.id, author: comment.author.nickname, text: comment.body, mine: me !== null && comment.author.nickname.toLowerCase() === me })),
      next: meta?.hasMore ? (meta.nextCursor ?? null) : null,
    };
  },
  async deleteComment(id, commentId) {
    await storiesApi.deleteComment(id, commentId);
  },
  async getMeetOptions() {
    const { data } = await storiesApi.eligibleDates();
    const copy = getLiveStoryCopy();
    return data.map((date) => ({
      value: date.datePlanId,
      label: fill(copy.meetOption, { day: formatDayMonth(date.scheduledAt), venue: date.venueName, name: date.partner.nickname }),
    }));
  },
  async getDraft() {
    return readDraft();
  },
  async saveDraft(draft) {
    writeDraft(draft);
  },
  async submit(draft, photo, onProgress) {
    const existing = await currentSubmission();
    const imageUrl = photo ? (await onboardingApi.upload(photo, "STORY_IMAGE", onProgress ?? (() => undefined))).url : undefined;
    let submitted: ApiStory | null = null;
    if (existing) {
      const { data: patched } = await storiesApi.edit(existing.id, { title: draft.title, body: draft.body, ...(imageUrl ? { imageUrl } : {}) });
      submitted = (await currentSubmission()) ?? ({ ...existing, ...patched } as ApiStory);
    } else {
      if (!imageUrl) throw new Error(getLiveStoryCopy().photo.required);
      const { data: created } = await storiesApi.create({ datePlanId: draft.met, title: draft.title, body: draft.body, imageUrl });
      submitted = (await currentSubmission()) ?? created;
    }
    writeDraft(null);
    if (!submitted) throw new Error("The story wasn't saved.");
    return toSubmission(submitted);
  },
  async getSubmission() {
    const story = await currentSubmission();
    return story ? toSubmission(story) : null;
  },
  async removeSubmission() {
    const story = await currentSubmission();
    if (story) await storiesApi.remove(story.id);
  },
  async getPendingPartnerStories() {
    try {
      const { data } = await storiesApi.mine({ role: "partner", status: "PENDING_PARTNER" });
      return data.map(toStory);
    } catch {
      return [];
    }
  },
};
