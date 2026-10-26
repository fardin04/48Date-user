import type { LegalDocument } from "./types";

/** Draft structure from Figma — not approved legal text (handoff: Content status). */
export const privacy: LegalDocument = {
  screen: "L03",
  metaDescription: "How 48Date handles your information and the choices you have.",
  title: "Privacy Policy",
  subtitle: "Your information and your choices",
  sections: [
    { id: "information-you-provide", title: "Information you provide", body: "Your profile can include photos, interests, preferences and information you choose to add. Conversations and date planning involve additional information you submit." },
    { id: "how-the-experience-works", title: "How the experience works", body: "Profile and preference information supports discovery and matching. Messages and planning inputs support the features you choose to use." },
    { id: "ai-assisted-experiences", title: "AI-assisted experiences", body: "AI features can use relevant inputs to suggest conversation starters, compatibility context or date ideas. Specific processing and provider disclosures belong in the final policy." },
    { id: "verification-and-payments", title: "Verification and payments", body: "Identity verification and paid plans involve separate processing steps. Relevant data flows and payment provider roles must be described in the approved policy." },
    { id: "your-privacy-controls", title: "Your privacy controls", body: "Review account privacy settings and available account management options. Report and block controls are available in relevant profiles and conversations." },
    { id: "cookies-and-similar-technologies", title: "Cookies and similar technologies", body: "The published policy will identify the technologies used by the web portal and explain any consent or preference controls." },
    { id: "retention-and-requests", title: "Retention and requests", body: "The approved policy will state retention periods, request handling and contact information for privacy enquiries." },
    { id: "about-this-policy", title: "About this policy", body: "The final published policy will identify the service operator, effective date, processing providers and applicable privacy information." },
  ],
};
