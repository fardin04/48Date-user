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

/**
 * SET → AWAITING_CONFIRMATION once the time has passed → COMPLETED when both say they met, or
 * NO_SHOW. A declined or withdrawn invitation is CANCELLED with `cancelReason` DECLINED / WITHDRAWN
 * (older builds answered DECLINED as a status).
 */
export type DateStatus = "REQUESTED" | "SET" | "AWAITING_CONFIRMATION" | "COMPLETED" | "NO_SHOW" | "CANCELLED" | "DECLINED";

/**
 * The collection sends the photo as `mainPhoto` with `verificationStatus`; a backend checked
 * earlier sent `mainPhotoUrl` / `isVerified` (and older collections `primaryPhotoUrl`).
 */
export type DateCounterpart = {
  nickname: string;
  age: number | null;
  mainPhoto?: string | null;
  mainPhotoUrl?: string | null;
  primaryPhotoUrl?: string | null;
  verificationStatus?: string;
  isVerified?: boolean;
  occupation?: string | null;
  location?: { city: string | null; country: string | null } | null;
  availability: "ACTIVE" | "UNAVAILABLE";
};

/** One member's answer after the date (`POST /dates/:id/confirm`). */
export type DateConfirmation = { attended: boolean; confirmedAt: string };

export type PostponeRequest = {
  id: string;
  datePlanId: string;
  type: "POSTPONE" | "CANCEL";
  reason: string;
  oldScheduledAt: string | null;
  newScheduledAt: string | null;
  requestedBy: string;
  status: "PENDING" | "ACCEPTED" | "DECLINED" | "WITHDRAWN" | "EXPIRED";
  respondedBy?: string | null;
  respondedAt?: string | null;
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
  cancelledBy?: string | null;
  cancelNote: string | null;
  /** This member's and the partner's answer after the date; null until given. */
  myConfirmation?: DateConfirmation | null;
  partnerConfirmation?: DateConfirmation | null;
  bothConfirmed?: boolean;
  pendingPostponeRequest: PostponeRequest | null;
  canAccept: boolean;
  canDecline: boolean;
  canWithdraw: boolean;
  canCancel: boolean;
  canPostpone: boolean;
  canConfirm?: boolean;
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

export type ConfirmBody = { attended: boolean; note?: string };

export type ConfirmData = {
  datePlanId: string;
  status: DateStatus;
  myConfirmation: DateConfirmation | null;
  partnerConfirmation: DateConfirmation | null;
  bothConfirmed: boolean;
  completed: boolean;
};

/**
 * Socket.IO `date:*` events (invite, accepted, declined, withdrawn, cancelled, postpone_requested,
 * postpone_responded, awaiting_confirmation, confirmed, completed): which plan changed. Each also
 * carries event-specific fields the screens re-read from `GET /dates` instead.
 */
export type DateEvent = { datePlanId: string; matchId: string; conversationId: string; status?: DateStatus };

/** The `date:*` event names (48Date-WebSockets, Status & Receipts `09–18`). */
export const dateEvents = [
  "date:invite",
  "date:accepted",
  "date:declined",
  "date:withdrawn",
  "date:cancelled",
  "date:postpone_requested",
  "date:postpone_responded",
  "date:awaiting_confirmation",
  "date:confirmed",
  "date:completed",
] as const;

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
