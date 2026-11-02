import { apiBaseUrl } from "./config";
import { endpoints } from "./endpoints";
import { ApiError, clientErrorCodes, isApiError } from "./errors";
import { clearCache } from "./cache";
import { tokenStore, withRefreshLock } from "./tokens";
import type { ApiSuccess, CursorMeta, PageMeta } from "./types/envelope";

type Query = Record<string, string | number | boolean | null | undefined>;

type RequestOptions = {
  query?: Query;
  /** JSON body. */
  body?: unknown;
  /** Multipart body (file uploads); the browser sets the boundary. */
  form?: FormData;
  /** Send the bearer token (default). Public endpoints pass false. */
  auth?: boolean;
  signal?: AbortSignal;
};

type Method = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export type ApiResult<T> = { data: T; meta?: CursorMeta | PageMeta };

/** A 2xx body still has to say `success: true` (the envelope every endpoint uses). */
const succeeded = (body: unknown) => typeof body === "object" && body !== null && (body as { success?: unknown }).success !== false;

const apiOrigin = apiBaseUrl ? new URL(apiBaseUrl).origin : "";

/** Only paths under the API base: a crafted path ("//elsewhere") never receives the token. */
function urlFor(path: string, query?: Query) {
  if (!path.startsWith("/") || path.startsWith("//")) throw new ApiError(0, clientErrorCodes.network, "Invalid request.");
  const url = new URL(apiBaseUrl + path);
  if (url.origin !== apiOrigin) throw new ApiError(0, clientErrorCodes.network, "Invalid request.");
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value !== undefined && value !== null && value !== "") url.searchParams.set(key, String(value));
  }
  return url.toString();
}

async function readJson(response: Response): Promise<unknown> {
  if (response.status === 204) return null;
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    throw new ApiError(response.status, clientErrorCodes.parse, "The server sent an unreadable response.");
  }
}

async function fetchJson(method: Method, path: string, options: RequestOptions, token: string | null) {
  const headers: Record<string, string> = { Accept: "application/json" };
  if (options.body !== undefined) headers["Content-Type"] = "application/json";
  if (token) headers.Authorization = `Bearer ${token}`;
  try {
    const response = await fetch(urlFor(path, options.query), {
      method,
      headers,
      body: options.form ?? (options.body !== undefined ? JSON.stringify(options.body) : undefined),
      signal: options.signal,
      cache: "no-store",
      // Bearer tokens only: no cookies (browsers drop the Authorization header on cross-origin redirects).
      credentials: "omit",
    });
    return { response, body: await readJson(response) };
  } catch (error) {
    if (error instanceof ApiError) throw error;
    if (error instanceof DOMException && error.name === "AbortError") throw new ApiError(0, clientErrorCodes.aborted, "Request cancelled.");
    throw new ApiError(0, clientErrorCodes.network, "We couldn’t reach 48Date. Check your connection and try again.");
  }
}

let refreshing: Promise<boolean> | null = null;

// Signed out in another tab: this tab drops the member's cached data and closes its socket too.
tokenStore.subscribe(() => {
  if (!tokenStore.hasSession()) clearCache();
});

/**
 * Exchanges the refresh token for a new pair. The API rotates the token and treats a reused one as
 * theft (Postman `04 Refresh Token`), so refreshes never overlap: parallel 401s in this page share
 * one, and a browser-wide lock serialises it with other tabs (and other copies of this code). The
 * token is read inside the lock, so it is always the newest one any tab stored.
 */
export function refreshSession(): Promise<boolean> {
  refreshing ??= withRefreshLock(async () => {
    const refreshToken = tokenStore.refresh();
    if (!refreshToken) return false;
    try {
      const { response, body } = await fetchJson("POST", endpoints.auth.refresh, { body: { refreshToken } }, null);
      if (!response.ok) {
        // Only a rejected session signs out; a busy or failing server (429, 5xx) keeps it for the next try.
        if (response.status === 401 || response.status === 403) {
          clearCache();
          tokenStore.clear();
        }
        return false;
      }
      tokenStore.set((body as ApiSuccess<{ accessToken: string; refreshToken: string }>).data);
      return true;
    } catch {
      // Offline: keep the tokens and let the caller show its error.
      return false;
    }
  }).finally(() => {
    refreshing = null;
  });
  return refreshing;
}

/**
 * A usable access token: after a page load only the refresh token is kept, so this refreshes once
 * (shared with any request doing the same) before the token is needed outside `request` (the socket).
 */
export async function ensureAccess(): Promise<string | null> {
  if (!tokenStore.access() && tokenStore.refresh()) await refreshSession();
  return tokenStore.access();
}

/** One API call: base URL, bearer token, a single refresh-and-retry on 401, normalised errors. */
async function request<T>(method: Method, path: string, options: RequestOptions = {}): Promise<ApiResult<T>> {
  const auth = options.auth ?? true;
  if (auth && !tokenStore.access() && tokenStore.refresh()) await refreshSession();
  let { response, body } = await fetchJson(method, path, options, auth ? tokenStore.access() : null);
  if (response.status === 401 && auth && tokenStore.refresh() && (await refreshSession())) {
    ({ response, body } = await fetchJson(method, path, options, tokenStore.access()));
  }
  if (!response.ok || !succeeded(body)) throw ApiError.fromBody(response.status, body);
  const envelope = body as ApiSuccess<T>;
  return { data: envelope.data, meta: envelope.meta };
}

