/** Every response wraps its payload: `{ success, message?, data, meta? }` (Postman, all modules). */
export type ApiSuccess<T> = { success: true; message?: string; data: T; meta?: CursorMeta | PageMeta };

/** Feeds return cursor metadata; admin-style tables return pages. */
export type CursorMeta = { nextCursor: string | null; hasMore: boolean };
export type PageMeta = { page: number; limit: number; total: number; totalPages: number };

/** A validation detail: `{ field, message }`, or a bare string on some endpoints. */
export type ApiFieldDetail = { field: string; message: string } | string;

/**
 * Failures come in two shapes in the collection: the message at the top
 * (`{ success:false, message, error:{ code, details? } }`) or inside `error`
 * (`{ success:false, error:{ code, message, details? } }`). Both are read.
 */
export type ApiFailure = {
  success: false;
  message?: string;
  error?: { code?: string; message?: string; details?: ApiFieldDetail[] | Record<string, unknown> };
};
