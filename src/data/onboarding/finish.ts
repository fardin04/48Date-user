import type { Choice } from "./types";

/** PHOTOS and its states PHOTO-SOURCE, PHOTO-PREVIEW, PHOTO-UPLOAD, PHOTO-ERROR and PHOTO-READY. */
export const photosStep = {
  required: 2,
  /** Most photos a profile keeps (design-silent limit, for owner approval). */
  max: 6,
  intro: { title: "Add your photos", description: "Add at least two recent photos. Keep your main photo clear and recognizable." },
  addTile: { title: "Add a photo", description: "Choose a recent, clear photo" },
  /** `{number}` is the photo's place in the grid. */
  photoAlt: { main: "Your main photo", other: "Your photo {number}" },
  note: "Your main photo is shown first. Add at least 2 photos.",
  /** Grid actions under each photo (design-silent, for owner approval). */
  grid: { label: "Your photos", main: "Main photo", makeMain: "Make main", remove: "Remove" },
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
    /** Primary while "Take a photo" is selected (design-silent). */
    cameraPrimary: "Open camera",
    /** Figma has no state for this; shown when a file fails the checks below. */
    invalid: "Choose a JPG, PNG or WebP photo under 10 MB.",
  },
  /** The camera view behind "Take a photo" (design-silent copy, for owner approval). */
  camera: {
    intro: { title: "Take a photo", description: "Face the camera in good light, then take your photo." },
    videoLabel: "Camera preview",
    primary: "Take photo",
    fileName: "photo.jpg",
    failed: "We couldn’t open your camera. Allow camera access in your browser, or choose from your photos.",
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
    /** `{count}` is the number of photos added. */
    intro: { title: "Your photos are ready", description: "{count} photos added. Choose your main photo, or add more." },
    note: "Your main photo is shown first. You can change your photos later from your profile.",
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
  intro: { title: "You’re ready to meet", description: "Your profile is ready. We’re finding your first matches now." },
  /** Shown when the draft has no nickname yet (e.g. a fresh tab). */
  fallbackName: "Your profile",
  photoAlt: "Your main photo",
  line: "Your profile is ready to discover.",
  interestsLabel: "Your interests",
  /** Interest pills shown on the preview card. */
  shownInterests: 2,
  footer: "Be yourself. Start a conversation. Make a real plan.",
  /** Opens MATCHES (design-silent, for owner approval; Figma's "Start discovering" opened DISCOVER). */
  primary: "See my matches",
};
