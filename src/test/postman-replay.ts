import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * Test helper (not shipped: imported only by `*.test.ts`): answers `fetch` with the example
 * responses of the Postman collection, so the real API services can be exercised against the
 * contract without a backend. Each request gets the first 2xx example of the matching endpoint.
 */
type Item = { name: string; item?: Item[]; request?: { method: string; url: string | { raw: string } }; response?: { code: number; body?: string }[] };
type Route = { method: string; pattern: RegExp; params: number; status: number; body: string; name: string };

/** `{{baseUrl}}/conversations/{{conversationId}}/messages?…` → a matcher for the path. */
function toRoute(method: string, raw: string): { pattern: RegExp; params: number } {
  const path = raw.replace("{{baseUrl}}", "").split("?")[0];
  let params = 0;
  const source = path
    .split("/")
    .map((segment) => {
      if (segment.startsWith(":") || segment.startsWith("{{")) {
        params += 1;
        return "[^/]+";
      }
      return segment.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    })
    .join("/");
  return { pattern: new RegExp(`^${source}$`), params };
}

export function loadRoutes(): Route[] {
  const collection = JSON.parse(readFileSync(join(process.cwd(), "postman", "48Date-Backend.postman_collection.json"), "utf-8")) as { item: Item[] };
  const routes: Route[] = [];
  const walk = (items: Item[]) => {
    for (const item of items) {
      if (item.item) walk(item.item);
      if (!item.request) continue;
      const raw = typeof item.request.url === "string" ? item.request.url : item.request.url.raw;
      if (!raw.startsWith("{{baseUrl}}") || raw.includes("/admin/")) continue;
      const example = item.response?.find((response) => response.code >= 200 && response.code < 300);
      if (!example) continue;
      routes.push({ method: item.request.method, ...toRoute(item.request.method, raw), status: example.code, body: example.body ?? "", name: item.name });
    }
  };
  walk(collection.item);
  // Literal paths win over parameters ("/discovery/runs/current" before "/discovery/runs/:id").
  return routes.sort((a, b) => a.params - b.params);
}

export type Call = { method: string; path: string; body: unknown; auth: string | null };

/** A `fetch` that replays the collection; every call is recorded for assertions. */
export function replayFetch(base: string, overrides: Record<string, unknown> = {}) {
  const routes = loadRoutes();
  const calls: Call[] = [];
  const fetchStub = async (input: string | URL | Request, init: RequestInit = {}) => {
    const url = new URL(typeof input === "string" ? input : input instanceof URL ? input.href : input.url);
    const path = url.pathname.replace(new URL(base).pathname.replace(/\/$/, ""), "");
    const method = (init.method ?? "GET").toUpperCase();
    const headers = new Headers(init.headers);
    calls.push({ method, path, body: typeof init.body === "string" ? JSON.parse(init.body) : init.body ?? null, auth: headers.get("Authorization") });
    const key = `${method} ${path}`;
    if (key in overrides) return new Response(JSON.stringify(overrides[key]), { status: 200 });
    const route = routes.find((candidate) => candidate.method === method && candidate.pattern.test(path));
    if (!route) return new Response(JSON.stringify({ success: false, error: { code: "NOT_IN_COLLECTION", message: key } }), { status: 404 });
    return new Response(route.body, { status: route.status });
  };
  return { fetchStub, calls };
}
