import type { Choice, DraftField, SetupIntro } from "./types";

type ChoiceStep = {
  intro: SetupIntro;
  mode: "single" | "multiple";
  /** Draft field of a single choice; multiple choices are stored as the interests list. */
  field?: DraftField;
  choices: Choice[];
};

/** INTERESTS, GOALS, PERSONALITY and COMMUNICATION: selection cards. */
export const choiceSteps = {
  interests: {
    intro: { title: "Your interests", description: "Choose up to five things you enjoy. Shared interests make starting easier." },
    mode: "multiple",
    choices: [
      { value: "photography", icon: "camera-01", title: "Photography", description: "Capture the little moments" },
      { value: "coffee", icon: "coffee-01", title: "Coffee", description: "A good chat over a good cup" },
      { value: "hiking", icon: "location-01", title: "Hiking", description: "Fresh air and a new trail" },
      { value: "art", icon: "paint-board", title: "Art", description: "Museums, galleries and creativity" },
      { value: "live-music", icon: "music-note-01", title: "Live music", description: "One more song, one more memory" },
      { value: "cooking", icon: "coffee-01", title: "Cooking", description: "Good food is better shared" },
      { value: "travel", icon: "location-01", title: "Travel", description: "Make a little room for adventure" },
      { value: "reading", icon: "book-open-01", title: "Reading", description: "A book you can’t put down" },
    ],
  },
  goals: {
    intro: { title: "What are you looking for?", description: "Honest intentions help us suggest more meaningful connections." },
    mode: "single",
    field: "goal",
    choices: [
      // Values are the API `lookingFor` enum.
      { value: "REAL_RELATIONSHIP", icon: "favourite", title: "A real relationship", description: "Ready to build something lasting" },
      { value: "SOMETHING_MEANINGFUL", icon: "shield-01", title: "Something meaningful", description: "Connection with genuine intention" },
      { value: "SEE_WHERE_IT_GOES", icon: "coffee-01", title: "See where it goes", description: "Stay open and get to know someone" },
      { value: "NEW_FRIENDS_FIRST", icon: "user-circle", title: "New friends first", description: "Begin with an easy friendship" },
    ],
  },
  personality: {
    intro: { title: "What feels most like you?", description: "Tell us how you recharge. There’s no right answer." },
    mode: "single",
    field: "personality",
    choices: [
      { value: "quiet", icon: "book-open-01", title: "Quiet time with someone close", description: "Small circles and quality time" },
      { value: "mix", icon: "coffee-01", title: "A mix of people and alone time", description: "A little social, a little recharge" },
      { value: "social", icon: "user-circle", title: "Being out with friends", description: "New energy from being together" },
    ],
  },
  communication: {
    intro: { title: "How do you like to connect?", description: "Help us understand your communication style." },
    mode: "single",
    field: "communication",
    choices: [
      { value: "messages", icon: "book-open-01", title: "Thoughtful messages first", description: "Get comfortable before meeting" },
      { value: "playful", icon: "favourite", title: "A little playful back-and-forth", description: "Let the conversation find its spark" },
      { value: "plan", icon: "location-01", title: "Make a plan, then get to know each other", description: "Prefer a real conversation in person" },
    ],
  },
} satisfies Record<string, ChoiceStep>;

export const interestRules = {
  max: 5,
  note: "Choose up to 5 interests. You can update these later.",
  /** Announced as the selection changes. */
  count: "{count} of {max} selected",
};
