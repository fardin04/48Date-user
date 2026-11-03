import type { Area } from "@/data/onboarding/types";
import { getAreas } from "@/stores/onboarding-store";

/** Lower-case words of a query or label ("San Francisco, CA" → san, francisco, ca). */
const words = (text: string) => text.toLowerCase().split(/[^\p{L}\p{N}]+/u).filter(Boolean);

/** How far a device position may be from an area's centre to be named after it. */
const NEAREST_MAX_KM = 30;
const EARTH_KM = 6371;
const radians = (degrees: number) => (degrees * Math.PI) / 180;

/** Great-circle distance in km. */
function distanceKm([lat1, lon1]: [number, number], [lat2, lon2]: [number, number]) {
  const a = Math.sin(radians(lat2 - lat1) / 2) ** 2 + Math.cos(radians(lat1)) * Math.cos(radians(lat2)) * Math.sin(radians(lon2 - lon1) / 2) ** 2;
  return 2 * EARTH_KM * Math.asin(Math.sqrt(a));
}

/**
 * The starter area a device position falls in (within 30 km of its centre), so a shared position
 * can be named ("Dhaka") without a geocoding service; null when none is near.
 */
export function nearestArea(latitude: number, longitude: number): Area | null {
  let best: { area: Area; km: number } | null = null;
  for (const area of getAreas()) {
    const km = distanceKm([latitude, longitude], area.center);
    if (km <= NEAREST_MAX_KM && (!best || km < best.km)) best = { area, km };
  }
  return best?.area ?? null;
}

/** Word-prefix search over the starter area list (the API has no place search yet). */
export function searchAreaList(query: string): Area[] {
  const terms = words(query);
  if (terms.length === 0) return [];
  return getAreas().filter((area) => {
    const haystack = words(`${area.label} ${area.region}`);
    return terms.every((term) => haystack.some((word) => word.startsWith(term)));
  });
}
