import type { useRouter } from "next/navigation";
import { markReplace } from "@/lib/navigation/nav-trail";

/**
 * `router.replace` that keeps the navigation trail in step: the replaced page leaves the trail
 * as it leaves the browser history, so Back can't return to it (rule 51).
 */
export function replaceRoute(router: ReturnType<typeof useRouter>, href: string) {
  markReplace();
  router.replace(href);
}
