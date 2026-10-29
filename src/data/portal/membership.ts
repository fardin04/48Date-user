import { to } from "@/lib/routes";
import type { Action, IconName, ImageAsset } from "../types";
import type { Fact, StatusSummaryCopy } from "./types";

const heart: IconName = "favourite";
const clock: IconName = "clock-01";
const back = (screen: Parameters<typeof to>[0]): Action => ({ label: "Back", icon: "arrow-left-02", to: to(screen) });
const toPlans: Action = { label: "Back to plans", to: to("PLANS") };

export const planIds = ["weekly", "monthly", "yearly"] as const;
export type PlanId = (typeof planIds)[number];

/** A Premium billing period (draft sample prices, handoff: "Prices and free quotas are draft sample values"). */
export type Plan = {
  id: PlanId;
  name: string;
  /** Large price on the plan card ("$8.33/mo" for yearly). */
  headline: string;
  billing: string;
  /** What is charged today and at each renewal. */
  price: string;
  /** "/ month" on PAY-REVIEW, "USD / month" on PAY-PROVIDER. */
  period: string;
  renewalDays: number;
  choose: string;
  /** PAY-PROCESS summary title for this plan. */
  confirming: string;
};

export const plans: Plan[] = [
  { id: "weekly", name: "Weekly", headline: "$9.99", billing: "Billed weekly", price: "$9.99", period: "week", renewalDays: 7, choose: "Choose Weekly", confirming: "Confirming your weekly membership" },
  { id: "monthly", name: "Monthly", headline: "$24.99", billing: "Billed monthly", price: "$24.99", period: "month", renewalDays: 30, choose: "Choose Monthly", confirming: "Waiting for payment confirmation" },
  { id: "yearly", name: "Yearly", headline: "$8.33/mo", billing: "$99.99 billed yearly", price: "$99.99", period: "year", renewalDays: 365, choose: "Choose Yearly", confirming: "Confirming your yearly membership" },
];

