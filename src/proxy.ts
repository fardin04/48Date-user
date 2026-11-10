import { NextResponse, type NextRequest } from "next/server";
import { notFoundSegment, screens } from "@/lib/routes";
import { getAnchors } from "@/stores/landing-store";

/** First path segments that exist: every screen's area plus the landing sections. */
const known = new Set([
  ...Object.values(screens).map((path) => path.split("/")[1]),
  ...Object.values(getAnchors()),
]);

/**
 * Pages stream from a 200 shell, so a `notFound()` inside them can't change the status. Unknown
 * top-level paths are rewritten to the prerendered 404 before rendering, so they answer 404.
 * shortcut: deeper invalid paths (`/terms/nope`) still get the streamed not-found page (200 + noindex).
 */
export function proxy(request: NextRequest) {
  const first = request.nextUrl.pathname.split("/")[1];
  if (!first || known.has(first)) return NextResponse.next();
  return NextResponse.rewrite(new URL(`/${notFoundSegment}`, request.url));
}

// Skip Next internals and files (anything with an extension: images, icons, models, wasm).
export const config = { matcher: ["/((?!_next/|.*\\.).*)"] };
