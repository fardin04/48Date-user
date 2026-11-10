import { notFound } from "next/navigation";
import { Suspense } from "react";
import { LandingPage } from "@/components/sections/landing/landing-page";
import { notFoundSegment, sectionFromParam } from "@/lib/routes";
import { getAnchors } from "@/stores/landing-store";

type Params = PageProps<"/[[...section]]">["params"];

const sectionIds = Object.values(getAnchors());

export function generateStaticParams() {
  // The not-found segment is invalid, so it prerenders as a static 404 page with a real 404 status.
  return [{ section: [] }, ...sectionIds.map((id) => ({ section: [id] })), { section: [notFoundSegment] }];
}

async function LandingAtSection({ params }: { params: Params }) {
  const { valid, section } = sectionFromParam((await params).section, sectionIds);
  if (!valid) notFound();
  return <LandingPage section={section} />;
}

/** L02 / Landing Page — `/` or `/<section>` (path routing, no hash). The page itself is the instant shell. */
export default function LandingRoute({ params }: PageProps<"/[[...section]]">) {
  return (
    <Suspense fallback={<LandingPage />}>
      <LandingAtSection params={params} />
    </Suspense>
  );
}
