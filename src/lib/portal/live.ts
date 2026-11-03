import { apiEnabled } from "@/lib/api/config";

/**
 * True when the services hold real member data (the API is on). Screens then show only what the
 * services return: sample copy from Figma (venues, dates, scores, areas) is for the mocks alone.
 */
export const liveData = apiEnabled;
