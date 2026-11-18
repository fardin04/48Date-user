import { readFileSync } from "node:fs";
import { join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { replayFetch, type Call } from "./postman-replay";
import type { OnboardingStep } from "@/data/onboarding/types";
import type { StepInput } from "@/lib/onboarding/onboarding-service";

/**
 * Phase 5 contract: the guided setup steps 1–11 against `PUT /onboarding/steps/:step` in
 * `postman/48Date-Backend.postman_collection.json` — the paths, the API's order (screens interleave)
 * and request bodies that carry only the collection's fields, with case-sensitive enum values.
 */
const BASE = "http://localhost:3000/api/v1";

type Item = { item?: Item[]; request?: { method: string; url: string | { raw: string }; body?: { raw?: string } } };

/** The collection's request body of each step (its `// …` notes stripped). */
function postmanStepBodies() {
  const collection = JSON.parse(readFileSync(join(process.cwd(), "postman", "48Date-Backend.postman_collection.json"), "utf-8")) as { item: Item[] };
  const bodies = new Map<string, Record<string, unknown>>();
  const walk = (items: Item[]) => {
    for (const item of items) {
      if (item.item) walk(item.item);
      const raw = typeof item.request?.url === "string" ? item.request.url : item.request?.url.raw;
      const step = raw?.match(/\/onboarding\/steps\/(\w+)$/)?.[1];
      if (!step || item.request?.method !== "PUT" || !item.request.body?.raw) continue;
      bodies.set(step, JSON.parse(item.request.body.raw.replace(/\s\/\/.*$/gm, "")));
    }
  };
  walk(collection.item);
  return bodies;
}

/** The collection's own step list (Postman `01 Get Onboarding State`), every step still to do. */
const apiOrder = ["location", "nickname", "real_name", "birthday", "smoking", "drinking", "gender", "kids", "interested_in", "interests", "height", "weight", "looking_for", "languages", "education", "religion", "bio", "photos", "selfie", "notifications"];
const optional = new Set(["location", "education", "religion", "bio", "selfie", "notifications"]);

const draft = {
  fields: {
    nickname: "Aura_Love99",
    firstName: "Ayesha",
    lastName: "Rahman",
    dob: "2000-05-15",
    occupation: "Product Designer",
    smoking: "NEVER",
    alcohol: "SOCIALLY",
    children: "false",
    familyPlans: "true",
    identity: "WOMAN",
    meet: "MEN",
    height: "168",
    weight: "58",
    education: "BACHELORS",
    religion: "ISLAM",
    languages: "en,bn",
    goal: "REAL_RELATIONSHIP",
  },
  interests: ["interest-1", "interest-2"],
} as unknown as StepInput["draft"];

let calls: Call[];

async function load(steps: { step: string; name: string; required: boolean; state: string }[]) {
  vi.resetModules();
  vi.stubEnv("NEXT_PUBLIC_API_BASE_URL", BASE);
  vi.stubGlobal("window", globalThis);
  const store = new Map<string, string>();
  vi.stubGlobal("localStorage", { getItem: (k: string) => store.get(k) ?? null, setItem: (k: string, v: string) => store.set(k, v), removeItem: (k: string) => store.delete(k), key: () => null, length: 0 });
  const state = { success: true, data: { onboardingStatus: "IN_PROGRESS", nextStep: "location", progressPercent: 0, steps, savedValues: {} } };
  const replay = replayFetch(BASE, { "GET /onboarding": state });
  calls = replay.calls;
  vi.stubGlobal("fetch", replay.fetchStub);
  const { tokenStore } = await import("@/lib/api/tokens");
  tokenStore.set({ accessToken: "test-access", refreshToken: "test-refresh" });
  return (await import("@/lib/onboarding/api-onboarding-service")).apiOnboardingService;
}

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("onboarding steps 1–11 (PUT /onboarding/steps/:step)", () => {
  /** Screens in setup order → the PUTs each Continue sends, in the API's order. */
  const walk: [OnboardingStep, string[]][] = [
    ["location", ["location"]],
    ["nickname", ["nickname"]],
    ["privateName", ["real_name"]],
    ["birthday", ["birthday"]],
    // kids waits for gender (IDENTITY), which the API takes first.
    ["lifestyle", ["smoking", "drinking"]],
    ["identity", ["gender", "kids", "interested_in"]],
    // No API step: nothing is sent and nothing blocks.
    ["personality", []],
    ["communication", []],
    ["interests", ["interests"]],
    // languages / education / religion come after looking_for (GOALS) in the API's order.
    ["details", ["height", "weight"]],
    ["goals", ["looking_for", "languages", "education", "religion"]],
  ];

  it("walks the setup in screen order and sends each step once, as far as the API order allows", async () => {
    const steps = apiOrder.map((step) => ({ step, name: step, required: !optional.has(step), state: "PENDING" }));
    const onboarding = await load(steps);
    const location = { latitude: 23.81034, longitude: 90.41251, city: "Dhaka", countryCode: "BD", permission: true };
    for (const [screen, expected] of walk) {
      const before = calls.length;
      const result = await onboarding.saveStep(screen, { draft, ...(screen === "location" ? { location } : {}) });
      expect(result, screen).toEqual({ ok: true });
      const puts = calls.slice(before).filter((call) => call.method === "PUT");
      expect(puts.map((call) => call.path.replace("/onboarding/steps/", "")), screen).toEqual(expected);
      // The fake now reports them saved, as the API does.
      for (const entry of steps) if (expected.includes(entry.step)) entry.state = "DONE";
    }
    // Every request was one the collection defines.
    expect(calls.filter((call) => call.path.startsWith("/onboarding/steps/")).length).toBe(walk.flatMap(([, puts]) => puts).length);
  });

  it("sends bodies with the collection's fields only, and the API's enum values", async () => {
    const bodies = postmanStepBodies();
    const steps = apiOrder.map((step) => ({ step, name: step, required: !optional.has(step), state: "PENDING" }));
    const onboarding = await load(steps);
    for (const [screen, expected] of walk) {
      await onboarding.saveStep(screen, { draft, ...(screen === "location" ? { location: { latitude: 23.81034, longitude: 90.41251, city: "Dhaka", countryCode: "BD", permission: true } } : {}) });
      for (const entry of steps) if (expected.includes(entry.step)) entry.state = "DONE";
    }
    const sent = Object.fromEntries(calls.filter((call) => call.method === "PUT").map((call) => [call.path.replace("/onboarding/steps/", ""), call.body as Record<string, unknown>]));
    for (const [step, body] of Object.entries(sent)) {
      const contract = bodies.get(step);
      expect(contract, step).toBeDefined();
      for (const key of Object.keys(body)) expect(Object.keys(contract!), `${step}.${key}`).toContain(key);
    }
    expect(sent).toEqual({
      // Rounded to 0.01° (~1 km): the exact position is never sent.
      location: { latitude: 23.81, longitude: 90.41, city: "Dhaka", countryCode: "BD", permission: true },
      nickname: { nickname: "Aura_Love99" },
      real_name: { firstName: "Ayesha", lastName: "Rahman" },
      birthday: { birthDate: "2000-05-15", occupation: "Product Designer" },
      smoking: { smoking: "NEVER" },
      drinking: { drinking: "SOCIALLY" },
      gender: { gender: "WOMAN" },
      kids: { hasKids: false, wantsKids: true },
      interested_in: { interestedIn: "MEN" },
      interests: { interestIds: ["interest-1", "interest-2"] },
      height: { heightCm: 168 },
      weight: { weightKg: 58 },
      looking_for: { lookingFor: "REAL_RELATIONSHIP" },
      languages: { languageCodes: ["en", "bn"] },
      education: { educationLevel: "BACHELORS" },
      religion: { religion: "ISLAM" },
    });
  });

  it("asks for a missing earlier answer instead of sending a later step", async () => {
    const steps = apiOrder.map((step) => ({ step, name: step, required: !optional.has(step), state: step === "location" ? "DONE" : "PENDING" }));
    const onboarding = await load(steps);
    const fields = Object.fromEntries(Object.entries(draft.fields).filter(([key]) => key !== "nickname"));
    const result = await onboarding.saveStep("birthday", { draft: { ...draft, fields } });
    expect(result).toEqual({ ok: false, message: "Please go back and answer “nickname” first." });
    expect(calls.some((call) => call.path === "/onboarding/steps/birthday")).toBe(false);
  });

  it("shows the API's message when a step is refused", async () => {
    const steps = apiOrder.map((step) => ({ step, name: step, required: !optional.has(step), state: step === "location" ? "DONE" : "PENDING" }));
    const onboarding = await load(steps);
    vi.stubGlobal("fetch", async (input: string | URL | Request, init: RequestInit = {}) =>
      (init.method ?? "GET") === "PUT"
        ? new Response(JSON.stringify({ success: false, message: "Nickname is already taken.", error: { code: "CONFLICT" } }), { status: 409 })
        : new Response(JSON.stringify({ success: true, data: { onboardingStatus: "IN_PROGRESS", nextStep: "nickname", progressPercent: 5, steps, savedValues: {} } }), { status: 200 }),
    );
    expect(await onboarding.saveStep("nickname", { draft })).toEqual({ ok: false, message: "Nickname is already taken." });
  });
});
