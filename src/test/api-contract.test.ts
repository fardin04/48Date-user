import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { replayFetch, type Call } from "./postman-replay";

/**
 * Contract tests: the real API services (TanStack cache, client, rate limits, SSE parsing) run
 * against the example responses of `postman/48Date-Backend.postman_collection.json`.
 */
const BASE = "http://localhost:3000/api/v1";

let calls: Call[];

/** Fresh modules per test, in "browser" mode so the shared TanStack client is used as in the app. */
async function load(overrides: Record<string, unknown> = {}) {
  vi.resetModules();
  vi.stubEnv("NEXT_PUBLIC_API_BASE_URL", BASE);
  vi.stubGlobal("window", globalThis);
  const replay = replayFetch(BASE, overrides);
  calls = replay.calls;
  vi.stubGlobal("fetch", replay.fetchStub);
  const { tokenStore } = await import("@/lib/api/tokens");
  tokenStore.set({ accessToken: "test-access", refreshToken: "test-refresh" });
  return {
    portal: (await import("@/lib/portal/api-portal-service")).apiPortalService,
    chat: (await import("@/lib/portal/api-chat-service")).apiChatService,
    games: (await import("@/lib/portal/api-game-service")).apiGameService,
    dates: (await import("@/lib/portal/api-date-service")).apiDateService,
    stories: (await import("@/lib/portal/api-story-service")).apiStoryService,
    account: (await import("@/lib/portal/api-account-service")).apiAccountService,
    membership: (await import("@/lib/portal/api-membership-service")).apiMembershipService,
    auth: (await import("@/lib/auth/api-auth-service")).apiAuthService,
    onboarding: (await import("@/lib/onboarding/api-onboarding-service")).apiOnboardingService,
  };
}

const count = (method: string, path: string | RegExp) => calls.filter((call) => call.method === method && (typeof path === "string" ? call.path === path : path.test(call.path))).length;

