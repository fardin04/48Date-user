import { to } from "@/lib/routes";
import type { Action, IconName, ImageAsset } from "../types";
import type { MemberLink, StatusSummaryCopy } from "./types";

const image = (name: string, alt: string, width: number, height: number): ImageAsset => ({ src: `/images/portal/${name}.webp`, alt, width, height });
const heart: IconName = "favourite";
const controller: IconName = "game-controller-03";

/** `noun` fills GAME-RESULT's "You both chose {choice}" for the first question. */
export type GameChoice = { value: string; label: string; noun?: string; image?: ImageAsset };
export type GameQuestion = { prompt: string; choices: [GameChoice, GameChoice] };

/** Keeps each question checked against `GameQuestion` while the list stays typed as one. */
const questionList = (list: GameQuestion[]) => list;

/** W07 / Icebreaker Games. `{name}` is the match, `{round}` / `{total}` the question number. */
export const gamePage = {
  documentTitle: "This or That with {name}",
  name: "This or That",
  intro: {
    title: "Break the ice",
    description: "A few easy choices can turn a first hello into a good conversation.",
    art: image("game", "Two pink ice cubes with small hearts", 720, 480),
    card: { title: "This or That", description: "Quick choices. Real preferences." },
    body: "Learn a little about each other before your first date.",
    primary: "Play This or That",
  },
  question: {
    description: "Question {round} of {total} · Pick what feels most like you.",
    prompt: "Question {round} of {total} · {prompt}",
    legend: "Your choice",
    next: "Next question",
    leave: "Leave game",
  },
  wait: {
    title: "Your choice is in",
    description: "Waiting for {name} to answer. Your choice stays hidden until you both choose.",
    waiting: "Your choice is saved. Waiting for {name}…",
    /** Design-silent: once the match has answered. */
    answered: "{name} answered. You’ll see how you compare at the end.",
    next: "Next question",
    results: "Continue to results",
    chat: "Back to chat",
  },
  result: {
    title: "You’ve found common ground",
    /** When the first answers match ("You both chose coffee."); otherwise the general line. */
    matched: "You both chose {choice}. That sounds like a good place to start.",
    general: "You have a few choices in common. That’s a good place to start.",
    art: image("game", "Two pink ice cubes with small hearts", 720, 480),
    card: { title: "{count} answers in common", description: "Keep the conversation going." },
    body: "Photography, coffee, spontaneous walks — you already have a few things to talk about.",
    primary: { label: "Talk about your answers", step: "CHAT-01" } satisfies MemberLink,
    secondary: { label: "Plan a coffee date", step: "VENUES" } satisfies MemberLink,
  },
  leave: {
    title: "Leave this game?",
    description: "You can keep talking even if you don’t finish the game.",
    icon: controller,
    confirm: { label: "Leave game", step: "CHAT-01" } satisfies MemberLink,
    keep: "Keep playing",
    close: "Close",
  },
  left: {
    title: "{name} left the game",
    description: "You can keep chatting or start another game together.",
    summary: { icon: heart, title: "Your conversation is still here", description: "Return to chat or invite your match to play again." } satisfies StatusSummaryCopy,
    primary: { label: "Back to chat", step: "CHAT-01" } satisfies MemberLink,
    again: "Play again",
  },
  context: {
    title: "Play, then keep talking",
    description: "Quick choices can lead to a real conversation.",
    art: image("game", "", 720, 480),
    playing: "Playing with",
    game: "Game",
    round: "Round",
    roundValue: "{round} of {total}",
    chat: { label: "Open conversation", step: "CHAT-01" } satisfies MemberLink,
  },
  back: { label: "Back", icon: "arrow-left-02", to: to("INBOX") } satisfies Action,
  /** Figma draws question 1; the other nine are a starter list for owner approval. */
  questions: questionList([
    {
      prompt: "Coffee or dinner?",
      choices: [
        { value: "coffee", label: "Coffee date", noun: "coffee", image: image("coffee", "A pink cup of latte with heart art", 406, 240) },
        { value: "dinner", label: "Fancy dinner", noun: "dinner", image: image("dinner", "A plated steak dinner", 326, 240) },
      ],
    },
    { prompt: "Sunrise or sunset?", choices: [{ value: "sunrise", label: "Sunrise walk" }, { value: "sunset", label: "Sunset view" }] },
    { prompt: "Film or digital?", choices: [{ value: "film", label: "Film camera" }, { value: "digital", label: "Phone photos" }] },
    { prompt: "City or nature?", choices: [{ value: "city", label: "City streets" }, { value: "nature", label: "Nature trail" }] },
    { prompt: "Plan or wing it?", choices: [{ value: "plan", label: "Make a plan" }, { value: "wing", label: "See what happens" }] },
    { prompt: "Books or podcasts?", choices: [{ value: "books", label: "A good book" }, { value: "podcasts", label: "A good podcast" }] },
    { prompt: "Sweet or savoury?", choices: [{ value: "sweet", label: "Something sweet" }, { value: "savoury", label: "Something savoury" }] },
    { prompt: "Texts or calls?", choices: [{ value: "texts", label: "Thoughtful texts" }, { value: "calls", label: "A quick call" }] },
    { prompt: "Museum or market?", choices: [{ value: "museum", label: "Museum afternoon" }, { value: "market", label: "Weekend market" }] },
    { prompt: "Early bird or night owl?", choices: [{ value: "early", label: "Early bird" }, { value: "night", label: "Night owl" }] },
  ]),
};
