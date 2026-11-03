import type { StoryComment } from "@/data/portal/stories";
import { getStories, getStoriesPage } from "@/stores/portal-store";
import { formatMonth, todayIso } from "@/lib/portal/date-format";
import type { StoryDraft, StoryService, Submission } from "@/lib/portal/story-service";

/**
 * MOCK — stands in for the real stories API so every W08 state can be reviewed.
 * Not for production: replace `storyService` in ./story-service.ts.
 *
 * - Submitting fails while the browser is offline (STORY-ERROR); the draft is kept.
 * - Moderation sends a story back (STORY-REJECT) when it contains an email address or a phone
 *   number; anything else stays "Pending review".
 * - Comments, the draft and the submission live in sessionStorage for this tab, validated on read.
 */
const STORAGE_KEY = "48date.mock.stories";
const LATENCY_MS = 800;
const CONTACT = /[^\s@]+@[^\s@]+\.[^\s@]+|\+?\d[\d\s().-]{6,}\d/;

/** The mock stores a submission as its draft plus status; label and photo are derived. */
type StoredSubmission = StoryDraft & { status: Submission["status"] };
type Stored = { comments: Record<string, StoryComment[]>; draft: StoryDraft | null; submission: StoredSubmission | null };

/** The last `count` months, newest first, as `YYYY-MM` options ("June 2026"). */
function recentMonths(count: number) {
  const [year, month] = todayIso().split("-").map(Number);
  return Array.from({ length: count }, (_, index) => {
    const value = new Date(Date.UTC(year, month - 1 - index, 1)).toISOString().slice(0, 7);
    return { value, label: formatMonth(`${value}-01`) };
  });
}

const shown = (submission: StoredSubmission): Submission => ({
  ...submission,
  metLabel: /^\d{4}-\d{2}$/.test(submission.met) ? formatMonth(`${submission.met}-01`) : submission.met,
  photo: getStoriesPage().create.photo,
});

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null && !Array.isArray(value);

function validDraft(value: unknown): StoryDraft | null {
  if (!isRecord(value)) return null;
  const { title, met, body, consent } = value;
  const { limits } = getStoriesPage().create;
  if (typeof title !== "string" || typeof met !== "string" || typeof body !== "string" || typeof consent !== "boolean") return null;
  return { title: title.slice(0, limits.title), met: met.slice(0, 7), body: body.slice(0, limits.body), consent };
}

function read(): Stored {
  const empty: Stored = { comments: {}, draft: null, submission: null };
  try {
    const value: unknown = JSON.parse(sessionStorage.getItem(STORAGE_KEY) ?? "null");
    if (!isRecord(value)) return empty;
    const comments: Stored["comments"] = {};
    if (isRecord(value.comments)) {
      for (const story of getStories()) {
        const list = value.comments[story.id];
        if (Array.isArray(list)) {
          comments[story.id] = list.filter((item): item is StoryComment => isRecord(item) && typeof item.author === "string" && typeof item.text === "string");
        }
      }
    }
    const draft = validDraft(value.draft);
    const submitted = isRecord(value.submission) ? validDraft(value.submission) : null;
    const status = isRecord(value.submission) ? value.submission.status : null;
    const submission: StoredSubmission | null =
      submitted && (status === "pending" || status === "rejected") ? { ...submitted, status: status === "pending" ? "pending" : "rejected" } : null;
    return { comments, draft, submission };
  } catch {
    return empty;
  }
}

function write(change: Partial<Stored>) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ ...read(), ...change }));
  } catch {
    // Blocked storage: nothing is kept beyond this page.
  }
}

const wait = () => new Promise((resolve) => setTimeout(resolve, LATENCY_MS));

export const mockStoryService: StoryService = {
  photoRequired: false,
  async getMeetOptions() {
    return recentMonths(getStoriesPage().create.limits.months);
  },
  async toggleLike() {
    return { count: 0, liked: false };
  },
  async respond() {},
  async getStories() {
    return getStories();
  },
  async getStory(id) {
    const story = getStories().find((item) => item.id === id);
    return story ? { ...story, comments: [...story.comments, ...(read().comments[id] ?? [])] } : null;
  },
  async addComment(id, text) {
    await wait();
    const comment: StoryComment = { author: getStoriesPage().detail.you, text: text.slice(0, getStoriesPage().detail.commentMax) };
    const { comments } = read();
    write({ comments: { ...comments, [id]: [...(comments[id] ?? []), comment] } });
    return comment;
  },
  async getDraft() {
    return read().draft;
  },
  async saveDraft(draft) {
    write({ draft });
  },
  async submit(draft) {
    write({ draft });
    await wait();
    if (!navigator.onLine) throw new Error("Offline");
    const submission: StoredSubmission = { ...draft, status: CONTACT.test(`${draft.title} ${draft.body}`) ? "rejected" : "pending" };
    write({ submission, draft: null });
    return shown(submission);
  },
  async getSubmission() {
    const { submission } = read();
    return submission ? shown(submission) : null;
  },
  async removeSubmission() {
    await wait();
    write({ submission: null });
  },
};
