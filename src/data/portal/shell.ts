import { to } from "@/lib/routes";
import type { Action } from "../types";
import type { NavItem } from "./types";

/** "48Date / Web Header" and the shared workspace furniture of the member portal. */
export const portalShell = {
  homeLabel: "48Date discovery",
  navLabel: "Member portal",
  nav: [
    { label: "Discover", icon: "flowbite-fire-solid", to: to("DISCOVER") },
    { label: "Matches", icon: "mingcute-love-fill", to: to("MATCHES") },
    { label: "Chats", icon: "mdi-chat", to: to("INBOX") },
    { label: "Stories", icon: "material-auto-stories", to: to("STORIES") },
  ] satisfies NavItem[],
  notifications: { label: "Notifications", icon: "tabler-bell-filled", to: to("NOTIFICATIONS") } satisfies Action,
  profile: { label: "Your profile", to: to("PROFILE") } satisfies Action,
  back: { label: "Back", icon: "arrow-left-02", to: to("DISCOVER") } satisfies Action,
  /** "48Date / Web / Flow context" (Flow=Discovery). */
  flowContext: {
    title: "Your discovery preferences",
    description: "Find people who fit your everyday life.",
    action: { label: "Adjust preferences", to: to("FILTERS") } satisfies Action,
  },
  /** Labels for the live preference facts. */
  preferenceLabels: { location: "Location", distance: "Distance", ageRange: "Age range", interestedIn: "Interested in", verification: "Profile verification" },
  /** `{min}–{max}`. */
  ageRange: "{min}–{max}",
  /** "Profile verification" values; Figma draws only the first ("All profiles" is for owner approval). */
  verification: { on: "Verified profiles only", off: "All profiles" },
  /** Sample area until the member's own area is known (W04 shows San Francisco). */
  defaultLocation: "San Francisco",
};
