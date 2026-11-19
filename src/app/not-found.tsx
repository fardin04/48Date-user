import Link from "next/link";
import { hrefFor } from "@/lib/routes";
import { Logo } from "@/components/pieces/brand/logo";
import { Text } from "@/components/pieces/content/text";
import { buttonVariants } from "@/components/ui/button";
import { SiteFooter } from "@/components/pieces/shells/site-footer";
import { PortalBack } from "@/components/pieces/actions/portal-back";

/**
 * Global 404 / Not Found page.
 * Responsive from 50% to 400% zoom with no horizontal scroll.
 * Provides history-first back navigation (fallback to home /) and direct links to Home and Discovery.
 */
export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col bg-night text-white">
      <header className="flex w-full items-center justify-between border-b border-white/10 px-6 py-4 md:px-12">
        <Logo to={{ screen: "L02" }} tone="light" />
        <Link
          href={hrefFor("DISCOVER")}
          className={buttonVariants({ variant: "roseOutline", size: "portalPill" })}
        >
          Open discovery
        </Link>
      </header>

      <main className="flex flex-1 flex-col items-center justify-center px-6 py-12 text-center short:py-6">
        <div className="flex w-full max-w-md flex-col items-center gap-6 short:gap-4">
          <div className="flex self-start">
            <PortalBack action={{ label: "Back", to: { screen: "L02" }, icon: "arrow-left-02" }} />
          </div>

          <div className="flex flex-col gap-2">
            <Text as="h1" variant="dialogTitle24" tone="white" className="text-3xl font-bold tracking-tight">
              Page not found
            </Text>
            <Text variant="text16" tone="white" className="text-white/70">
              The page you’re looking for doesn’t exist, was moved, or is no longer available.
            </Text>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <Link
              href={hrefFor("L02")}
              className={buttonVariants({ variant: "confirm", size: "portalPill" })}
            >
              Back to home
            </Link>
            <Link
              href={hrefFor("DISCOVER")}
              className={buttonVariants({ variant: "roseOutline", size: "portalPill" })}
            >
              Go to discovery
            </Link>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
