/** Every response wraps its payload: `{ success, message?, data, meta? }` (Postman, all modules). */
export type ApiSuccess<T> = { success: true; message?: string; data: T; meta?: CursorMeta | PageMeta };

/** Feeds return cursor metadata; admin-style tables return pages. */
export type CursorMeta = { nextCursor: string | null; hasMore: boolean };
export type PageMeta = { page: number; limit: number; total: number; totalPages: number };

/** A validation detail: `{ field, message }`, or a bare string on some endpoints. */
export type ApiFieldDetail = { field: string; message: string } | string;

/**
 * Failures come in several shapes in the collection, all read: the message at the top
 * (`{ success:false, message, error:{ code, details? } }`) or inside `error`
 * (`{ success:false, error:{ code, message, details? } }`); the code at the top as `errorCode`
 * (dates) or `code` (discovery); or the framework's own (`{ statusCode, message, error }`, where
 * `error` is a status phrase such as "Bad Request", or a code such as "RATING_NOT_FOUND").
 */
export type ApiFailure = {
  success?: false;
  message?: string | string[];
  errorCode?: string;
  code?: string;
  error?: string | { code?: string; message?: string; details?: ApiFieldDetail[] | Record<string, unknown> };
};
