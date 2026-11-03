import type { OnboardingStep } from "@/data/onboarding/types";
import type { EducationLevel, Religion, StepBodies } from "@/lib/api/types/onboarding";
import type { StepInput } from "@/lib/onboarding/onboarding-service";

/** One `PUT /onboarding/steps/:step` call. */
export type StepCall = { [S in keyof StepBodies]: { step: S; body: StepBodies[S] } }[keyof StepBodies];

const call = <S extends keyof StepBodies>(step: S, body: StepBodies[S]): StepCall => ({ step, body }) as StepCall;

/** Keeps about 1 km of precision: the API needs a position, the member's exact one is never sent. */
const approximate = (degrees: number) => Math.round(degrees * 100) / 100;

/**
 * A screen's answers → the API steps it covers (Postman 06–24). Several screens cover more than one
 * API step (IDENTITY: gender + interested_in); PERSONALITY and COMMUNICATION have no endpoint and
 * stay in the draft; `bio` has no onboarding screen (it can be set later from Edit profile).
 */
export function stepCalls(step: OnboardingStep, { draft, photos, location }: StepInput): StepCall[] {
  const field = (key: keyof StepInput["draft"]["fields"]) => draft.fields[key]?.trim() ?? "";
  switch (step) {
    case "location":
      return location
        ? [call("location", { ...location, latitude: approximate(location.latitude), longitude: approximate(location.longitude) })]
        : [];
    case "nickname":
      return [call("nickname", { nickname: field("nickname") })];
    case "privateName":
      return [call("real_name", { firstName: field("firstName"), lastName: field("lastName") })];
    case "birthday":
      return [call("birthday", { birthDate: field("dob"), occupation: field("occupation") })];
    case "identity":
      return [
        call("gender", { gender: field("identity") as StepBodies["gender"]["gender"] }),
        call("interested_in", { interestedIn: field("meet") as StepBodies["interested_in"]["interestedIn"] }),
      ];
    case "lifestyle":
      return [
        call("smoking", { smoking: field("smoking") as StepBodies["smoking"]["smoking"] }),
        call("drinking", { drinking: field("alcohol") as StepBodies["drinking"]["drinking"] }),
        // Family-plan values are "true" / "false" with an optional ":detail" the API has no field for.
        call("kids", { hasKids: field("children") === "true", wantsKids: field("familyPlans").startsWith("true") }),
      ];
    case "details": {
      const religion = field("religion");
      return [
        call("height", { heightCm: Number(field("height")) }),
        call("weight", { weightKg: Number(field("weight")) }),
        call("education", { educationLevel: field("education") as EducationLevel }),
        call("religion", religion ? { religion: religion as Religion } : { skipped: true }),
        call("languages", { languageCodes: field("languages").split(",").filter(Boolean).slice(0, 5) }),
      ];
    }
    case "interests":
      return [call("interests", { interestIds: draft.interests.slice(0, 5) })];
    case "goals":
      return [call("looking_for", { lookingFor: field("goal") as StepBodies["looking_for"]["lookingFor"] })];
    case "photos":
      return [
        call("photos", {
          photos: (photos ?? []).flatMap((photo, index) => (photo.fileId ? [{ fileId: photo.fileId, isMain: index === 0 }] : [])),
        }),
      ];
    case "notify":
      return [call("notifications", { skipped: draft.fields.notifications !== "granted" })];
    default:
      return [];
  }
}

const filled = (value: unknown) =>
  typeof value === "string" ? value !== "" : typeof value === "number" ? Number.isFinite(value) && value > 0 : Array.isArray(value) ? value.length > 0 : true;

/** Whether the draft holds every value this call sends. */
export const isAnswered = ({ body }: StepCall) => Object.values(body).every(filled);

/** Whether a screen with API steps has all its answers in the draft (photos are never in the draft). */
export function screenAnswered(step: OnboardingStep, draft: StepInput["draft"]) {
  const calls = stepCalls(step, { draft });
  return calls.length > 0 && calls.every(isAnswered);
}
