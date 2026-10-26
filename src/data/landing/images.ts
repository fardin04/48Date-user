import type { ImageAsset } from "../types";

/** Photography exported from Figma into public/images/landing (rule 15). */
export const images = {
  cafeCouple: { src: "/images/landing/cafe-couple.jpg", alt: "Two people talking over coffee at an outdoor café", width: 760, height: 950 },
  sunsetCouple: { src: "/images/landing/sunset-couple.png", alt: "A couple together at sunset", width: 735, height: 1093 },
  womanPhone: { src: "/images/landing/woman-phone.jpg", alt: "A woman using her phone at a café", width: 1600, height: 1067 },
  maya: { src: "/images/landing/maya.png", alt: "Approved profile portrait of Maya", width: 735, height: 1105 },
  avatar: { src: "/images/landing/avatar.png", alt: "", width: 66, height: 66 },
  map: { src: "/images/landing/map.png", alt: "Map with a suggested date venue", width: 512, height: 512 },
  verifiedMember: { src: "/images/landing/verified-member.jpg", alt: "A verified member profile", width: 736, height: 1104 },
  phoneDiscover: { src: "/images/landing/phone-discover.png", alt: "48Date app discovery screen showing a profile card", width: 552, height: 1152 },
  phoneChat: { src: "/images/landing/phone-chat.png", alt: "48Date app conversation with 42 hours left in the match window", width: 600, height: 1271 },
  phonePlanner: { src: "/images/landing/phone-planner.png", alt: "48Date app date planner suggesting nearby venues", width: 552, height: 1167 },
} satisfies Record<string, ImageAsset>;
