import { to } from "@/lib/routes";
import type { Action, IconName, ImageAsset } from "../types";
import type { Fact, MemberId, MemberLink, StatusSummaryCopy } from "./types";

const planDate: MemberLink = { label: "Plan a date", step: "VENUES" };
const playGame: MemberLink = { label: "Play a game", step: "GAMES" };
const bubble: IconName = "bubble-chat";
const heart: IconName = "favourite";
const shield: IconName = "shield-01";
const game: ImageAsset = { src: "/images/portal/game.webp", alt: "Two pink ice cubes with small hearts", width: 720, height: 480 };

/** A sample conversation (W05 draws every one with GoldenHour; each member here shows one state). */
export type ConversationSample = {
  member: MemberId;
  /** INBOX preview line. */
  preview: string;
  /** What the conversation already holds before the member writes. */
  opening: "firstHello" | "invite" | "agreed" | "incoming";
};

const incoming = "Hey! Your film photos are gorgeous. Where was that last one taken?";
const reply = "Thank you! That’s the bridge at golden hour. Coffee tomorrow?";
const inboxPreview = "Coffee sounds perfect. Tomorrow at 4?";
/** Unread messages in a conversation row (design-silent; for owner approval). */
const unread = "{count} unread";

/** W05 / INBOX and CHAT-EMPTY. */
export const inboxPage = {
  title: "Your conversations",
  description: "A little conversation. A real-world connection.",
  /** `{name}` is the first conversation. */
  open: "Open {name}",
  unread,
  back: { label: "Back", icon: "arrow-left-02", to: to("DISCOVER") } satisfies Action,
  conversations: [
    { member: "goldenhour", preview: inboxPreview, opening: "firstHello" },
    { member: "wildrose", preview: inboxPreview, opening: "invite" },
    { member: "riverstone", preview: inboxPreview, opening: "agreed" },
    { member: "northpeak", preview: inboxPreview, opening: "incoming" },
  ] satisfies ConversationSample[],
  empty: {
    title: "Your conversations start here",
    description: "Match with someone to say hello, play a game or make a plan.",
    summary: { icon: bubble, title: "One hello can start something real", description: "Open a match to send a message or try an icebreaker together." } satisfies StatusSummaryCopy,
    primary: { label: "See my matches", to: to("MATCHES") } satisfies Action,
  },
};

