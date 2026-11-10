import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { replayFetch, type Call } from "./postman-replay";
import type { StepInput } from "@/lib/onboarding/onboarding-service";

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

  it("records swipes (a Super Like as SUPER_LIKE) and reads full profiles", async () => {
    const { portal } = await load();
    await portal.getDeck();
    expect(await portal.decide("Wildflower", "super")).toEqual({ matched: false });
    expect(calls.find((call) => call.path === "/discovery/swipes")?.body).toMatchObject({ targetNickname: "Wildflower", action: "SUPER_LIKE", source: "DECK" });
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
    expect(list[0]).toMatchObject({ member: "Noah_Reed", unread: 1, at: Date.parse("2026-10-27T09:00:00.000Z") });
    const conversation = await chat.getConversation("Noah_Reed");
    expect(conversation.opening).toBe("live");
    expect(conversation.readOnly).toBe(false);
    // Oldest first, every kind the history holds (service notes, text, photo, voice, date and game cards).
    expect(conversation.messages.map((message) => message.kind)).toEqual(["system", "text", "photo", "voice", "date", "date", "game", "game"]);
    expect(conversation.messages[1].mine).toBe(false);
    expect(conversation.messages[1].text).toMatch(/^I would love that!/);
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
    const plan = await dates.getPlan("GoldenHour");
    // The collection's newest plan is a confirmed date at 15:00 UTC, read on Dhaka's clock (UTC+6).
    expect(plan).toMatchObject({ status: "confirmed", timezone: "Asia/Dhaka", date: "2026-10-31", time: 21 * 60, attendance: null });
    expect(plan.place.name).toBe("North End Coffee Roasters");
    expect(plan.partner).toMatchObject({ name: "GoldenHour", verified: true, photo: { src: "https://cdn.48date.local/users/GoldenHour/photos/main.jpg" } });
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

  describe("selfie verification", () => {
    const ATTEMPT = "be1ab78f-2e57-4cd5-bf51-a3e1e8cd109d";
    const me = (verificationStatus: string) => ok({ nickname: "liam_chen", verificationStatus, onboardingStatus: "COMPLETED" });
    const attempt = (status: string, rejectReason: string | null = null) =>
      ok({ id: ATTEMPT, status, method: "AUTO_MODEL", confidence: 0, matchScore: 0, livenessScore: 0.53, gestureDetected: false, rejectReason, reasonCodes: [], createdAt: "2026-11-03T04:56:23.152Z", decidedAt: null });
    const withAttempt = () => {
      const store = new Map([["48date.member.verification", ATTEMPT]]);
      vi.stubGlobal("localStorage", { getItem: (k: string) => store.get(k) ?? null, setItem: (k: string, v: string) => store.set(k, v), removeItem: (k: string) => store.delete(k) });
    };

    it("shows an admin rejection (REJECTED) with the reviewer's reason, not 'pending'", async () => {
      const { onboarding } = await load({ "GET /users/me": me("UNVERIFIED"), [`GET /verification/${ATTEMPT}`]: attempt("REJECTED", "Face not clearly visible") });
      withAttempt();
      expect(await onboarding.getVerification()).toEqual({ status: "retry", reason: "Face not clearly visible" });
    });

    it("reads the automatic check's FAILED result and reason code", async () => {
      const { onboarding } = await load({ "GET /users/me": me("UNVERIFIED"), [`GET /verification/${ATTEMPT}`]: attempt("FAILED", "LOW_SIMILARITY") });
      withAttempt();
      expect(await onboarding.getVerification()).toEqual({ status: "retry", reason: "LOW_SIMILARITY" });
    });

    it("treats an attempt still 'in review' as decided once the profile is no longer PENDING", async () => {
      const { onboarding } = await load({ "GET /users/me": me("UNVERIFIED"), [`GET /verification/${ATTEMPT}`]: attempt("MANUAL_REVIEW") });
      withAttempt();
      expect((await onboarding.getVerification()).status).toBe("retry");
    });

    it("keeps a review pending while the profile says PENDING, and trusts VERIFIED", async () => {
      let services = await load({ "GET /users/me": me("PENDING"), [`GET /verification/${ATTEMPT}`]: attempt("NEEDS_REVIEW") });
      withAttempt();
      expect(await services.onboarding.getVerification()).toEqual({ status: "pending" });
      services = await load({ "GET /users/me": me("VERIFIED"), [`GET /verification/${ATTEMPT}`]: attempt("MANUAL_REVIEW") });
      withAttempt();
      expect(await services.onboarding.getVerification()).toEqual({ status: "verified" });
    });
  });

  it("saves a location: a chosen area by name, a device position rounded and named after the area it falls in", async () => {
    const { account } = await load();
    const manchester = { id: "manchester", name: "Manchester", label: "Manchester", region: "United Kingdom", countryCode: "GB", center: [53.48, -2.24] as [number, number] };
    // The collection's example answers "Dhaka"; the request is what matters here.
    expect(await account.saveLocation({ kind: "area", area: manchester })).toBe("Dhaka");
    const [manual] = calls.filter((call) => call.method === "PATCH" && call.path === "/users/me/location");
    expect(manual.body).toEqual({ latitude: 53.48, longitude: -2.24, city: "Manchester", region: null, countryCode: "GB", source: "MANUAL" });
    await account.saveLocation({ kind: "device", latitude: 40.712776, longitude: -74.005974 });
    const device = calls.filter((call) => call.method === "PATCH" && call.path === "/users/me/location")[1];
    expect(device.body).toEqual({ latitude: 40.71, longitude: -74.01, city: "New York", region: null, countryCode: "US", permission: "WHILE_IN_USE", source: "GPS" });
    // Nowhere near a listed area: the names are cleared rather than kept from before.
    await account.saveLocation({ kind: "device", latitude: 0.5, longitude: 0.5 });
    const remote = calls.filter((call) => call.method === "PATCH" && call.path === "/users/me/location")[2];
    expect(remote.body).toMatchObject({ city: null, countryCode: null, source: "GPS" });
  });

  it("sends a new account to setup and resumes at its first required step", async () => {
    const steps = ["location", "nickname", "real_name", "birthday", "photos", "selfie", "notifications"].map((step) => ({
      step,
      name: step,
      required: !["location", "selfie", "notifications"].includes(step),
      state: step === "location" ? "DONE" : "PENDING",
    }));
    const { auth, onboarding } = await load({
      "POST /auth/phone/verify": ok({ accessToken: "a", refreshToken: "r", isNewUser: true, onboardingStatus: "NOT_STARTED" }),
      "GET /onboarding": ok({ onboardingStatus: "IN_PROGRESS", nextStep: "nickname", progressPercent: 5, steps, savedValues: {} }),
    });
    const store = new Map<string, string>();
    vi.stubGlobal("localStorage", { getItem: (k: string) => store.get(k) ?? null, setItem: (k: string, v: string) => store.set(k, v), removeItem: (k: string) => store.delete(k), key: () => null, length: 0 });
    expect(await auth.verifyCode({ dial: "+880", national: "1811000077" }, "123456")).toBe("verified");
    expect(auth.setupState()).toBe("onboarding");
    expect(await onboarding.getProgress()).toMatchObject({ completed: false, pending: ["nickname", "privateName", "birthday", "photos"] });
  });

  it("sends interleaved steps in the API's order, holding answers back until the API can take them", async () => {
    const order = ["birthday", "smoking", "drinking", "gender", "kids", "interested_in", "interests", "height"];
    const steps = order.map((step) => ({ step, name: step, required: true, state: step === "birthday" ? "DONE" : "PENDING" }));
    const { onboarding } = await load({
      "GET /onboarding": ok({ onboardingStatus: "IN_PROGRESS", nextStep: "smoking", progressPercent: 20, steps, savedValues: {} }),
    });
    const fields = { identity: "WOMAN", meet: "EVERYONE", smoking: "NEVER", alcohol: "SOCIALLY", children: "false", familyPlans: "true" };
    const draft = { fields, interests: [] } as unknown as StepInput["draft"];
    const puts = () => calls.filter((call) => call.method === "PUT").map((call) => call.path.split("/").pop());
    // LIFESTYLE first: kids waits for gender (IDENTITY, the next screen).
    expect(await onboarding.saveStep("lifestyle", { draft })).toEqual({ ok: true });
    expect(puts()).toEqual(["smoking", "drinking"]);
    // As the API now reports (the fake serves this array on every read).
    for (const entry of steps) if (entry.step === "smoking" || entry.step === "drinking") entry.state = "DONE";
    // IDENTITY then sends gender, the waiting kids answer and interested_in, in the API's order.
    expect(await onboarding.saveStep("identity", { draft })).toEqual({ ok: true });
    expect(puts().slice(2)).toEqual(["gender", "kids", "interested_in"]);
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

  describe("after the date (attendance is the server's)", () => {
    const plan = (fields: Record<string, unknown>) => ({
      id: "d1", matchId: "m1", proposerId: "a", receiverId: "b",
      counterpart: { nickname: "GoldenHour", age: 25, mainPhoto: null, verificationStatus: "VERIFIED", availability: "ACTIVE" },
      venueName: "North End Coffee Roasters", venueCategory: "Cafe", venueAddress: null, venueLatitude: null, venueLongitude: null, venueRating: null, venuePhotoRef: null,
      distanceKmFromMe: null, scheduledAt: "2026-10-30T10:00:00.000Z", timeZone: "UTC", status: "AWAITING_CONFIRMATION", cancelReason: null, cancelledBy: null, cancelNote: null,
      myConfirmation: null, partnerConfirmation: null, bothConfirmed: false, pendingPostponeRequest: null,
      canAccept: false, canDecline: false, canWithdraw: false, canCancel: false, canPostpone: false, canConfirm: true, canRate: false, hasRated: false,
      createdAt: "2026-10-29T09:30:00.000Z", updatedAt: "2026-10-29T10:00:00.000Z",
      ...fields,
    });
    const list = (fields: Record<string, unknown>) => ({ "GET /dates": ok([plan(fields)], { page: 1, limit: 50, total: 1, totalPages: 1 }) });
    const met = { attended: true, confirmedAt: "2026-10-30T12:00:00.000Z" };

    it("asks once the date has passed, then waits for the partner or shows a no-show under review", async () => {
      expect(await (await load(list({}))).dates.getPlan("GoldenHour")).toMatchObject({ status: "confirmed", attendance: null });
      expect(await (await load(list({ myConfirmation: met }))).dates.getPlan("GoldenHour")).toMatchObject({ attendance: "waiting" });
      expect(await (await load(list({ status: "NO_SHOW", bothConfirmed: true }))).dates.getPlan("GoldenHour")).toMatchObject({ status: "confirmed", attendance: "review" });
    });

    it("sends the answer to /confirm, a no-show with its reason as the note", async () => {
      const { dates } = await load(list({}));
      await dates.recordAttendance("GoldenHour", { met: true });
      expect(calls.find((call) => call.path === "/dates/d1/confirm")).toMatchObject({ method: "POST", body: { attended: true } });
      await dates.recordAttendance("GoldenHour", { met: false, reason: "noArrival", details: "Waited 40 minutes" });
      expect(calls.filter((call) => call.path === "/dates/d1/confirm").at(-1)?.body).toMatchObject({ attended: false, note: expect.stringContaining("Waited 40 minutes") });
      expect(count("POST", "/dates/d1/rating")).toBe(0);
    });

    it("reads a declined invitation (CANCELLED with reason DECLINED) as declined, not cancelled", async () => {
      const { dates } = await load(list({ status: "CANCELLED", cancelReason: "DECLINED", scheduledAt: "2026-12-30T10:00:00.000Z" }));
      expect((await dates.getPlan("GoldenHour")).status).toBe("declined");
    });

    it("skips feedback without a rating request (a rating needs its scores)", async () => {
      const { dates } = await load(list({ status: "COMPLETED", myConfirmation: met, canRate: true }));
      expect(await dates.submitFeedback("GoldenHour", null)).toMatchObject({ feedback: "skipped" });
      expect(count("POST", "/dates/d1/rating")).toBe(0);
    });
  });

  it("shows a removed message without its content, and an edited one as edited", async () => {
    const id = "c1234567-89ab-cdef-0123-456789abcdef";
    const message = (fields: Record<string, unknown>) => ({ conversationId: id, senderId: "p", senderNickname: "Noah_Reed", isMine: false, type: "TEXT", file: null, payload: null, status: "SEEN", createdAt: "2026-10-27T08:10:00.000Z", ...fields });
    const { chat } = await load({
      [`GET /conversations/${id}/messages`]: ok(
        [message({ id: "m2", seq: 2, text: "Corrected text", isEdited: true, editedAt: "2026-10-27T08:12:00.000Z" }), message({ id: "m1", seq: 1, text: null, isDeleted: true, deletedAt: "2026-10-27T08:11:00.000Z" })],
        { nextCursor: null, hasMore: false },
      ),
    });
    const conversation = await chat.getConversation("Noah_Reed");
    expect(conversation.messages).toMatchObject([
      { id: "m1", deleted: true, text: "" },
      { id: "m2", edited: true, text: "Corrected text" },
    ]);
  });
});