beforeEach(() => {
  vi.useRealTimers();
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("auth", () => {
  it("requests and verifies a code, with no token on public calls", async () => {
    const { auth } = await load();
    expect(await auth.sendCode({ dial: "+880", national: "1811000001" })).toBe("sent");
    expect(await auth.verifyCode({ dial: "+880", national: "1811000001" }, "123456")).toBe("verified");
    const request = calls.find((call) => call.path === "/auth/phone/request-otp");
    expect(request).toMatchObject({ method: "POST", body: { phone: "+8801811000001" }, auth: null });
    expect(calls.find((call) => call.path === "/auth/phone/verify")?.body).toMatchObject({ otp: "123456", device: { platform: "web" } });
  });

  it("signs in with Google", async () => {
    const { auth } = await load();
    expect(await auth.signInWithGoogle("google-id-token")).toEqual({ status: "verified", next: "portal" });
    expect(calls.at(-1)).toMatchObject({ path: "/auth/google", body: { idToken: "google-id-token" } });
  });
});

describe("discovery and matches", () => {
  it("maps preferences and saves them in the API's shape", async () => {
    const { portal } = await load();
    const preferences = await portal.getPreferences();
    expect(preferences).toEqual({ meet: "women", distance: "any", minAge: 22, maxAge: 35, verifiedOnly: false, sharedInterest: true });
    await portal.savePreferences({ ...preferences, distance: "15", meet: "men" });
    expect(calls.find((call) => call.method === "PUT")?.body).toMatchObject({ interestedIn: "MEN", maxDistanceKm: 24, ageMin: 22, ageMax: 35 });
  });

  it("builds the deck from the run's event stream and reads its cards", async () => {
    const { portal } = await load();
    const deck = await portal.getDeck();
    expect(deck.remaining).toContain("Wildflower");
    expect(deck.fitting).toBe(45);
    // The run finished on its stream: no snapshot polling.
    expect(count("GET", /^\/discovery\/runs\/[^/]+$/)).toBe(0);
    expect(count("GET", /\/events$/)).toBe(1);
  });

  it("records swipes (a Super Like is a like) and reads full profiles", async () => {
    const { portal } = await load();
    await portal.getDeck();
    expect(await portal.decide("Wildflower", "super")).toEqual({ matched: false });
    expect(calls.find((call) => call.path === "/discovery/swipes")?.body).toMatchObject({ targetNickname: "Wildflower", action: "LIKE", source: "DECK" });
    const member = await portal.getMember("wildflower");
    expect(member).toMatchObject({ id: "wildflower", age: 26, verified: true, compatibility: null, bio: "Architect, coffee enthusiast and weekend hiker." });
    expect(member?.aboutFacts.find((fact) => fact.label === "Height")?.value).toBe("168 cm");
  });

  it("lists matches with server-owned deadlines and shares one request", async () => {
    const { portal } = await load();
    const [matches, active, match] = await Promise.all([portal.getMatches(), portal.getActiveCount(), portal.getMatch("GoldenHour")]);
    expect(matches[0]).toMatchObject({ member: "GoldenHour", confirmed: false });
    expect(typeof matches[0].expiresAt).toBe("number");
    expect(active).toBe(1);
    expect(match?.member).toBe("GoldenHour");
    expect(count("GET", "/matches")).toBe(1);
    expect(await portal.getUnseenMatch()).toBe("GoldenHour");
  });
});

describe("chat", () => {
  it("lists conversations and reads one with its history", async () => {
    const { chat } = await load();
    const list = await chat.getConversations();
    expect(list[0]).toMatchObject({ member: "Golden_Hour", unread: 2 });
    const conversation = await chat.getConversation("Golden_Hour");
    expect(conversation.opening).toBe("live");
    expect(conversation.readOnly).toBe(false);
    expect(conversation.messages.map((message) => message.kind)).toEqual(["photo", "text"]);
    expect(conversation.messages[1]).toMatchObject({ mine: false, text: "Coffee tomorrow? I know a spot." });
  });

  it("sends with a client id (idempotent retries)", async () => {
    const { chat } = await load();
    await chat.getConversation("Golden_Hour");
    const sent = await chat.send("Golden_Hour", { kind: "text", text: "Sounds perfect!" });
    expect(sent.status).not.toBe("failed");
    const body = calls.find((call) => call.method === "POST" && call.path.endsWith("/messages"))?.body as Record<string, string>;
    expect(body).toMatchObject({ type: "TEXT", text: "Sounds perfect!" });
    expect(body.clientMessageId).toMatch(/^[0-9a-f-]{36}$/);
  });

  it("gets AI lines and lists blocked members", async () => {
    const { chat } = await load();
    const result = await chat.getSuggestions("Golden_Hour", new AbortController().signal);
    expect(result.status).toBe("ready");
    expect(await chat.getBlocked()).toEqual(["WildRose"]);
  });
});

describe("games", () => {
  it("starts the game and returns the match's revealed answer", async () => {
    const { games } = await load();
    const state = await games.start("Golden_Hour");
    expect(state.questions[0].choices.map((choice) => choice.label)).toEqual(["Coffee Date", "Fancy Dinner"]);
    expect(await games.answer("Golden_Hour", 0, "A", new AbortController().signal)).toEqual({ status: "answered", choice: "A" });
  });
});

describe("dates", () => {
  it("reads the plan in its own timezone", async () => {
    const { dates } = await load();
    const plan = await dates.getPlan("sarah_j");
    // The collection's plan is an invitation this member sent (REQUESTED, can't accept it).
    expect(plan).toMatchObject({ status: "pending", timezone: "UTC", date: "2026-10-25", time: 19 * 60 });
    expect(plan.place.name).toBe("Blue Note Jazz Club");
  });
});

describe("stories, notifications, trust and membership", () => {
  it("reads the feed, a story with comments and the meet options", async () => {
    const { stories } = await load();
    const feed = await stories.getStories();
    expect(feed[0]).toMatchObject({ id: "story-uuid-1", couple: "alice_w & bob_m", likes: { count: 24, liked: false } });
    const story = await stories.getStory("story-uuid-1");
    expect(story?.comments).toEqual([{ author: "clara_d", text: "Congratulations to both of you! Such an inspiring story." }]);
    expect((await stories.getMeetOptions())[0].value).toBe("date-plan-uuid-1");
  });

  it("reads notifications, warnings and sign-in methods", async () => {
    const { account } = await load();
    const items = await account.getNotifications();
    expect(items[0]).toMatchObject({ title: "Date Invite Received", unread: true, to: { screen: "DATE-PENDING", param: "GoldenHour" } });
    expect(await account.getUnreadCount()).toBe(3);
    expect((await account.getWarnings())[0].id).toBe("warn-123");
    expect(await account.getSignInMethods()).toEqual({ phone: "+880****1000001", google: "jane.doe@gmail.com" });
  });

  it("sends a report with a reason from the API's catalogue", async () => {
    const { account } = await load();
    await account.report({ kind: "member", id: "WildRose" }, "money", "Asked me to send money for a ticket.");
    expect(calls.find((call) => call.path === "/reports")?.body).toMatchObject({
      reportedNickname: "WildRose",
      reason: "They shouldn't be on 48Date",
      subReason: "Scam or asking for money",
    });
  });

  it("reads plans", async () => {
    const { membership } = await load();
    expect((await membership.getPlans()).length).toBeGreaterThan(0);
  });
});

describe("caching", () => {
  it("reads GET /users/me once for every screen that shows it", async () => {
    const { account } = await load();
    await Promise.all([account.getOverview(), account.getProfile(), account.getPhotos(), account.getAvatar()]);
    await account.getProfile();
    expect(count("GET", "/users/me")).toBe(1);
  });
});

/** Shapes the live backend sends that differ from the collection's examples (found against the API). */
describe("live API shapes", () => {
  const MATCH = "019283aa-0000-7000-8000-000000000001";
  const ok = (data: unknown, meta?: unknown) => ({ success: true, data, ...(meta ? { meta } : {}) });

  it("reads venue suggestions returned as the run itself (not `{ run }`)", async () => {
    const { dates } = await load({
      [`POST /matches/${MATCH}/venue-suggestions`]: ok({
        runId: "run-1",
        matchId: MATCH,
        status: "COMPLETED",
        venues: [{ venueRef: "venue_1", name: "The Glasshouse Garden Café", address: "14 Parkside Boulevard", category: "Café & Bakery", isAiPick: true, latitude: 23.79, longitude: 90.42, rating: 4.9, photoUrl: "https://images.unsplash.com/x", distanceKmFromMe: 2.4 }],
        aiPickRef: "venue_1",
      }),
    });
    const venues = await dates.getVenues("GoldenHour");
    expect(venues).toHaveLength(1);
    expect(venues[0]).toMatchObject({ id: "venue_1", name: "The Glasshouse Garden Café", highlightTone: "rose" });
    expect(venues[0].meta).toContain("2.4 km");
  });

  it("opens a notification whose target has no params", async () => {
    const { account } = await load({
      "GET /notifications": ok(
        [{ id: "n1", type: "STORY_PARTNER_REQUESTED", category: "STORIES", title: "Success Story Consent", body: "ava_stone asked for your approval.", imageUrl: null, actor: { nickname: "ava_stone", availability: "ACTIVE", age: 29, mainPhotoUrl: null, isVerified: true }, target: { screen: "STORY_DETAIL" }, createdAt: "2026-11-02T03:48:17.952Z", readAt: null }],
        { nextCursor: null, hasMore: false, unreadCount: 1 },
      ),
    });
    const [item] = await account.getNotifications();
    expect(item).toMatchObject({ title: "Success Story Consent", unread: true, to: { screen: "STORIES" } });
  });

  it("treats a match without a deadline as open, not as a confirmed date", async () => {
    const { portal } = await load({
      "GET /matches": ok(
        [
          { id: "m1", otherUser: { nickname: "liam_chen", age: 31, mainPhotoUrl: null, isVerified: true, availability: "ACTIVE" }, displayStatus: "NEW", actions: [], createdAt: "2026-10-27T10:14:23.636Z", expiresAt: null, clockStoppedAt: null, latestDate: { id: "d1", status: "CANCELLED", place: { name: "Blue Note Jazz Club", address: null } }, conversationId: "c1", lastMessagePreview: null, lastActivityAt: null },
          { id: "m2", otherUser: { nickname: "mia_khan", age: 27, mainPhotoUrl: null, isVerified: true, availability: "ACTIVE" }, displayStatus: "DATE_SET", actions: [], createdAt: "2026-10-27T10:14:23.636Z", expiresAt: null, clockStoppedAt: "2026-10-28T10:00:00.000Z", latestDate: { id: "d2", status: "SET" }, conversationId: "c2", lastMessagePreview: null, lastActivityAt: null },
        ],
        { nextCursor: null, hasMore: false, activeCount: 1, serverTime: "2026-11-02T09:34:22.674Z" },
      ),
    });
    const [open, set] = await portal.getMatches();
    expect(open).toMatchObject({ member: "liam_chen", confirmed: false, expiresAt: null });
    expect(set).toMatchObject({ member: "mia_khan", confirmed: true, expiresAt: null });
  });

  it("reads the date partner's live fields (mainPhotoUrl, isVerified)", async () => {
    const { dates } = await load({
      "GET /dates": ok(
        [{ id: "d1", matchId: "m1", proposerId: "a", receiverId: "b", counterpart: { nickname: "noah_reed", age: 32, mainPhotoUrl: "https://r2.example.com/noah.webp", isVerified: true, availability: "ACTIVE" }, venueName: "Artisan Coffee Roasters", venueCategory: "Specialty Coffee", venueAddress: "28 Orchard Way", venueLatitude: 23.79, venueLongitude: 90.4, venueRating: 4.8, venuePhotoRef: null, distanceKmFromMe: null, scheduledAt: "2026-11-05T13:00:00.000Z", timeZone: "UTC", status: "SET", cancelReason: null, cancelNote: null, pendingPostponeRequest: null, canAccept: false, canDecline: false, canWithdraw: false, canCancel: true, canPostpone: true, canRate: false, hasRated: false, createdAt: "2026-11-01T00:00:00.000Z", updatedAt: "2026-11-01T00:00:00.000Z" }],
        { page: 1, limit: 50, total: 1, totalPages: 1 },
      ),
    });
    const plan = await dates.getPlan("noah_reed");
    expect(plan.status).toBe("confirmed");
    expect(plan.partner).toMatchObject({ name: "noah_reed", verified: true, photo: { src: "https://r2.example.com/noah.webp" } });
  });
});