/** W05 / CHAT-01 and every state on the conversation URL. */
export const chatPage = {
  /** Browser tab title: `{name}` is the member. */
  documentTitle: "Chat with {name}",
  listTitle: "Your conversations",
  listLabel: "Conversations",
  unread,
  status: { open: "{hours}h left · Say hello", agreed: "Date agreed · 24 Oct", agreedLive: "Date agreed", plain: "Say hello" },
  caption: { open: "Verified · {hours}h {minutes}m left to agree on a date", agreed: "Verified · Date agreed", plain: "Verified" },
  messagesLabel: "Messages",
  sample: { incoming, reply, replyMeta: "Sent · 2:41 PM" },
  firstHello: {
    title: "Your first hello",
    description: "You both love photography and a good coffee.",
    /** Live conversations: nothing sample-specific (design-silent). */
    liveDescription: "You have 48 hours to say hello and make a plan.",
    body: "Ask about their favorite photograph or start with a quick game.",
    icon: bubble,
  },
  invite: {
    title: "Date invitation",
    description: "Amber & Oak Coffee",
    facts: [
      { label: "When", value: "24 Oct · 4:00 PM" },
      { label: "Where", value: "0.6 km · Public café" },
    ] satisfies Fact[],
  },
  agreed: {
    title: "Your agreed date",
    description: "Amber & Oak Coffee",
    facts: [
      { label: "When", value: "24 Oct · 4:00 PM" },
      { label: "Meeting point", value: "Main entrance · Public café" },
    ] satisfies Fact[],
  },
  suggestions: { title: "A little help with your hello", description: "Inspired by your shared interests.", use: "Use", useLabel: "Use “{text}”" },
  generating: "Generating conversation ideas…",
  aiError: "We couldn’t load suggestions. Your conversation is unaffected.",
  tools: { label: "Conversation tools", ai: "AI help", photo: "Photo", voice: "Voice", safety: "Safety" },
  composer: { label: "Message", placeholder: "Write a message…", send: "Send", maxLength: 1000 },
  /** `{time}` is the local send time: "2:41 PM" today, "Yesterday, 2:41 PM" / "24 Oct, 2:41 PM" before. */
  sent: "Sent · {time}",
  /** Live conversations (design-silent; for owner approval). */
  seen: "Seen · {time}",
  received: "{time}",
  /** Appended to the status line of a message its sender changed. */
  edited: "{meta} · Edited",
  /** A message its sender removed keeps its place without its content. */
  deleted: "Message removed",
  typing: "{name} is typing",
  older: "Show earlier messages",
  voiceLabel: "Voice message from {name}",
  ownVoiceLabel: "Your voice message",
  sending: "Sending…",
  failed: "Not sent · Tap Retry",
  photoMessage: "Photo",
  /** `{duration}` is "00:18". */
  voiceMessage: "Voice message · {duration}",
  actions: {
    start: { primary: "Get a conversation starter", secondary: planDate },
    typed: "Send message",
    sent: { primary: planDate, secondary: playGame },
    failed: { primary: "Retry message", secondary: "Edit message" },
    ai: { primary: "Use this suggestion", secondary: "Try another" },
    starters: { primary: "Use this starter", secondary: "Try another" },
    generating: { primary: "Stop generating", secondary: "Back to conversation" },
    aiError: { primary: "Try again", secondary: "Write my own message" },
    /** Accept confirms the invitation, then opens DATE-CONFIRMED. */
    invite: {
      primary: { label: "Accept invitation", step: "DATE-PENDING" } satisfies MemberLink,
      secondary: { label: "Suggest another time", step: "DATE-TIME" } satisfies MemberLink,
    },
    agreed: {
      primary: { label: "View date details", step: "DATE-PENDING" } satisfies MemberLink,
      secondary: playGame,
    },
  },
  attach: {
    legend: "Choose what you’d like to add to your conversation.",
    options: [
      { value: "game", label: "Play a game" },
      { value: "photo", label: "Photo" },
      { value: "voice", label: "Voice message" },
      { value: "plan", label: "Plan a date" },
    ],
    /** Primary label per choice; Figma draws "Choose a photo". */
    primary: { game: "Play a game", photo: "Choose a photo", voice: "Record a voice message", plan: "Plan a date" },
    game: playGame,
  },
  context: {
    title: "Your connection",
    description: "A shared interest is a good place to start.",
    verified: "Verified member",
    time: "Time to make a plan",
    timeValue: "{hours}h {minutes}m remaining",
    agreedValue: "Date agreed",
    noDeadline: "No deadline",
    enjoy: "You both enjoy",
    enjoyValue: "Photography · Coffee",
    action: planDate,
  },
  /** MSG-01: shown once when a new match's conversation first opens. */
  intro: {
    title: "Start with a little fun?",
    description: "Play This or That with {name}, or jump straight into a conversation.",
    image: game,
    note: "This or That · Quick choices, real preferences.",
    play: { label: "Play game", step: "GAMES" } satisfies MemberLink,
    skip: "Skip to chat",
    close: "Close",
  },
  block: {
    title: "Block {name}?",
    description: "They won’t be able to contact you or see your profile. You can manage blocked members in Settings.",
    icon: shield,
    confirm: "Block member",
    keep: "Keep conversation",
    close: "Close",
  },
  blocked: {
    title: "Member blocked",
    description: "You won’t receive messages from {name}.",
    summary: { icon: shield, title: "Your boundaries are protected", description: "This member can no longer contact you or view your profile." } satisfies StatusSummaryCopy,
    primary: { label: "Back to matches", to: to("MATCHES") } satisfies Action,
    secondary: { label: "Report a concern", step: "REPORT-DETAIL" } satisfies MemberLink,
  },
  photo: {
    title: "Share a photo",
    description: "Preview your photo before sending it to {name}.",
    previewAlt: "Your photo to send",
    caption: "Add a caption",
    captionMax: 200,
    send: "Send photo",
    sending: "Sending…",
    cancel: "Cancel",
    /** Same limits and copy as onboarding photos. */
    invalid: "Choose a JPG, PNG or WebP photo under 10 MB.",
    accept: ["image/jpeg", "image/png", "image/webp"],
    maxBytes: 10 * 1024 * 1024,
  },
  voice: {
    title: "Voice message",
    description: "Record a short hello for {name}. Preview it before sending.",
    icon: heart,
    idle: "Your microphone is used only while you record.",
    recording: "Recording… Tap Stop when you’re done.",
    paused: "Recording paused · Review your message",
    denied: "Microphone access is off. Allow it in your browser settings to record.",
    timerLabel: "{seconds} seconds recorded",
    previewLabel: "Preview your voice message",
    start: "Start recording",
    stop: "Stop recording",
    send: "Send voice message",
    discard: "Discard recording",
    maxSeconds: 60,
  },
};
