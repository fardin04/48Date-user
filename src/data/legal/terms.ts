import type { LegalDocument } from "./types";

/** Draft structure from Figma — not approved legal text (handoff: Content status). */
export const terms: LegalDocument = {
  screen: "L02-TC",
  metaDescription: "Terms for using 48Date, including profiles, matching, conversations and date planning.",
  title: "Terms & Conditions",
  subtitle: "Using 48Date",
  sections: [
    { id: "using-the-platform", title: "Using the platform", body: "These terms describe the use of 48Date, including profile creation, discovery, matching, conversations and date planning." },
    { id: "your-profile-and-content", title: "Your profile and content", body: "Keep your profile accurate and share content you have permission to use. Your profile, photos and messages form part of your experience on the platform." },
    { id: "connections-and-communication", title: "Connections and communication", body: "Matches are mutual. The product displays the applicable match countdown and communication actions. Respect other people’s boundaries and choices." },
    { id: "ai-assisted-features", title: "AI-assisted features", body: "Compatibility suggestions, conversation starters and date ideas support your decisions. Review suggestions before using or sharing them." },
    { id: "membership-and-billing", title: "Membership and billing", body: "Review the selected plan, price, renewal information and cancellation terms before completing a subscription. Payment handling can differ by purchase channel." },
    { id: "community-conduct", title: "Community conduct", body: "Treat others respectfully. Use report and block controls when content or behavior needs attention." },
    { id: "account-controls", title: "Account controls", body: "Review the available account settings, privacy controls and account management options in your profile." },
    { id: "about-these-terms", title: "About these terms", body: "The final published terms will include the service operator, eligibility requirements, effective date and applicable legal provisions." },
  ],
};
