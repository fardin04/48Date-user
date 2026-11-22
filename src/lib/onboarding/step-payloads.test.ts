import { describe, expect, it } from "vitest";
import type { StepInput } from "@/lib/onboarding/onboarding-service";
import { approximate, isAnswered, screenAnswered, stepCalls } from "@/lib/onboarding/step-payloads";

const draft = (fields: Record<string, string>, interests: string[] = []) => ({ fields, interests }) as unknown as StepInput["draft"];

describe("onboarding step payloads (screen → API steps)", () => {
  it("rounds a position to 0.01° (~1 km) before it is sent", () => {
    expect(approximate(23.810349)).toBe(23.81);
    expect(approximate(-122.41942)).toBe(-122.42);
    const [call] = stepCalls("location", { draft: draft({}), location: { latitude: 51.507351, longitude: -0.127758, permission: true } });
    expect(call).toEqual({ step: "location", body: { latitude: 51.51, longitude: -0.13, permission: true } });
  });

  it("sends nothing for LOCATION without a position, PERSONALITY or COMMUNICATION", () => {
    expect(stepCalls("location", { draft: draft({}) })).toEqual([]);
    expect(stepCalls("personality", { draft: draft({ personality: "calm" }) })).toEqual([]);
    expect(stepCalls("communication", { draft: draft({ communication: "text" }) })).toEqual([]);
  });

  it("maps each multi-step screen onto its API steps, in the API's order", () => {
    const full = draft({ identity: "WOMAN", meet: "EVERYONE", smoking: "NEVER", alcohol: "SOCIALLY", children: "true", familyPlans: "true:soon", height: "170", weight: "60", education: "MASTERS", religion: "", languages: "en,bn,hi,ur,ar,fr", goal: "NEW_FRIENDS_FIRST" }, ["a", "b", "c", "d", "e", "f"]);
    expect(stepCalls("identity", { draft: full }).map((call) => call.step)).toEqual(["gender", "interested_in"]);
    expect(stepCalls("lifestyle", { draft: full })).toEqual([
      { step: "smoking", body: { smoking: "NEVER" } },
      { step: "drinking", body: { drinking: "SOCIALLY" } },
      // ":detail" has no API field; only the yes / no is sent.
      { step: "kids", body: { hasKids: true, wantsKids: true } },
    ]);
    expect(stepCalls("details", { draft: full })).toEqual([
      { step: "height", body: { heightCm: 170 } },
      { step: "weight", body: { weightKg: 60 } },
      { step: "education", body: { educationLevel: "MASTERS" } },
      // Religion is optional: an empty answer is sent as skipped.
      { step: "religion", body: { skip: true } },
      // The API takes 1–5 languages.
      { step: "languages", body: { languageCodes: ["en", "bn", "hi", "ur", "ar"] } },
    ]);
    expect(stepCalls("interests", { draft: full })).toEqual([{ step: "interests", body: { interestIds: ["a", "b", "c", "d", "e"] } }]);
    expect(stepCalls("goals", { draft: full })).toEqual([{ step: "looking_for", body: { lookingFor: "NEW_FRIENDS_FIRST" } }]);
  });

  it("trims text answers", () => {
    expect(stepCalls("privateName", { draft: draft({ firstName: "  Ada ", lastName: " Lane" }) })).toEqual([{ step: "real_name", body: { firstName: "Ada", lastName: "Lane" } }]);
  });

  it("knows when a screen's answers are all in the draft", () => {
    expect(screenAnswered("birthday", draft({ dob: "1995-04-02" }))).toBe(false);
    expect(screenAnswered("birthday", draft({ dob: "1995-04-02", occupation: "Designer" }))).toBe(true);
    expect(screenAnswered("details", draft({ height: "170", weight: "", education: "MASTERS", languages: "en" }))).toBe(false);
    expect(screenAnswered("interests", draft({}, []))).toBe(false);
    // A screen without API steps never counts as answered (nothing to resume at).
    expect(screenAnswered("personality", draft({ personality: "calm" }))).toBe(false);
    expect(isAnswered({ step: "kids", body: { hasKids: false, wantsKids: false } })).toBe(true);
  });
});
