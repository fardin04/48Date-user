import { to, toItem } from "@/lib/routes";
import type { SelectOption } from "../onboarding/types";
import type { Action, IconName, ImageAsset } from "../types";
import { memberAvatar } from "./members";
import type { Fact, StatusSummaryCopy } from "./types";

const shield: IconName = "shield-01";
const user: IconName = "user-circle";
const heart: IconName = "favourite";
const back = (screen: Parameters<typeof to>[0]): Action => ({ label: "Back", icon: "arrow-left-02", to: to(screen) });
const backToSettings: Action = { label: "Back to settings", to: to("SETTINGS") };

/** The member's editable public details (sample: CityLights). */
export type PublicProfile = {
  nickname: string;
  occupation: string;
  education: string;
  lookingFor: string;
  bio: string;
  interests: string[];
};

/** The member's own profile as PROFILE shows it (display-ready values). */
export type ProfileOverview = {
  nickname: string;
  age: number | null;
  /** Approximate area ("Dhaka"), or null to use the area chosen in onboarding. */
  area: string | null;
  bio: string;
  interests: string[];
  /** "About me", in Figma order. */
  facts: Fact[];
  /** Main photo URL, or null for the sample photo. */
  photoUrl: string | null;
  /** "4.9 Excellent". */
  trust: string;
  /** "92% complete" value, or null when unknown. */
  completeness: number | null;
};

/** TRUST: the score card and its three signals. */
export type TrustSummary = { title: string; verification: string | null; dates: string; feedback: string };

/** A profile photo already stored (`fileId`) or a new file to upload, in display order (main first). */
export type ProfilePhoto = { fileId?: string; url: string; file?: File };

/** Private account details: never shown on the public profile. */
export type AccountDetails = { privateName: string; phone: string; email: string };

/** The API's notification categories (Postman `06 Get Notification Settings`); `account` is permanent and not shown. */
export const notificationKeys = ["matches", "messages", "dates", "games", "announcements"] as const;
export type NotificationKey = (typeof notificationKeys)[number];
export type NotificationPrefs = Record<NotificationKey, boolean>;

export const reportReasons = ["messages", "fake", "noShow", "money", "other"] as const;
export type ReportReason = (typeof reportReasons)[number];

/** One settings / privacy row: opens a screen, or (Log out) a dialog. */
export type SettingsLink = { label: string; to: Action["to"] };

/** W09 / Profile, Trust & Safety (sample content, not production records). */
/** A moderation warning the member must acknowledge before continuing (D-153; design-silent copy). */
export const warningCopy = {
  title: "A note from 48Date safety",
  acknowledge: "I understand",
  acknowledging: "Saving…",
  close: "Close",
  guidelines: { label: "Read the community guidelines", to: to("L02-TC", "community-conduct") } satisfies Action,
};

/** ACCOUNT "Sign-in methods" (Auth 06–11; design-silent, for owner approval). */
export const signInMethodsCopy = {
  title: "Sign-in methods",
  description: "Choose how you sign in. Keep at least one.",
  phone: "Phone",
  google: "Google",
  notLinked: "Not linked",
  remove: "Remove",
  removing: "Removing…",
  linkPhone: "Link a phone number",
  phoneField: "Phone number with country code",
  phonePlaceholder: "+8801811000001",
  phoneInvalid: "Enter the number with its country code, like +8801811000001.",
  sendCode: "Send code",
  sending: "Sending…",
  code: "Six-digit code",
  confirm: "Link phone",
  confirming: "Linking…",
  cancel: "Cancel",
  failed: "That didn’t go through. Try again.",
};