/** W10 / Membership & Payments (sample content, not production records). */
export const membershipPage = {
  documentTitles: {
    membership: "Your membership",
    plans: "Make more room for connection",
    checkout: "Review your membership",
    restore: "Restore a purchase",
    manage: "Manage your subscription",
    limit: "Make room for another hello",
  },
  /** The free plan's new conversations per week (draft sample quota). */
  freeConversations: 1,
  /** The monthly plan is the one "Continue with monthly" picks and the card drawn highlighted. */
  featured: "monthly" satisfies PlanId,
  features: ["Unlimited chats & dates", "AI conversation help", "Advanced preferences", "More room for connection"],
  /** "Flow support / Membership". */
  context: {
    title: "More room for connection",
    description: "Choose a billing period that works for you.",
    photo: { src: "/images/portal/story.webp", alt: "", width: 735, height: 1093 } satisfies ImageAsset,
    facts: [
      { label: "Included", value: "Unlimited chats & dates" },
      { label: "Personalize discovery", value: "Advanced preferences" },
      { label: "Help when you need it", value: "AI conversation help" },
    ] satisfies Fact[],
    action: { label: "Compare plans", to: to("PLANS") } satisfies Action,
  },
  plans: {
    back: back("MEMBERSHIP"),
    title: "Make more room for connection",
    description: "Premium gives you more freedom to turn matches into real dates.",
    featuresLabel: "Included with {plan}",
    continue: "Continue with monthly",
    restore: { label: "Restore purchase", to: to("PAY-RESTORE") } satisfies Action,
  },
  quota: {
    back: back("INBOX"),
    title: "Make room for another hello",
    description: "You’ve used the conversations included with your free membership for this period.",
    summary: { icon: "bubble-chat", title: "Your current connections stay available", description: "Review membership options or continue with your existing matches." } satisfies StatusSummaryCopy,
    primary: { label: "Explore Premium", to: to("PLANS") } satisfies Action,
    secondary: "Keep my current conversation",
  },
  review: {
    title: "Review your membership",
    description: "More freedom to chat, plan and meet.",
    rows: { product: "48Date Premium", today: "Billed today", renewal: "Renewal" },
    /** `{price}` USD, `{price} / {period}`. */
    today: "{price} USD",
    renewal: "{price} / {period}",
    agree: "I agree to the subscription terms and renewal",
    agreeRequired: "Agree to the subscription terms to continue.",
    primary: "Continue to payment",
    secondary: { label: "Choose a different plan", to: to("PLANS") } satisfies Action,
  },
  provider: {
    title: "Complete your purchase",
    description: "Your secure payment provider opens next. Confirm your purchase there.",
    note: "Payment details are handled by the payment provider.",
    row: "Premium membership",
    price: "{price} USD / {period}",
    /** `Pay {price}`. */
    pay: "Pay {price}",
    cancel: "Cancel",
  },
  process: {
    title: "Confirming your membership",
    description: "We’re waiting for the payment confirmation. Your membership updates once it succeeds.",
    note: "Keep this page open. Your membership updates after payment is confirmed.",
    weeklyNote: "Keep this page open while the payment provider confirms your purchase.",
    icon: clock,
    busy: "Processing…",
  },
  done: {
    title: "You’re now Premium",
    description: "Unlimited conversations and date planning are ready for you.",
    /** `{plan} Premium · {price}` / `Billed {billing}…`. */
    summaryTitle: "{plan} Premium · {price}",
    summaryDescription: "{billing}. View your membership to manage renewal.",
    icon: heart,
    primary: { label: "View my membership", to: to("MEMBERSHIP") } satisfies Action,
    secondary: { label: "Back to matches", to: to("MATCHES") } satisfies Action,
  },
  error: {
    title: "Your purchase didn’t complete",
    description: "Premium hasn’t been activated. Check your payment method or try again.",
    summary: { icon: heart, title: "Premium hasn’t been activated", description: "Check your payment status before retrying to avoid a duplicate purchase." } satisfies StatusSummaryCopy,
    primary: "Try payment again",
    secondary: toPlans,
  },
  restore: {
    back: back("PLANS"),
    title: "Restore a purchase",
    description: "Sign in with the account used for your original purchase. We’ll check for an active membership.",
    summary: { icon: "user-circle", title: "Find a previous purchase", description: "Continue with the account used for your original purchase." } satisfies StatusSummaryCopy,
    primary: "Check my purchase",
    busy: "Checking…",
    secondary: toPlans,
    none: {
      title: "No active purchase found",
      description: "Check that you are using the account that made the purchase.",
      summary: { icon: heart, title: "No membership was restored", description: "Check the account used for the purchase or review available plans." } satisfies StatusSummaryCopy,
      primary: { label: "View plans", to: to("PLANS") } satisfies Action,
      secondary: "Try again",
    },
  },
  membership: {
    back: back("PROFILE"),
    title: "Your Premium membership",
    description: "More room to make meaningful connections.",
    active: "Active",
    renewalOff: "Renewal off",
    rows: { plan: "Plan", renews: "Next renewal", endsOn: "Access through", price: "Renewal price" },
    /** `Premium · {plan}`, `{price} USD`. */
    plan: "Premium · {plan}",
    price: "{price} USD",
    primary: { label: "Manage subscription", to: to("PAY-CANCEL") } satisfies Action,
    secondary: { label: "Back to profile", to: to("PROFILE") } satisfies Action,
    free: {
      title: "Your free membership",
      description: "Upgrade when you want more room to chat and plan dates.",
      rows: { plan: "Plan", conversations: "Weekly conversations", premium: "Premium" },
      planValue: "Free",
      /** `{used} of {included} used`. */
      used: "{used} of {included} used",
      premiumValue: "Unlimited chats and dates",
      primary: { label: "Explore Premium", to: to("PLANS") } satisfies Action,
      secondary: "Return to chat",
    },
  },
  manage: {
    back: back("MEMBERSHIP"),
    title: "Manage your subscription",
    description: "You can stop future renewals through your billing provider.",
    rows: { plan: "Current plan", through: "Access through" },
    primary: "Stop renewal",
    busy: "Stopping…",
    failed: "We couldn’t reach your billing provider. Check your connection and try again.",
    secondary: { label: "Keep Premium", to: to("MEMBERSHIP") } satisfies Action,
    stopped: {
      title: "Renewal is turned off",
      /** `{date}` is the end of the paid period. */
      description: "Your current Premium access continues until {date}.",
      summary: { icon: "calendar-03", title: "Renewal is off", description: "Your current membership remains available until its displayed end date." } satisfies StatusSummaryCopy,
      primary: { label: "Back to profile", to: to("PROFILE") } satisfies Action,
    },
  },
};
