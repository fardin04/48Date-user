import { planIds, type PlanId } from "@/data/portal/membership";
import { isSampleMember, type MemberId } from "@/data/portal/types";
import { getMembershipPage, getPlan, getPlans } from "@/stores/portal-store";
import { addDays, isIsoDay, todayIso } from "@/lib/portal/date-format";
import type { Membership, MembershipService } from "@/lib/portal/membership-service";

/**
 * MOCK — stands in for the billing provider so every W10 state can be reviewed.
 * Not for production: replace `membershipService` in ./membership-service.ts.
 *
 * - Everyone starts on the free plan with one new conversation per week.
 * - "Paying" waits ~3s like a provider confirmation; it fails while offline (PAY-ERROR).
 * - Restore finds a purchase only when one was made earlier in this tab (else PAY-RESTORE-NONE).
 * - State lives in sessionStorage for this tab, validated on read. No card data is ever handled.
 */
const STORAGE_KEY = "48date.mock.membership";
const CONFIRM_MS = 3000;
const LATENCY_MS = 800;

type Stored = { plan: PlanId | null; renews: boolean; periodEnds: string | null; conversations: MemberId[]; purchased: PlanId | null };

const EMPTY: Stored = { plan: null, renews: false, periodEnds: null, conversations: [], purchased: null };
const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null && !Array.isArray(value);
const isPlan = (value: unknown): value is PlanId => planIds.includes(value as PlanId);

function read(): Stored {
  try {
    const value: unknown = JSON.parse(sessionStorage.getItem(STORAGE_KEY) ?? "null");
    if (!isRecord(value)) return EMPTY;
    const periodEnds = isIsoDay(value.periodEnds) ? value.periodEnds : null;
    // A lapsed period ends Premium.
    const active = isPlan(value.plan) && periodEnds !== null && periodEnds >= todayIso();
    const conversations = Array.isArray(value.conversations) ? value.conversations.filter((id): id is MemberId => typeof id === "string" && isSampleMember(id)) : [];
    return {
      plan: active ? (value.plan as PlanId) : null,
      renews: active && value.renews === true,
      periodEnds: active ? periodEnds : null,
      conversations,
      purchased: isPlan(value.purchased) ? value.purchased : null,
    };
  } catch {
    return EMPTY;
  }
}

function write(change: Partial<Stored>) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ ...read(), ...change }));
  } catch {
    // Blocked storage: nothing is kept beyond this page.
  }
}

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const view = ({ plan, renews, periodEnds, conversations }: Stored): Membership => ({
  plan,
  renews,
  periodEnds,
  conversationsUsed: conversations.length,
  includedConversations: getMembershipPage().freeConversations,
  lastConversation: conversations.at(-1) ?? null,
});

export const mockMembershipService: MembershipService = {
  async getPlans() {
    return getPlans();
  },
  async getMembership() {
    return view(read());
  },
  async checkout(plan) {
    await wait(CONFIRM_MS);
    if (!navigator.onLine) return "failed";
    write({ plan, renews: true, periodEnds: addDays(todayIso(), getPlan(plan).renewalDays), purchased: plan });
    return "paid";
  },
  async restore() {
    await wait(LATENCY_MS);
    const state = read();
    if (state.plan) return view(state);
    if (!state.purchased) return null;
    write({ plan: state.purchased, renews: true, periodEnds: addDays(todayIso(), getPlan(state.purchased).renewalDays) });
    return view(read());
  },
  async stopRenewal() {
    await wait(LATENCY_MS);
    if (!navigator.onLine) throw new Error("Offline");
    write({ renews: false });
  },
  async startConversation(member) {
    const state = read();
    if (state.plan || state.conversations.includes(member)) return "allowed";
    if (state.conversations.length >= getMembershipPage().freeConversations) return "limit";
    write({ conversations: [...state.conversations, member] });
    return "allowed";
  },
};
