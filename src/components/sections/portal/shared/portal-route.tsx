import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { PortalShell } from "@/components/pieces/shells/portal-shell";
import { portalViewParams, resolvePortalView, type PortalArea } from "@/lib/portal/views";
import { getPortalShell } from "@/stores/portal-store";
import { PortalGuard } from "@/components/sections/portal/shared/portal-guard";
import { PortalPage, portalViewArea, portalViewTitle } from "@/components/sections/portal/shared/portal-page";

type ViewParams = Promise<{ view?: string[] }>;

/**
 * Route exports for `/<area>/[[...view]]`: every portal URL is prerendered, and the shell with
 * the area's nav item is the instant fallback while params resolve (rule 31).
 */
export function portalRoute(area: PortalArea) {
  const viewFor = async (params: ViewParams) => resolvePortalView(area, (await params).view);
  const [discover, matches, chats, stories] = getPortalShell().nav;
  // Profile, settings, notifications and reports belong to no nav item.
  const labels: Partial<Record<PortalArea, string>> = {
    discover: discover.label,
    matches: matches.label,
    chats: chats.label,
    dates: matches.label,
    games: chats.label,
    stories: stories.label,
  };
  const areaLabel = labels[area];

  async function PortalViewContent({ params }: { params: ViewParams }) {
    const view = await viewFor(params);
    if (!view) notFound();
    return (
      <PortalShell active={portalViewArea(view)}>
        <PortalGuard>
          <PortalPage view={view} />
        </PortalGuard>
      </PortalShell>
    );
  }

  return {
    generateStaticParams: () => portalViewParams(area),
    generateMetadata: async ({ params }: { params: ViewParams }): Promise<Metadata> => {
      const view = await viewFor(params);
      return view ? { title: portalViewTitle(view) } : {};
    },
    Page: function PortalRoutePage({ params }: { params: ViewParams }) {
      return (
        <Suspense fallback={<PortalShell active={areaLabel} />}>
          <PortalViewContent params={params} />
        </Suspense>
      );
    },
  };
}