export const accountPage = {
  documentTitles: {
    profile: "Your profile",
    edit: "Make it you",
    photos: "Your profile photos",
    trust: "Your Trust Score",
    trustHistory: "Your trust activity",
    trustHelp: "Request a trust review",
    settings: "Your settings",
    account: "Account information",
    notifyPrefs: "Stay in the loop",
    privacy: "Privacy & safety",
    blocked: "Blocked members",
    delete: "Delete your account?",
    notifications: "Your notifications",
    report: "Tell us about your concern",
  },
  /** Sample values until a profile API exists. */
  defaults: {
    profile: {
      nickname: "CityLights",
      occupation: "Product designer",
      education: "Bachelor of Arts",
      lookingFor: "A real relationship",
      bio: "A curious mind, a camera roll full of sunsets, and a good reason to get out of the group chat. Let’s make a real plan.",
      interests: ["Photography", "Hiking", "Coffee", "Art"],
    } satisfies PublicProfile,
    account: { privateName: "", phone: "", email: "" } satisfies AccountDetails,
    notifications: { matches: true, messages: true, dates: true, games: true, announcements: true } satisfies NotificationPrefs,
    age: 28,
  },
  photo: { ...memberAvatar, alt: "Your main profile photo" } satisfies ImageAsset,
  /** `{name}, {age}`. */
  headline: "{name}, {age}",
  profile: {
    title: "Your profile",
    description: "A preview of what your connections can see.",
    edit: { label: "Edit profile", to: to("PROFILE-EDIT") } satisfies Action,
    settings: { label: "Settings", to: to("SETTINGS") } satisfies Action,
    verified: "Verified profile",
    pending: "Verification pending",
    trust: { label: "Trust Score", value: "4.9 Excellent", to: to("TRUST") },
    managePhotos: { label: "Manage photos", to: to("PHOTO-MANAGE") } satisfies Action,
    completeVerification: { label: "Complete verification", to: to("VERIFY-INTRO") } satisfies Action,
    bioTitle: "My bio",
    interestsLabel: "Interests",
    about: { title: "About me", description: "Profile details shared by this member." },
    /** "About me" facts that are not edited on PROFILE-EDIT. */
    facts: {
      height: { label: "Height", value: "165 cm" },
      weight: { label: "Weight", value: "55 kg" },
      smoking: { label: "Smoking", value: "Doesn’t smoke" },
      alcohol: { label: "Alcohol", value: "Occasionally" },
      children: { label: "Children", value: "Doesn’t have children" },
      family: { label: "Family plans", value: "Open to children" },
      religion: { label: "Religion", value: "Prefer not to say" },
      languages: { label: "Languages", value: "English · Hindi" },
    } satisfies Record<string, Fact>,
    labels: { occupation: "Occupation", education: "Education", lookingFor: "Looking for", location: "Location" },
    /** `{location}` is the member's approximate area. */
    place: "{location}, US",
    /** Values the API sends as booleans or numbers (`GET /users/me`). */
    values: {
      hasKids: "Has children",
      noKids: "Doesn’t have children",
      wantsKids: "Open to children",
      noWantsKids: "Doesn’t want children",
      height: "{value} cm",
      weight: "{value} kg",
      missing: "—",
    },
    /** `{value} {label}` ("4.9 Excellent"). */
    trustValue: "{value} {label}",
    loadFailed: "We couldn’t load your profile. Check your connection and try again.",
    /** Any other portal view (design-silent). */
    loadFailedView: "We couldn’t load this page. Check your connection and try again.",
    retry: "Try again",
  },
  /** "Flow support / Profile". */
  context: {
    title: "Your profile at a glance",
    description: "Your private details stay off your public profile.",
    /** Sample until the profile API reports completeness. */
    completeness: { label: "Profile completeness", value: "92% complete" },
    /** With the API: `{percent}% complete` from `profileCompletenessPercent`. */
    completenessValue: "{percent}% complete",
    trust: { label: "Trust Score", value: "4.9 Excellent" },
    preview: { label: "Preview my profile", to: to("PROFILE") } satisfies Action,
  },
  edit: {
    back: back("PROFILE"),
    title: "Make it you",
    description: "Update the details people see on your profile.",
    fields: { nickname: "Public nickname", occupation: "Occupation", education: "Education", lookingFor: "Looking for", bio: "Bio" },
    interests: { title: "Interests", description: "Choose the things you enjoy. You can select more than one." },
    interestOptions: ["Photography", "Hiking", "Coffee", "Art", "Travel", "Cooking"],
    /** Starter lists for owner approval. */
    educationOptions: ["High school", "Bachelor of Arts", "Bachelor of Science", "Master’s degree", "Doctorate", "Prefer not to say"].map(
      (label) => ({ value: label, label }),
    ) satisfies SelectOption[],
    lookingForOptions: ["A real relationship", "Something casual", "New friends", "Still figuring it out"].map((label) => ({
      value: label,
      label,
    })) satisfies SelectOption[],
    limits: { nickname: 20, occupation: 60, bio: 300 },
    /** Validation copy is design-silent. */
    errors: {
      nickname: "Use 3–20 letters, numbers or underscores.",
      occupation: "Please check this value and try again.",
      bio: "Write a short bio (at least 10 characters).",
      interests: "Choose at least one interest.",
    },
    save: "Save changes",
    saving: "Saving…",
    managePhotos: { label: "Manage photos", to: to("PHOTO-MANAGE") } satisfies Action,
  },
  saved: {
    title: "Your changes are saved",
    description: "Your updated profile is ready for your next connection.",
    /** `{name}` is the nickname. */
    summary: { icon: user, title: "{name} · Profile updated", description: "Your public details are saved. Preview your profile before your next connection." } satisfies StatusSummaryCopy,
    primary: { label: "View my profile", to: to("PROFILE") } satisfies Action,
  },
  photos: {
    back: back("PROFILE-EDIT"),
    title: "Your profile photos",
    description: "Choose a main photo, replace a photo or add another.",
    slots: 3,
    add: { title: "Add photo", description: "Recent and clear", upload: "Upload" },
    main: "Main photo",
    makeMain: "Make main",
    replace: "Replace",
    /** `{number}` is the photo's position. */
    alt: "Your profile photo {number}",
    accept: ["image/jpeg", "image/png", "image/webp"],
    maxBytes: 10 * 1024 * 1024,
    rejected: "Choose a JPG, PNG or WebP photo under 10 MB.",
    save: "Save photos",
    saving: "Saving…",
    addPhoto: "Add photo",
  },
  trust: {
    back: back("PROFILE"),
    title: "Your Trust Score",
    description: "Built through reliable, respectful behavior.",
    card: {
      title: "4.9 Trust Score",
      description: "Reliability built through your actions.",
      body: "Showing up, verifying your profile and treating people respectfully help build trust. Pending or disputed events are reviewed.",
    },
    rows: { verification: "Profile verification", dates: "Attended dates", feedback: "Respectful feedback" },
    values: { dates: "3 confirmed", feedback: "Positive" },
    /** With the API: `{value} Trust Score`, `{count} confirmed`, the rating item's title or "No ratings yet". */
    live: {
      cardTitle: "{value} Trust Score",
      dates: "{count} confirmed",
      noFeedback: "No ratings yet",
      /** Trust activity value: `{change} · {date}` ("+0.5 · 24 Oct"). */
      event: "{change} · {date}",
      reversed: "Reversed",
    },
    /** Profile verification value by review status. */
    verification: { verified: "Verified", pending: "In review", none: "Not verified" },
    primary: { label: "View trust activity", to: to("TRUST-HISTORY") } satisfies Action,
  },
  trustHistory: {
    back: back("TRUST"),
    title: "Your trust activity",
    description: "A record of reliable, respectful behavior.",
    note: "Pending or disputed attendance is reviewed before a final adjustment.",
    /** Design-silent: no events yet. */
    empty: "No trust activity yet. Verifying your profile and attending dates will show here.",
    events: [
      { label: "Profile verification", value: "Verified · 12 Oct" },
      { label: "Date with RiverStone", value: "Both confirmed · 15 Oct" },
      { label: "Date with NorthPeak", value: "Both confirmed · 8 Oct" },
      { label: "Date with GoldenHour", value: "Awaiting confirmation" },
    ] satisfies Fact[],
    primary: { label: "Question an event", to: to("TRUST-HELP") } satisfies Action,
    secondary: { label: "Back to Trust Score", to: to("TRUST") } satisfies Action,
  },
  trustHelp: {
    back: back("TRUST-HISTORY"),
    title: "Request a trust review",
    description: "Tell us which event needs attention and why.",
    fields: { event: "Event", explanation: "Your explanation" },
    placeholders: { event: "Choose an event", explanation: "What should our team know?" },
    limits: { explanation: 500, explanationMin: 20 },
    errors: { event: "Choose the event to review.", explanation: "Explain what happened (at least 20 characters)." },
    submit: "Submit review request",
    submitting: "Sending…",
    failed: "We couldn’t send your request. Check your connection and try again.",
    done: {
      title: "Review requested",
      description: "Your explanation has been sent to our team.",
      summary: { icon: shield, title: "Your request is in the review queue", description: "You can follow updates in your trust activity." } satisfies StatusSummaryCopy,
      primary: { label: "Back to trust activity", to: to("TRUST-HISTORY") } satisfies Action,
    },
  },
  settings: {
    back: back("PROFILE"),
    title: "Your settings",
    description: "Your account, your preferences, your control.",
    open: "Open",
    links: [
      { label: "Account information", to: to("ACCOUNT") },
      { label: "Your verification", to: to("VERIFY-INTRO") },
      { label: "Matching preferences", to: to("FILTERS") },
      { label: "Notifications", to: to("NOTIFY-PREFS") },
      { label: "Privacy & safety", to: to("PRIVACY") },
      { label: "Blocked members", to: to("BLOCKED") },
      { label: "Membership", to: to("MEMBERSHIP") },
      { label: "Delete account", to: to("DELETE-ACCOUNT") },
    ] satisfies SettingsLink[],
    signOut: "Log out",
    primary: { label: "Back to profile", to: to("PROFILE") } satisfies Action,
    dialog: {
      title: "Log out of 48Date?",
      description: "Your profile and conversations will be here when you return.",
      confirm: "Log out",
      busy: "Logging out…",
      keep: "Stay signed in",
      close: "Close",
    },
  },
  account: {
    back: back("SETTINGS"),
    title: "Account information",
    description: "Private account details are only used for your account and verification.",
    fields: { privateName: "Private name", phone: "Mobile number", email: "Email address" },
    placeholders: { privateName: "Your full name", phone: "+1 415 555 0134", email: "name@example.com" },
    limits: { privateName: 80, phone: 20, email: 254 },
    errors: {
      privateName: "Enter your name as it appears on your ID.",
      phone: "Enter a mobile number with its country code.",
      email: "Enter an email address like name@example.com.",
    },
    save: "Save account details",
    saving: "Saving…",
    failed: "We couldn’t save your details. Check your connection and try again.",
    /** The API has no endpoint to change private details yet (design-silent). */
    unavailable: "Changing your private details isn’t available yet.",
  },
  notifyPrefs: {
    back: back("SETTINGS"),
    title: "Stay in the loop",
    description: "Choose which updates you’d like to receive.",
    // One row per API category: expiry reminders ride on matches, date reminders on dates.
    options: { matches: "New matches & expiry reminders", messages: "Messages", dates: "Date invitations & reminders", games: "Games", announcements: "Community updates" } satisfies Record<
      NotificationKey,
      string
    >,
    save: "Save preferences",
    saving: "Saving…",
    help: "Device permission help",
    denied: {
      title: "Notifications are off on this device",
      description: "Your in-app preferences are saved. Enable device permission to receive push alerts.",
      summary: { icon: "notification-02", title: "Your preferences are still saved", description: "Allow notifications in your browser settings, then return here to check again." } satisfies StatusSummaryCopy,
      primary: "Open device settings",
      secondary: { label: "Continue without push", to: to("NOTIFICATIONS") } satisfies Action,
    },
    saved: {
      title: "Preferences saved",
      description: "You’re in control of the updates you receive.",
      summary: { icon: heart, title: "Notification preferences updated", description: "You can change your choices at any time in Settings." } satisfies StatusSummaryCopy,
      primary: backToSettings,
    },
  },
  privacy: {
    back: back("SETTINGS"),
    title: "Privacy & safety",
    description: "Decide how you share and connect.",
    note: "Only your nickname is public. Be mindful of photos or messages that reveal your identity.",
    links: [
      { label: "Blocked members", to: to("BLOCKED") },
      { label: "Report a member", to: to("REPORT-DETAIL") },
      { label: "How verification works", to: to("VERIFY-INTRO") },
      { label: "Your private account details", to: to("ACCOUNT") },
    ] satisfies SettingsLink[],
    primary: backToSettings,
  },
  blocked: {
    back: back("SETTINGS"),
    title: "Blocked members",
    description: "Blocked members can’t contact you or see your profile.",
    status: "Blocked",
    /** `{name}` is the member. */
    unblock: "Unblock {name}",
    dialog: {
      title: "Unblock {name}?",
      description: "They may be able to see your profile again. Unblocking doesn’t restore an old match.",
      confirm: "Unblock member",
      busy: "Unblocking…",
      keep: "Keep blocked",
      close: "Close",
    },
    empty: {
      title: "No blocked members",
      description: "Members you block will appear here.",
      summary: { icon: shield, title: "You’re in control of who can reach you", description: "Members you block will appear here so you can manage them later." } satisfies StatusSummaryCopy,
      primary: backToSettings,
    },
  },
  deletion: {
    back: back("SETTINGS"),
    title: "Delete your account?",
    description: "This removes your profile from discovery. Review the account-removal policy before continuing.",
    confirm: "I understand this affects my profile and matches",
    required: "Confirm that you understand before continuing.",
    submit: "Request account deletion",
    submitting: "Sending request…",
    failed: "We couldn’t send your request. Check your connection and try again.",
    keep: { label: "Keep my account", to: to("SETTINGS") } satisfies Action,
    done: {
      title: "Account deletion requested",
      description: "You’ve been signed out. Your profile is no longer shown in discovery.",
      summary: { icon: user, title: "Deletion request received", description: "You’ll be signed out. Follow the account notice for any next steps." } satisfies StatusSummaryCopy,
      primary: { label: "Back to welcome", to: to("WELCOME") } satisfies Action,
    },
  },
  notifications: {
    back: back("DISCOVER"),
    title: "Your notifications",
    description: "Stay close to the moments that matter.",
    /** An empty inbox (design-silent; for owner approval). */
    empty: "Nothing new yet. We’ll let you know when something happens.",
    items: [
      { title: "A new connection", description: "GoldenHour liked you back.", to: toItem("CHAT-01", "goldenhour") },
      { title: "Your date is tomorrow", description: "Amber & Oak Coffee · 4:00 PM", to: toItem("DATE-PENDING", "riverstone") },
      { title: "A match expires soon", description: "Make a plan with WildRose.", to: toItem("MATCH-EXPIRING", "wildrose") },
    ],
    primary: { label: "Notification preferences", to: to("NOTIFY-PREFS") } satisfies Action,
  },
  report: {
    back: back("PRIVACY"),
    title: "Tell us about your concern",
    description: "Your report won’t be shown to the member you’re reporting.",
    fields: { reason: "Reason", details: "What happened?" },
    placeholders: { reason: "Choose a reason", details: "Share what happened. Avoid sharing contact details." },
    // The API keeps up to 500 characters (`POST /reports`).
    limits: { details: 500, detailsMin: 10 },
    errors: { reason: "Choose a reason for your report.", details: "Tell us what happened (at least 10 characters)." },
    reasons: { messages: "Inappropriate messages", fake: "Fake profile", noShow: "No-show", money: "Asked for money", other: "Something else" } satisfies Record<
      ReportReason,
      string
    >,
    dialog: { title: "Choose a report reason", description: "Your report is confidential.", confirm: "Continue", close: "Close" },
    submit: "Submit report",
    submitting: "Sending…",
    failed: "We couldn’t send your report. Check your connection and try again.",
    /** Reports name a member (API): from Privacy & safety there is no one chosen yet (design-silent). */
    chooseMember: "To report someone, open their profile or your conversation with them and choose Report.",
    cancel: "Cancel",
    done: {
      title: "Your report has been received",
      description: "Our team will review the information. You can also block the member now.",
      summary: { icon: shield, title: "Your report is private", description: "Our team will review your concern. The member won’t see who submitted it." } satisfies StatusSummaryCopy,
      block: "Block this member",
      secondary: { label: "Back to matches", to: to("MATCHES") } satisfies Action,
    },
  },
  offline: {
    title: "You’re offline",
    description: "We’ll reconnect when you’re back online. Your unsent work stays here.",
    summary: { icon: "bubble-chat", title: "Check your connection", description: "Reconnect to the internet, then try loading this page again." } satisfies StatusSummaryCopy,
    retry: "Try again",
    checking: "Checking…",
  },
  error: {
    title: "Something didn’t load",
    description: "Try again in a moment. Your account and saved information are unaffected.",
    summary: { icon: heart, title: "You can try again", description: "Reload this page to continue where you left off." } satisfies StatusSummaryCopy,
    retry: "Try again",
    secondary: backToSettings,
  },
};
