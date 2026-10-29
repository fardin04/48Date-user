import type { ApiFailure } from "./types/envelope";

/** Error codes the client itself produces (no response, or an unreadable one). */
export const clientErrorCodes = { network: "NETWORK_ERROR", aborted: "ABORTED", parse: "BAD_RESPONSE" } as const;

/** A failed API call, normalised from either failure envelope. */
export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  /** Field → message, from `error.details` (validation failures). */
  readonly fields: Record<string, string>;

  constructor(status: number, code: string, message: string, fields: Record<string, string> = {}) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.fields = fields;
  }

  static fromBody(status: number, body: unknown): ApiError {
    const failure = (typeof body === "object" && body !== null ? body : {}) as ApiFailure;
    const code = failure.error?.code ?? (status === 401 ? "UNAUTHORIZED" : `HTTP_${status}`);
    const message = failure.message ?? failure.error?.message ?? "Something went wrong. Please try again.";
    const fields: Record<string, string> = {};
    for (const detail of failure.error?.details ?? []) {
      if (typeof detail === "object" && detail.field) fields[detail.field] = detail.message;
    }
    return new ApiError(status, code, message, fields);
  }
}

export const isApiError = (error: unknown): error is ApiError => error instanceof ApiError;

/** True when the request was cancelled (unmount, navigation, a newer request). */
export const isAborted = (error: unknown) => isApiError(error) && error.code === clientErrorCodes.aborted;
