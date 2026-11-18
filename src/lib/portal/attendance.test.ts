import { afterEach, describe, expect, it, vi } from "vitest";
import { replayFetch } from "@/test/postman-replay";
import { attendanceSections } from "./date-plan-state";

/** Phase 18: the details lead every after-date state (bug N3); a skipped feedback sends nothing. */
describe("attendanceSections", () => {
  it("puts the date details before the question, the wait and the review", () => {
    expect(attendanceSections(null)).toEqual(["details", "question"]);
    expect(attendanceSections("waiting")).toEqual(["details", "wait"]);
    expect(attendanceSections("review")).toEqual(["details", "review"]);
  });
});

describe("skipping feedback", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("sends no rating and records the skip for this plan", async () => {
    const BASE = "http://localhost:3000/api/v1";
    vi.resetModules();
    vi.stubEnv("NEXT_PUBLIC_API_BASE_URL", BASE);
    vi.stubGlobal("window", globalThis);
    const store = new Map<string, string>();
    vi.stubGlobal("sessionStorage", { getItem: (key: string) => store.get(key) ?? null, setItem: (key: string, value: string) => void store.set(key, value) });
    const replay = replayFetch(BASE);
    vi.stubGlobal("fetch", replay.fetchStub);
    const { tokenStore } = await import("@/lib/api/tokens");
    tokenStore.set({ accessToken: "test-access", refreshToken: "test-refresh" });
    const { apiDateService } = await import("@/lib/portal/api-date-service");
    const plan = await apiDateService.submitFeedback("GoldenHour", null);
    expect(replay.calls.some((call) => call.path.endsWith("/rating"))).toBe(false);
    expect(plan.feedback).toBe("skipped");
  });
});
