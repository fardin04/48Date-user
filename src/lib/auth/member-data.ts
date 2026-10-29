import { invalidate } from "@/lib/api/cache";
import { photoStore } from "@/lib/onboarding/photo-store";

/** Every key this app writes starts with this prefix. */
const APP_PREFIX = "48date.";

/** Sign-out: forget everything this tab kept for the member (storage, cached API data, in-memory photos). */
export function clearMemberData() {
  try {
    Object.keys(sessionStorage)
      .filter((key) => key.startsWith(APP_PREFIX))
      .forEach((key) => sessionStorage.removeItem(key));
  } catch {
    // Nothing stored.
  }
  invalidate();
  photoStore.clear();
}
