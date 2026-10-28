import { ActionButton } from "@/components/pieces/actions/action-button";
import { ActionLink } from "@/components/pieces/actions/action-link";
import { LegalContents } from "@/components/pieces/shells/legal-contents";
import { Section } from "@/components/pieces/layout/section";
import { ScrollToSection } from "@/components/pieces/layout/scroll-to-section";
import { SectionIntro } from "@/components/pieces/layout/section-intro";
import { SiteNav } from "@/components/pieces/shells/site-nav";
import { Text } from "@/components/pieces/content/text";
import { to } from "@/lib/routes";
import { getLegalDocument, getLegalShared, type LegalDocumentName } from "@/stores/legal-store";

const TITLE_ID = "legal-title";

const sectionNumber = (index: number) => String(index + 1).padStart(2, "0");

/** L02 Terms & Conditions / L03 Privacy Policy — shared legal reading frame. */
export function LegalPage({ name, activeSection }: { name: LegalDocumentName; activeSection?: string }) {
  const legalDoc = getLegalDocument(name);
  const shared = getLegalShared();
  return (
    <>
      <SiteNav variant="solid" />
      <main>
        <Section surface="roseLight" spacing="md" labelledBy={TITLE_ID}>
          <SectionIntro
            intro={{ eyebrow: shared.eyebrow, title: legalDoc.title, description: legalDoc.subtitle }}
            titleId={TITLE_ID}
            level="h1"
            titleVariant="display56"
            eyebrowVariant="label14"
            spacing="stack"
            tone="neutral"
            revealDelay={0}
          />
        </Section>
        <Section spacing="md">
          <div className="flex flex-col gap-10 lg:flex-row lg:items-start lg:gap-16 2xl:gap-24">
            <LegalContents label={shared.contentsLabel} className="lg:sticky lg:top-8 lg:w-88 lg:shrink-0">
              <nav aria-label={shared.contentsLabel}>
                <ol className="flex flex-col gap-6 pt-6">
                  {legalDoc.sections.map((section, index) => (
                    <li key={section.id}>
                      <ActionLink
                        variant="contents"
                        action={{ label: `${sectionNumber(index)}  ${section.title}`, to: to(legalDoc.screen, section.id) }}
                      />
                    </li>
                  ))}
                </ol>
              </nav>
            </LegalContents>
            <article className="flex max-w-272 min-w-0 flex-1 flex-col gap-10">
              {legalDoc.sections.map((section, index) => (
                <section key={section.id} id={section.id} aria-labelledby={`${section.id}-title`} className="flex scroll-mt-8 flex-col gap-4">
                  <Text as="h2" id={`${section.id}-title`} variant="heading28" tone="strong" revealDelay={index * 40}>
                    {section.title}
                  </Text>
                  <Text variant="text18Reading" tone="sub" className="max-w-258">
                    {section.body}
                  </Text>
                </section>
              ))}
              <div>
                <ActionButton action={shared.back} variant="neutral" size="xl" width="back" />
              </div>
            </article>
          </div>
        </Section>
      </main>
      <ScrollToSection id={activeSection} />
    </>
  );
}
