import { notFound } from "next/navigation";
import { Suspense } from "react";
import { LandingPage } from "@/components/sections/landing/landing-page";
import { sectionFromParam } from "@/lib/routes";
import { getAnchors } from "@/stores/landing-store";

type Params = PageProps<"/[[...section]]">["params"];

const sectionIds = Object.values(getAnchors());

export function generateStaticParams() {
  return [{ section: [] }, ...sectionIds.map((id) => ({ section: [id] }))];
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
