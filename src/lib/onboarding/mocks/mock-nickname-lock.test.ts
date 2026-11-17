import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { mockOnboardingService } from "@/lib/onboarding/mocks/mock-onboarding-service";

let store: Map<string, string>;
beforeEach(() => {
  store = new Map();
  vi.stubGlobal("sessionStorage", { getItem: (k: string) => store.get(k) ?? null, setItem: (k: string, v: string) => store.set(k, v), removeItem: (k: string) => store.delete(k) });
});
afterEach(() => vi.unstubAllGlobals());

const draft = (nickname?: string) => ({ fields: nickname === undefined ? {} : { nickname }, interests: [] });

describe("mock onboarding: the saved nickname is locked (D-117), as the API reports it", () => {
  it("reports nothing before a nickname is saved", async () => {
    expect(await mockOnboardingService.getProgress()).toBeNull();
    await mockOnboardingService.saveStep("privateName", { draft: draft("Sunny") });
    expect(await mockOnboardingService.getProgress()).toBeNull();
  });

  it("locks the trimmed nickname once NICKNAME is saved, so Back shows it locked after a re-read", async () => {
    expect(await mockOnboardingService.saveStep("nickname", { draft: draft("  Sunny_1 ") })).toEqual({ ok: true });
    expect(await mockOnboardingService.getProgress()).toEqual({ completed: false, draft: {}, lockedNickname: "Sunny_1" });
  });

  it("ignores an empty nickname", async () => {
    await mockOnboardingService.saveStep("nickname", { draft: draft("  ") });
    expect(await mockOnboardingService.getProgress()).toBeNull();
  });
});
