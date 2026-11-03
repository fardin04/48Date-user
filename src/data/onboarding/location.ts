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
  { id: "los-angeles", name: "Los Angeles", label: "Los Angeles, California", region: "United States", countryCode: "US", center: [34.05, -118.24] },
  { id: "san-diego", name: "San Diego", label: "San Diego, California", region: "United States", countryCode: "US", center: [32.72, -117.16] },
  { id: "seattle", name: "Seattle", label: "Seattle, Washington", region: "United States", countryCode: "US", center: [47.61, -122.33] },
  { id: "chicago", name: "Chicago", label: "Chicago, Illinois", region: "United States", countryCode: "US", center: [41.88, -87.63] },
  { id: "houston", name: "Houston", label: "Houston, Texas", region: "United States", countryCode: "US", center: [29.76, -95.37] },
  { id: "dallas", name: "Dallas", label: "Dallas, Texas", region: "United States", countryCode: "US", center: [32.78, -96.8] },
  { id: "austin", name: "Austin", label: "Austin, Texas", region: "United States", countryCode: "US", center: [30.27, -97.74] },
  { id: "miami", name: "Miami", label: "Miami, Florida", region: "United States", countryCode: "US", center: [25.76, -80.19] },
  { id: "atlanta", name: "Atlanta", label: "Atlanta, Georgia", region: "United States", countryCode: "US", center: [33.75, -84.39] },
  { id: "boston", name: "Boston", label: "Boston, Massachusetts", region: "United States", countryCode: "US", center: [42.36, -71.06] },
  { id: "washington", name: "Washington", label: "Washington, District of Columbia", region: "United States", countryCode: "US", center: [38.91, -77.04] },
  { id: "philadelphia", name: "Philadelphia", label: "Philadelphia, Pennsylvania", region: "United States", countryCode: "US", center: [39.95, -75.17] },
  { id: "phoenix", name: "Phoenix", label: "Phoenix, Arizona", region: "United States", countryCode: "US", center: [33.45, -112.07] },
  { id: "denver", name: "Denver", label: "Denver, Colorado", region: "United States", countryCode: "US", center: [39.74, -104.99] },
  { id: "las-vegas", name: "Las Vegas", label: "Las Vegas, Nevada", region: "United States", countryCode: "US", center: [36.17, -115.14] },
  { id: "brooklyn", name: "Brooklyn", label: "Brooklyn, New York", region: "United States", countryCode: "US", center: [40.68, -73.94] },
  { id: "manchester", name: "Manchester", label: "Manchester", region: "United Kingdom", countryCode: "GB", center: [53.48, -2.24] },
  { id: "birmingham", name: "Birmingham", label: "Birmingham", region: "United Kingdom", countryCode: "GB", center: [52.49, -1.89] },
  { id: "liverpool", name: "Liverpool", label: "Liverpool", region: "United Kingdom", countryCode: "GB", center: [53.41, -2.98] },
  { id: "leeds", name: "Leeds", label: "Leeds", region: "United Kingdom", countryCode: "GB", center: [53.8, -1.55] },
  { id: "bristol", name: "Bristol", label: "Bristol", region: "United Kingdom", countryCode: "GB", center: [51.45, -2.59] },
  { id: "glasgow", name: "Glasgow", label: "Glasgow", region: "United Kingdom", countryCode: "GB", center: [55.86, -4.25] },
  { id: "edinburgh", name: "Edinburgh", label: "Edinburgh", region: "United Kingdom", countryCode: "GB", center: [55.95, -3.19] },
  { id: "cardiff", name: "Cardiff", label: "Cardiff", region: "United Kingdom", countryCode: "GB", center: [51.48, -3.18] },
  { id: "belfast", name: "Belfast", label: "Belfast", region: "United Kingdom", countryCode: "GB", center: [54.6, -5.93] },
];
