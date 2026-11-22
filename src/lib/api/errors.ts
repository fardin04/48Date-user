import type { ApiFailure } from "./types/envelope";

/** Error codes the client itself produces (no response, or an unreadable one). */
export const clientErrorCodes = { network: "NETWORK_ERROR", aborted: "ABORTED", parse: "BAD_RESPONSE" } as const;

/** A failed API call, normalised from either failure envelope. */
export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  /** Field → message, from `error.details` (older validation failures named the field). */
  readonly fields: Record<string, string>;
  /** `error.details` as sent: `[{ message }]` on validation failures, an object on others (e.g. `{ retryAfterSeconds }`). */
  readonly details: unknown;

  constructor(status: number, code: string, message: string, fields: Record<string, string> = {}, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.fields = fields;
    this.details = details;
  }

  /** Seconds until the request may be repeated (429s carry `error.details.retryAfterSeconds`), or null. */
  get retryAfterSeconds(): number | null {
    const value = (this.details as { retryAfterSeconds?: unknown } | null | undefined)?.retryAfterSeconds;
    return typeof value === "number" && value > 0 ? value : null;
  }

  static fromBody(status: number, body: unknown): ApiError {
    const failure = (typeof body === "object" && body !== null ? body : {}) as ApiFailure;
    const nested = typeof failure.error === "object" ? failure.error : undefined;
    // A bare `error` string is a code only when it reads like one ("RATING_NOT_FOUND", not "Bad Request").
    const bare = typeof failure.error === "string" && /^[A-Z][A-Z0-9_]+$/.test(failure.error) ? failure.error : undefined;
    const code = nested?.code ?? failure.errorCode ?? failure.code ?? bare ?? (status === 401 ? "UNAUTHORIZED" : `HTTP_${status}`);
    // Validation failures may list several messages: the first is shown.
    const top = Array.isArray(failure.message) ? failure.message.find((line) => typeof line === "string") : failure.message;
    const message = top ?? nested?.message ?? "Something went wrong. Please try again.";
    const fields: Record<string, string> = {};
    // `details` is a list of field errors on validation failures, an object on some others (AI limits).
    const details: unknown = nested?.details;
    for (const detail of Array.isArray(details) ? details : []) {
      if (typeof detail === "object" && detail !== null && typeof detail.field === "string") fields[detail.field] = String(detail.message ?? "");
    }
    return new ApiError(status, code, message, fields, details);
  }
}

export const isApiError = (error: unknown): error is ApiError => error instanceof ApiError;

/** True when the request was cancelled (unmount, navigation, a newer request). */
export const isAborted = (error: unknown) => isApiError(error) && error.code === clientErrorCodes.aborted;