function xhrUpload(path: string, form: FormData, token: string | null, onProgress: (percent: number) => void, signal?: AbortSignal) {
  return new Promise<{ status: number; body: unknown }>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", urlFor(path));
    xhr.setRequestHeader("Accept", "application/json");
    if (token) xhr.setRequestHeader("Authorization", `Bearer ${token}`);
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) onProgress(Math.min(99, Math.round((event.loaded / event.total) * 100)));
    };
    xhr.onload = () => {
      let body: unknown = null;
      try {
        body = xhr.responseText ? JSON.parse(xhr.responseText) : null;
      } catch {
        // Unreadable body: reported below as a failed request.
      }
      resolve({ status: xhr.status, body });
    };
    xhr.onerror = () => reject(new ApiError(0, clientErrorCodes.network, "We couldn’t reach 48Date. Check your connection and try again."));
    xhr.onabort = () => reject(new ApiError(0, clientErrorCodes.aborted, "Request cancelled."));
    signal?.addEventListener("abort", () => xhr.abort(), { once: true });
    xhr.send(form);
  });
}

/** Multipart upload with progress (fetch can't report upload progress), sharing the refresh rules. */
async function upload<T>(path: string, form: FormData, onProgress: (percent: number) => void, signal?: AbortSignal): Promise<T> {
  if (!tokenStore.access() && tokenStore.refresh()) await refreshSession();
  let result = await xhrUpload(path, form, tokenStore.access(), onProgress, signal);
  if (result.status === 401 && (await refreshSession())) result = await xhrUpload(path, form, tokenStore.access(), onProgress, signal);
  if (result.status < 200 || result.status >= 300 || !succeeded(result.body)) throw ApiError.fromBody(result.status, result.body);
  onProgress(100);
  return (result.body as ApiSuccess<T>).data;
}

/** One Server-Sent Event: the `event:` name (default `message`) and its `data:` parsed as JSON. */
export type StreamEvent = { event: string; data: unknown };

export function parseEvent(block: string): StreamEvent | null {
  let event = "message";
  const data: string[] = [];
  for (const line of block.split(/\r?\n/)) {
    if (line.startsWith(":")) continue;
    const colon = line.indexOf(":");
    const field = colon === -1 ? line : line.slice(0, colon);
    const value = colon === -1 ? "" : line.slice(colon + 1).replace(/^ /, "");
    if (field === "event") event = value;
    else if (field === "data") data.push(value);
  }
  if (data.length === 0) return null;
  const text = data.join("\n");
  try {
    return { event, data: JSON.parse(text) };
  } catch {
    return { event, data: text };
  }
}

async function openStream(path: string, token: string | null, signal: AbortSignal) {
  const headers: Record<string, string> = { Accept: "text/event-stream" };
  if (token) headers.Authorization = `Bearer ${token}`;
  try {
    return await fetch(urlFor(path), { headers, signal, cache: "no-store", credentials: "omit" });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") throw new ApiError(0, clientErrorCodes.aborted, "Request cancelled.");
    throw new ApiError(0, clientErrorCodes.network, "We couldn’t reach 48Date. Check your connection and try again.");
  }
}

/**
 * Reads a Server-Sent Events endpoint with the bearer token (EventSource can't send headers) and
 * calls `onEvent` for each event until the server closes the stream, `onEvent` returns true
 * (a terminal event) or `signal` aborts. Shares the refresh-once rule with every other call.
 */
async function stream(path: string, onEvent: (event: StreamEvent) => boolean | void, signal: AbortSignal): Promise<void> {
  if (!tokenStore.access() && tokenStore.refresh()) await refreshSession();
  let response = await openStream(path, tokenStore.access(), signal);
  if (response.status === 401 && tokenStore.refresh() && (await refreshSession())) response = await openStream(path, tokenStore.access(), signal);
  if (!response.ok || !response.body) throw ApiError.fromBody(response.status, await readJson(response).catch(() => null));
  const reader = response.body.pipeThrough(new TextDecoderStream()).getReader();
  let buffer = "";
  try {
    for (;;) {
      const { value, done } = await reader.read();
      if (done) {
        // A stream may close right after its last event without the blank line.
        const last = parseEvent(buffer);
        if (last) onEvent(last);
        return;
      }
      buffer += value;
      const blocks = buffer.split(/\r?\n\r?\n/);
      buffer = blocks.pop() ?? "";
      for (const block of blocks) {
        const event = parseEvent(block);
        if (event && onEvent(event) === true) return;
      }
    }
  } catch (error) {
    if (signal.aborted) throw new ApiError(0, clientErrorCodes.aborted, "Request cancelled.");
    throw isApiError(error) ? error : new ApiError(0, clientErrorCodes.network, "We couldn’t reach 48Date. Check your connection and try again.");
  } finally {
    void reader.cancel().catch(() => undefined);
  }
}

/** Frozen: nothing else in the app can replace how requests are made. */
export const api = Object.freeze({
  upload,
  stream,
  /** GET. Shared reads wrap this in `cached()` (../cache.ts) so concurrent screens make one request. */
  get: <T>(path: string, options?: Omit<RequestOptions, "body" | "form">) => request<T>("GET", path, options),
  post: <T>(path: string, options?: RequestOptions) => request<T>("POST", path, options),
  put: <T>(path: string, options?: RequestOptions) => request<T>("PUT", path, options),
  patch: <T>(path: string, options?: RequestOptions) => request<T>("PATCH", path, options),
  delete: <T>(path: string, options?: RequestOptions) => request<T>("DELETE", path, options),
});
