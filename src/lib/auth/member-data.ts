import { clearCache } from "@/lib/api/cache";
import { photoStore } from "@/lib/onboarding/photo-store";

/** Every key this app writes starts with this prefix. */
const APP_PREFIX = "48date.";
/** Member facts kept across tabs and reloads (localStorage); never outlive the member's session. */
export const MEMBER_PREFIX = "48date.member.";

function removeKeys(storage: Storage, prefix: string) {
  Object.keys(storage)
    .filter((key) => key.startsWith(prefix))
    .forEach((key) => storage.removeItem(key));
}

/** A new sign-in: forget what an earlier member left on this device (a session can end without a sign-out). */
export function clearMemberLocal() {
  try {
    removeKeys(localStorage, MEMBER_PREFIX);
  } catch {
    // Nothing stored.
  }
}

/** Sign-out: forget everything this tab kept for the member (storage, cached API data, in-memory photos). */
export function clearMemberData() {
  try {
    removeKeys(sessionStorage, APP_PREFIX);
  } catch {
    // Nothing stored.
  }
  clearMemberLocal();
  clearCache();
  photoStore.clear();
}
