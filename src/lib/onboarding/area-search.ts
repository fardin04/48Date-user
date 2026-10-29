import type { Area } from "@/data/onboarding/types";
import { getAreas } from "@/stores/onboarding-store";

/** Lower-case words of a query or label ("San Francisco, CA" → san, francisco, ca). */
const words = (text: string) => text.toLowerCase().split(/[^\p{L}\p{N}]+/u).filter(Boolean);

/** Word-prefix search over the starter area list (the API has no place search yet). */
export function searchAreaList(query: string): Area[] {
  const terms = words(query);
  if (terms.length === 0) return [];
  return getAreas().filter((area) => {
    const haystack = words(`${area.label} ${area.region}`);
    return terms.every((term) => haystack.some((word) => word.startsWith(term)));
  });
}
