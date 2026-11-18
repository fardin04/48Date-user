import { afterEach, describe, expect, it, vi } from "vitest";
import { replayFetch, type Call } from "./postman-replay";

const BASE = "http://localhost:3000/api/v1";
let calls: Call[];

async function load(overrides: Record<string, unknown> = {}) {
  vi.resetModules();
  vi.stubEnv("NEXT_PUBLIC_API_BASE_URL", BASE);
  vi.stubGlobal("window", globalThis);
  const session = new Map<string, string>();
  vi.stubGlobal("sessionStorage", {
    getItem: (k: string) => session.get(k) ?? null,
    setItem: (k: string, v: string) => void session.set(k, v),
    removeItem: (k: string) => void session.delete(k),
    clear: () => void session.clear(),
  });
  const replay = replayFetch(BASE, overrides);
  calls = [];
  vi.stubGlobal("fetch", async (input: string | URL | Request, init: RequestInit = {}) => {
    const url = new URL(typeof input === "string" ? input : input instanceof URL ? input.href : input.url);
    const path = url.pathname.replace(new URL(BASE).pathname.replace(/\/$/, ""), "");
    const method = (init.method ?? "GET").toUpperCase();
    const headers = new Headers(init.headers);
    const body = typeof init.body === "string" ? JSON.parse(init.body) : init.body ?? null;
    calls.push({
      method,
      path: `${path}${url.search}`,
      body,
      auth: headers.get("Authorization"),
    });

    if (path === "/reports/reasons" && method === "GET") {
      return new Response(
        JSON.stringify({
          success: true,
          data: [
            {
              reason: "HARASSMENT",
              subReasons: [{ name: "Inappropriate messages", severity: "HIGH" }],
            },
            {
              reason: "FRAUD",
              subReasons: [{ name: "Fake profile", severity: "HIGH" }],
            },
          ],
        }),
        { status: 200 }
      );
    }

    if (path === "/reports" && method === "POST") {
      return new Response(
        JSON.stringify({
          success: true,
          data: {
            id: "report-123",
            code: "REP-001",
            reason: body.reason,
            subReason: body.subReason,
            severity: "HIGH",
            status: "PENDING",
            createdAt: new Date().toISOString(),
          },
        }),
        { status: 200 }
      );
    }

    if (path === "/success-stories/story-456" && method === "GET") {
      return new Response(
        JSON.stringify({
          success: true,
          data: {
            id: "story-456",
            title: "First coffee date",
            author: { nickname: "author_nick" },
          },
        }),
        { status: 200 }
      );
    }

    return replay(input, init);
  });

  const { tokenStore } = await import("@/lib/api/tokens");
  tokenStore.set({ accessToken: "token-1", refreshToken: "refresh-1" });
  const { apiAccountService } = await import("@/lib/portal/api-account-service");
  return { apiAccountService };
}

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("reports contract and payload (Phase 30)", () => {
  it("submits a member report with CHAT source and conversationId", async () => {
    const { apiAccountService } = await load();
    await apiAccountService.report(
      { kind: "member", id: "julian_vance" },
      "messages",
      "Sent harassing messages in chat",
      { source: "CHAT", conversationId: "conv-999", alsoBlock: true }
    );

    const postCall = calls.find((c) => c.path === "/reports" && c.method === "POST");
    expect(postCall).toBeDefined();
    expect(postCall?.body).toEqual({
      reportedNickname: "julian_vance",
      reason: "HARASSMENT",
      subReason: "Inappropriate messages",
      description: "Sent harassing messages in chat",
      source: "CHAT",
      conversationId: "conv-999",
      alsoBlock: true,
    });
  });

  it("submits a story report targeting the story author with PROFILE source", async () => {
    const { apiAccountService } = await load();
    await apiAccountService.report(
      { kind: "story", id: "story-456" },
      "fake",
      "This story contains fake information"
    );

    const postCall = calls.find((c) => c.path === "/reports" && c.method === "POST");
    expect(postCall).toBeDefined();
    expect(postCall?.body.reportedNickname).toBe("author_nick");
    expect(postCall?.body.source).toBe("PROFILE");
    expect(postCall?.body.description).toContain("First coffee date: This story contains fake information");
  });
});
