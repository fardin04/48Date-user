import { to } from "@/lib/routes";
import type { Action, IconName, ImageAsset } from "../types";
import type { Fact, StatusSummaryCopy } from "./types";

const book: IconName = "book-open-01";
const couple: ImageAsset = { src: "/images/portal/story.webp", alt: "GoldenHour and RiverStone smiling on a rooftop at sunset", width: 735, height: 1093 };

export type StoryComment = { author: string; text: string };

/** A published community story (sample, not production records). */
export type Story = {
  id: string;
  title: string;
  /** Detail-page title (Figma shortens the feed headline). */
  detailTitle: string;
  couple: string;
  met: string;
  excerpt: string;
  body: string;
  photo: ImageAsset;
  comments: StoryComment[];
  /** Likes (API stories). */
  likes?: { count: number; liked: boolean };
  /** The member is the partner asked to consent before the story is reviewed; `author` asked. */
  consent?: { author: string };
};

export const stories: Story[] = [
  {
    id: "first-coffee",
    title: "From a first coffee to something real",
    detailTitle: "From coffee to something real",
    couple: "GoldenHour & RiverStone",
    met: "Met four months ago",
    excerpt: "We made a plan before the timer ran out. One coffee became an afternoon we didn’t want to end.",
    body: "We matched on Monday, made a plan before the timer ran out, and shared our first coffee on Wednesday. It was the start of something real.",
    photo: couple,
    comments: [{ author: "WildRose", text: "Wishing you both the best!" }],
  },
];

/** W08 / Success Stories. */
/** Stories from the API (design-silent; for owner approval). */
export const liveStoryCopy = {
  couple: "{author} & {partner}",
  shared: "Shared in {month}",
  /** A completed date offered under "When did you meet?". */
  meetOption: "{day} · {venue} with {name}",
  excerptMax: 160,
  photo: {
    label: "A photo of you both",
    choose: "Choose a photo",
    change: "Change photo",
    alt: "Your story photo",
    required: "Add a photo of you both.",
    invalid: "Choose a JPG, PNG or WebP photo under 10 MB.",
    accept: ["image/jpeg", "image/png", "image/webp"],
    maxBytes: 10 * 1024 * 1024,
  },
};

export const storiesPage = {
  documentTitles: { feed: "Good things start here", detail: "{title}", create: "Tell your story", mine: "Your shared story" },
  back: { label: "Back", icon: "arrow-left-02", to: to("STORIES") } satisfies Action,
  feed: {
    title: "Good things start here",
    description: "Real connections from the 48Date community.",
    meta: "{couple} · {met}",
    read: "Read their story",
    share: { label: "Share your story", to: to("STORY-CREATE") } satisfies Action,
  },
  context: {
    title: "Your story, your choice",
    description: "Share a moment you’re both happy to make public.",
    photo: { ...couple, alt: "" } satisfies ImageAsset,
    facts: [
      { label: "Before sharing", value: "Get your partner’s consent" },
      { label: "After submitting", value: "We review before publishing" },
    ] satisfies Fact[],
    mine: { label: "My shared story", to: to("STORY-MINE") } satisfies Action,
  },
  prompt: {
    title: "Have a story to tell?",
    description: "A first coffee. A great conversation. Share the moment that made it real.",
    action: { label: "Share your story", to: to("STORY-CREATE") } satisfies Action,
  },
  detail: {
    commentsLabel: "Comments",
    comment: "Comment",
    commentPlaceholder: "Write something kind",
    commentMax: 280,
    commentRequired: "Write a comment first.",
    add: "Add comment",
    adding: "Posting…",
    report: "Report story",
    you: "You",
    posted: { title: "Your comment is posted", description: "You added: “{comment}”", back: { label: "Back to stories", to: to("STORIES") } satisfies Action },
    /** Likes and the partner's consent (design-silent; for owner approval). */
    like: "Like · {count}",
    liked: "Liked · {count}",
    consent: {
      note: "{name} wants to share this story about your date. It will be reviewed before anyone sees it.",
      approve: "Approve story",
      decline: "Don’t share",
      approved: "Thanks. The story is now with our team for review.",
      declined: "The story won’t be shared.",
    },
  },
  create: {
    title: "Tell your story",
    description: "Share how a small hello became something meaningful.",
    photo: couple,
    fields: { title: "Story title", met: "When did you meet?", body: "Your story" },
    placeholders: { title: "Give your story a title", met: "Choose a month", body: "How did a small hello become something real?" },
    limits: { title: 80, body: 1000, bodyMin: 20, months: 24 },
    consent: "The other person agrees to appear in this story",
    /** Design-silent validation copy, for owner approval. */
    errors: {
      title: "Add a title for your story.",
      met: "Choose when you met.",
      body: "Write at least 20 characters.",
      consent: "Confirm that the other person agrees to appear.",
    },
    submit: "Submit story",
    submitting: "Submitting…",
    error: { title: "Your draft is still here", description: "We couldn’t submit your story. Your writing has been kept.", note: "Check your connection, then try again.", retry: "Retry submission" },
  },
  pending: {
    title: "Your story is with us",
    description: "We’ll review it before it appears in the community feed.",
    badge: "Pending review",
    summary: { icon: book, title: "Submitted for review", description: "Your story will appear in the community after it is approved." } satisfies StatusSummaryCopy,
    primary: { label: "Back to stories", to: to("STORIES") } satisfies Action,
    secondary: { label: "View my submission", to: to("STORY-MINE") } satisfies Action,
  },
  mine: {
    title: "Your shared story",
    description: "Your submission · Pending review",
    edit: { label: "Edit story", to: to("STORY-CREATE") } satisfies Action,
    remove: "Remove submission",
  },
  remove: {
    title: "Remove this story?",
    description: "Your submission will be removed from the review queue.",
    confirm: "Remove story",
    removing: "Removing…",
    keep: "Keep story",
    close: "Close",
  },
  reject: {
    title: "Your story needs a small update",
    description: "Remove personal contact details before sharing your story with the community.",
    summary: { icon: book, title: "Your draft is ready to edit", description: "Review the feedback and update your story before submitting again." } satisfies StatusSummaryCopy,
    primary: { label: "Edit story", to: to("STORY-CREATE") } satisfies Action,
  },
};
