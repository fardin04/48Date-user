import type { Area, MapVisual } from "./types";

const map: MapVisual = {
  image: { src: "/images/onboarding/area-map.svg", alt: "", width: 480, height: 136 },
  title: "Nearby starts with your area",
  description: "Only your approximate area is used for matching. Your exact location stays private.",
};

/** LOCATION and its states LOC-DENIED, LOC-MANUAL and LOC-NORESULT. */
export const locationStep = {
  ask: {
    intro: { title: "Set your location", description: "Find compatible people nearby and public meeting places that work for both of you." },
    primary: "Use my location",
    locating: "Finding your area…",
    secondary: "Enter location manually",
  },
  denied: {
    intro: { title: "Location access is off", description: "You can still meet people nearby by choosing your area manually." },
    primary: "Choose area manually",
    secondary: "Open browser settings",
  },
  manual: {
    intro: { title: "Choose your area", description: "Use an approximate area for matching. Your exact location stays off your profile." },
    field: { label: "City or neighborhood", placeholder: "Search a city or neighborhood" },
    resultsLabel: "Matching areas",
    /** `{area}` is the chosen area's short name ("Use San Francisco"). */
    primary: "Use {area}",
    primaryEmpty: "Choose an area",
    secondary: "Use current location",
  },
  noResult: {
    intro: { title: "We couldn’t find that area", description: "Try a nearby city or check the spelling." },
    field: { label: "City" },
    message: "No matching area. Try a nearby city.",
    primary: "Search another area",
  },
  map,
  /** Stored in place of coordinates when the browser shares a position. */
  currentAreaLabel: "Current area",
};

/**
 * Starter list for the area search (the API has no place search). Each area carries its city centre,
 * sent as the location step's coordinates for a manual choice — never the member's own position.
 */
export const areas: Area[] = [
  { id: "sf", name: "San Francisco", label: "San Francisco, California", region: "United States", countryCode: "US", center: [37.77, -122.42] },
  { id: "ssf", name: "South San Francisco", label: "South San Francisco", region: "California", countryCode: "US", center: [37.65, -122.41] },
  { id: "oakland", name: "Oakland", label: "Oakland, California", region: "United States", countryCode: "US", center: [37.8, -122.27] },
  { id: "berkeley", name: "Berkeley", label: "Berkeley, California", region: "United States", countryCode: "US", center: [37.87, -122.27] },
  { id: "dhaka", name: "Dhaka", label: "Dhaka", region: "Bangladesh", countryCode: "BD", center: [23.81, 90.41] },
  { id: "chattogram", name: "Chattogram", label: "Chattogram", region: "Bangladesh", countryCode: "BD", center: [22.36, 91.78] },
  { id: "london", name: "London", label: "London", region: "United Kingdom", countryCode: "GB", center: [51.51, -0.13] },
  { id: "new-york", name: "New York", label: "New York, New York", region: "United States", countryCode: "US", center: [40.71, -74.01] },
];
