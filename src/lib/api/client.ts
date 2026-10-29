import { apiBaseUrl } from "./config";
import { endpoints } from "./endpoints";
import { ApiError, clientErrorCodes } from "./errors";
import { shared } from "./cache";
import { tokenStore } from "./tokens";
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

function urlFor(path: string, query?: Query) {
  const url = new URL(apiBaseUrl + path);
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
    });
    return { response, body: await readJson(response) };
  } catch (error) {
    if (error instanceof ApiError) throw error;
    if (error instanceof DOMException && error.name === "AbortError") throw new ApiError(0, clientErrorCodes.aborted, "Request cancelled.");
    throw new ApiError(0, clientErrorCodes.network, "We couldn’t reach 48Date. Check your connection and try again.");
  }
}

let refreshing: Promise<boolean> | null = null;

/**
 * Exchanges the refresh token for a new pair. Only one refresh runs at a time: the API rotates the
 * token and treats a reused one as theft (Postman `04 Refresh Token`), so parallel 401s must share it.
 */
export function refreshSession(): Promise<boolean> {
  refreshing ??= (async () => {
    const refreshToken = tokenStore.refresh();
    if (!refreshToken) return false;
    try {
      const { response, body } = await fetchJson("POST", endpoints.auth.refresh, { body: { refreshToken } }, null);
      if (!response.ok) {
        tokenStore.clear();
        return false;
      }
      tokenStore.set((body as ApiSuccess<{ accessToken: string; refreshToken: string }>).data);
      return true;
    } catch {
      // Offline: keep the tokens and let the caller show its error.
      return false;
    }
  })().finally(() => {
    refreshing = null;
  });
  return refreshing;
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

export const api = {
  upload,
  /**
   * GET. With `share`, concurrent identical calls share one request and the value is kept for
   * `share.ttlMs` (screens then read it without refetching); shared calls ignore `signal`.
   */
  get<T>(path: string, options: Omit<RequestOptions, "body" | "form"> & { share?: { key: string; ttlMs: number } } = {}) {
    const { share, ...rest } = options;
    if (!share) return request<T>("GET", path, rest);
    return shared(share.key, share.ttlMs, () => request<T>("GET", path, { ...rest, signal: undefined }));
  },
  post: <T>(path: string, options?: RequestOptions) => request<T>("POST", path, options),
  put: <T>(path: string, options?: RequestOptions) => request<T>("PUT", path, options),
  patch: <T>(path: string, options?: RequestOptions) => request<T>("PATCH", path, options),
  delete: <T>(path: string, options?: RequestOptions) => request<T>("DELETE", path, options),
};
