import { useSyncExternalStore } from "react";
import type { DraftField } from "@/data/onboarding/types";

export type DraftArea = { label: string; source: "device" | "manual" };

export type ProfileDraft = {
  fields: Partial<Record<DraftField, string>>;
  interests: string[];
  area?: DraftArea;
};

const STORAGE_KEY = "48date.onboarding.draft";
const EMPTY: ProfileDraft = { fields: {}, interests: [] };
const listeners = new Set<() => void>();

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

/** Untrusted storage → a well-formed draft (string values only), or the empty draft. */
function parse(raw: string | null): ProfileDraft {
  if (!raw) return EMPTY;
  try {
    const value: unknown = JSON.parse(raw);
    if (!isRecord(value)) return EMPTY;
    const fields = isRecord(value.fields)
      ? Object.fromEntries(Object.entries(value.fields).filter((entry): entry is [string, string] => typeof entry[1] === "string"))
      : {};
    const interests = Array.isArray(value.interests) ? value.interests.filter((item): item is string => typeof item === "string") : [];
    const source = isRecord(value.area) ? value.area.source : undefined;
    const area: DraftArea | undefined =
      isRecord(value.area) && typeof value.area.label === "string" && (source === "device" || source === "manual")
        ? { label: value.area.label, source }
        : undefined;
    return { fields, interests, area };
  } catch {
    return EMPTY;
  }
}

function snapshot(): string | null {
  try {
    return sessionStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/**
 * Saved onboarding answers. They live in sessionStorage so Back and reloads never discard
 * them (handoff: "Preserve saved answers"); nothing is sent anywhere until a real API exists.
 */
export const profileDraft = {
  read: () => parse(snapshot()),
  update(change: (draft: ProfileDraft) => ProfileDraft) {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(change(profileDraft.read())));
    } catch {
      // Private mode / blocked storage: answers then last only for this page.
    }
    listeners.forEach((listener) => listener());
  },
  setFields: (fields: ProfileDraft["fields"]) => profileDraft.update((draft) => ({ ...draft, fields: { ...draft.fields, ...fields } })),
  clear() {
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      // Nothing stored.
    }
    listeners.forEach((listener) => listener());
  },
};

/** The current draft; empty during prerender and hydration. */
export function useProfileDraft(): ProfileDraft {
  return parse(useSyncExternalStore(subscribe, snapshot, () => null));
}
