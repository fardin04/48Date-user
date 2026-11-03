/** User / 09 - Dates (venue suggestions, invitations, changes, ratings). Enums are case-sensitive. */

export type VenueCategory = "CAFE" | "RESTAURANT" | "BAR" | "PARK" | "ACTIVITY";

export type ApiVenue = {
  venueRef: string;
  name: string;
  address: string | null;
  latitude: number;
  longitude: number;
  category: VenueCategory | string;
  rating: number | null;
  priceLevel: number | null;
  photoUrl: string | null;
  /** The collection calls it `distanceKm`; the live API sends `distanceKmFromMe`. */
  distanceKm?: number | null;
  distanceKmFromMe?: number | null;
  isAiPick: boolean;
};

export type VenueRun = {
  runId: string;
  matchId: string;
  status: "QUEUED" | "RUNNING" | "COMPLETED" | "FAILED" | string;
  venues: ApiVenue[];
  aiPickRef: string | null;
  aiReason: string | null;
  createdAt: string;
  expiresAt: string | null;
};

/** The collection wraps the run (`{ run, isCached }`); the live API returns the run itself. */
export type StartVenuesData = { run: VenueRun; isCached: boolean } | VenueRun;

export type DateStatus = "REQUESTED" | "SET" | "COMPLETED" | "CANCELLED" | "DECLINED";

/** The collection names the photo `primaryPhotoUrl` and sends `verificationStatus`; the live API sends `mainPhotoUrl` and `isVerified`. */
export type DateCounterpart = {
  nickname: string;
  age: number | null;
  primaryPhotoUrl?: string | null;
  mainPhotoUrl?: string | null;
  verificationStatus?: string;
  isVerified?: boolean;
  availability: "ACTIVE" | "UNAVAILABLE";
};

export type PostponeRequest = {
  id: string;
  datePlanId: string;
  type: "POSTPONE" | "CANCEL";
  reason: string;
  oldScheduledAt: string | null;
  newScheduledAt: string | null;
  requestedBy: string;
  status: "PENDING" | "ACCEPTED" | "DECLINED" | "WITHDRAWN" | "EXPIRED";
  createdAt: string;
};

export type ApiDatePlan = {
  id: string;
  matchId: string;
  proposerId: string;
  receiverId: string;
  counterpart: DateCounterpart;
  venueName: string;
  venueCategory: VenueCategory | string | null;
  venueAddress: string | null;
  venueLatitude: number | null;
  venueLongitude: number | null;
  venueRating: number | null;
  venuePhotoRef: string | null;
  distanceKmFromMe: number | null;
  scheduledAt: string;
  timeZone: string | null;
  status: DateStatus;
  cancelReason: string | null;
  cancelNote: string | null;
  pendingPostponeRequest: PostponeRequest | null;
  canAccept: boolean;
  canDecline: boolean;
  canWithdraw: boolean;
  canCancel: boolean;
  canPostpone: boolean;
  canRate: boolean;
  hasRated: boolean;
  createdAt: string;
  updatedAt: string;
};

export type SendInviteBody = {
  scheduledAt: string;
  venueName: string;
  venueAddress?: string;
  venueCategory?: VenueCategory;
  venueRef?: string;
  latitude?: number;
  longitude?: number;
  runId?: string;
};

export type RatingBody = {
  showedUp: boolean;
  overall?: number;
  behavior?: number;
  punctuality?: number;
  safety?: number;
  comment?: string;
};

export type WeatherHint = {
  forecastDate: string;
  temperatureMaxC: number;
  temperatureMinC: number;
  precipitationProbability: number;
  weatherCode: number;
  weatherDescription: string;
  isIndoorRecommended: boolean;
};
