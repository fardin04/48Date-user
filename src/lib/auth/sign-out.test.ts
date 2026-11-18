import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("sign-out (Phase 27)", () => {
  const localStorageMap = new Map<string, string>();
  const sessionStorageMap = new Map<string, string>();

  beforeEach(() => {
    localStorageMap.clear();
    sessionStorageMap.clear();

    vi.stubGlobal("localStorage", {
      getItem: (k: string) => localStorageMap.get(k) ?? null,
      setItem: (k: string, v: string) => void localStorageMap.set(k, v),
      removeItem: (k: string) => void localStorageMap.delete(k),
      clear: () => void localStorageMap.clear(),
      get length() {
        return localStorageMap.size;
      },
      key: (i: number) => Array.from(localStorageMap.keys())[i] ?? null,
    });

    vi.stubGlobal("sessionStorage", {
      getItem: (k: string) => sessionStorageMap.get(k) ?? null,
      setItem: (k: string, v: string) => void sessionStorageMap.set(k, v),
      removeItem: (k: string) => void sessionStorageMap.delete(k),
      clear: () => void sessionStorageMap.clear(),
      get length() {
        return sessionStorageMap.size;
      },
      key: (i: number) => Array.from(sessionStorageMap.keys())[i] ?? null,
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("clears every 48date.* key, clears the navigation trail, and drops tokens on sign-out", async () => {
    const { tokenStore } = await import("@/lib/api/tokens");
    const { clearMemberData } = await import("@/lib/auth/member-data");
    const { readTrail, record, TRAIL_KEY } = await import("@/lib/navigation/nav-trail");

    // Populate mock session and storage items
    sessionStorage.setItem("48date.onboarding.draft", JSON.stringify({ nickname: "omar" }));
    sessionStorage.setItem("48date.portal.prefs", JSON.stringify({ meet: "everyone" }));
    localStorage.setItem("48date.member.tokens", JSON.stringify({ accessToken: "a", refreshToken: "r" }));
    localStorage.setItem("48date.member.other", "some-data");

    // Seed navigation trail
    record("/discover");
    record("/profile");
    expect(readTrail()).toEqual(["/discover", "/profile"]);
    expect(sessionStorage.getItem(TRAIL_KEY)).toBeDefined();

    // Set token session
    tokenStore.set({ accessToken: "access-123", refreshToken: "refresh-123" });
    expect(tokenStore.hasSession()).toBe(true);

    // Call clearMemberData (invoked by authService.signOut)
    clearMemberData();
    tokenStore.clear(false);

    // Verify all 48date.* keys are completely wiped from both storages
    const remainingSessionKeys = Array.from(sessionStorageMap.keys()).filter((k) => k.startsWith("48date."));
    expect(remainingSessionKeys).toHaveLength(0);

    const remainingLocalKeys = Array.from(localStorageMap.keys()).filter((k) => k.startsWith("48date."));
    expect(remainingLocalKeys).toHaveLength(0);

    // Verify navigation trail is cleared
    expect(readTrail()).toEqual([]);

    // Verify token session is ended
    expect(tokenStore.hasSession()).toBe(false);
  });
});
