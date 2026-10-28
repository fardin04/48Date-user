import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { sectionFromParam } from "@/lib/routes";
import { getLegalDocument, type LegalDocumentName } from "@/stores/legal-store";
import { LegalPage } from "./legal-page";

type SectionParams = Promise<{ section?: string[] }>;

/** Route exports for `/<legal>/[[...section]]`: the document, optionally opened at one section. */
export function legalRoute(name: LegalDocumentName) {
  const legalDoc = getLegalDocument(name);
  const sectionIds = legalDoc.sections.map((section) => section.id);

  async function LegalAtSection({ params }: { params: SectionParams }) {
    const { valid, section } = sectionFromParam((await params).section, sectionIds);
    if (!valid) notFound();
    return <LegalPage name={name} activeSection={section} />;
  }

  return {
    metadata: { title: legalDoc.title, description: legalDoc.metaDescription } satisfies Metadata,
    generateStaticParams: () => [{ section: [] }, ...sectionIds.map((id) => ({ section: [id] }))],
    Page: function LegalRoutePage({ params }: { params: SectionParams }) {
      return (
        <Suspense fallback={<LegalPage name={name} />}>
          <LegalAtSection params={params} />
        </Suspense>
      );
    },
  };
}
