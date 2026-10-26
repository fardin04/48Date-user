import type { Choice } from "./types";

/** PHOTOS and its states PHOTO-SOURCE, PHOTO-PREVIEW, PHOTO-UPLOAD, PHOTO-ERROR and PHOTO-READY. */
export const photosStep = {
  required: 2,
  intro: { title: "Add your photos", description: "Add at least two recent photos. Keep your main photo clear and recognizable." },
  addTile: { title: "Add a photo", description: "Choose a recent, clear photo" },
  photoAlt: ["Your main photo", "Your second photo"],
  note: "Your main photo is shown first. Add at least 2 photos.",
  /** Disabled Continue while photos are missing. */
  missing: { one: "Add 1 more photo", other: "Add {count} more photos" },
  source: {
    intro: { title: "Add a photo", description: "Choose a clear, recent photo that shows you." },
    label: "Photo source",
    choices: [
      { value: "library", icon: "camera-01", title: "Choose from photos", description: "Upload a clear, recent photo" },
      { value: "camera", icon: "camera-01", title: "Take a photo", description: "Use your device camera" },
    ] satisfies Choice[],
    primary: "Choose photos",
    /** Figma has no state for this; shown when a file fails the checks below. */
    invalid: "Choose a JPG, PNG or WebP photo under 10 MB.",
  },
  preview: {
    intro: { title: "Looking good", description: "Check the crop before adding this photo to your profile." },
    alt: "Preview of the photo you chose",
    primary: "Use photo",
    secondary: "Choose another",
  },
  upload: {
    intro: { title: "Adding your photo", description: "Keep this open while your photo finishes uploading." },
    saved: "Your other photos are saved.",
    fileTitle: "Profile photo",
    /** `{percent}` is the live upload progress. */
    progress: "Uploading · {percent}%",
    progressLabel: "Upload progress",
    primary: "Uploading…",
  },
  error: {
    intro: { title: "Your photo didn’t upload", description: "Your other photos are safe. Check your connection and try again." },
    status: "Upload paused · Try again",
    primary: "Retry upload",
    secondary: "Choose another photo",
  },
  ready: {
    intro: { title: "Your photos are ready", description: "Two photos added. You can replace them any time from your profile." },
    title: "Uploaded photos",
    lines: ["Main photo · Ready", "Second photo · Ready"],
    note: "Your main photo is shown first. You can replace either photo later.",
  },
  /** Client-side checks before the (mock) upload. */
  accept: ["image/jpeg", "image/png", "image/webp"],
  maxBytes: 10 * 1024 * 1024,
};

const preview = {
  title: "48Date · Match updates",
  body: "A new connection. A chance to make a plan.",
  caption: "Matches · Invitations · 48-hour reminders",
};

/** NOTIFY and its state NOTIFY-DENIED. */
export const notifyStep = {
  intro: { title: "Don’t miss your moment", description: "Get updates about new matches, invitations and your 48-hour countdown." },
  preview,
  primary: "Enable notifications",
  secondary: "Maybe later",
  denied: {
    intro: { title: "Notifications are off", description: "You can continue now and turn on notifications from your browser settings later." },
    help: "To enable: open browser site settings, find Notifications, then choose Allow.",
    primary: "Continue setup",
  },
};

export const readyStep = {
  intro: { title: "You’re ready to meet", description: "Your profile is ready. Discover someone worth making plans with." },
  /** Shown when the draft has no nickname yet (e.g. a fresh tab). */
  fallbackName: "Your profile",
  photoAlt: "Your main photo",
  line: "Your profile is ready to discover.",
  interestsLabel: "Your interests",
  /** Interest pills shown on the preview card. */
  shownInterests: 2,
  footer: "Be yourself. Start a conversation. Make a real plan.",
  primary: "Start discovering",
};
