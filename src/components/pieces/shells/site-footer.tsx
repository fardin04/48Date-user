import { getBrand, getFooter, getNav } from "@/stores/site-store";
import { ActionLink } from "@/components/pieces/actions/action-link";
import { Container } from "@/components/pieces/layout/container";
import { Logo } from "@/components/pieces/brand/logo";
import { Reveal } from "@/components/pieces/layout/reveal";
import { Text } from "@/components/pieces/content/text";

/** Dark footer: brand, three link columns and the legal bar. */
export function SiteFooter({ revealDelay }: { revealDelay?: number }) {
  const footer = getFooter();
  const brand = getBrand();
  const nav = getNav();
  return (
    <footer className="border-t border-white/12 bg-night py-16 md:py-24 xl:py-32">
      <Container>
        <Reveal delay={revealDelay} className="grid gap-12 pb-12 lg:grid-cols-[640fr_896fr] lg:gap-0 xl:pb-17.5">
          <div className="flex flex-col items-start">
            <Logo to={nav.home} tone="light" />
            <Text variant="text12Bold" tone="white" className="pt-5.5">
              {brand.tagline}
            </Text>
          </div>
          <nav aria-label={footer.label} className="grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-3 xl:gap-15">
            {footer.columns.map((column) => (
              <div key={column.title} className="flex flex-col gap-3.5">
                <Text as="h2" variant="text18Bold" tone="white" className="pb-1.5">
                  {column.title}
                </Text>
                <ul className="flex flex-col gap-3.5">
                  {column.links.map((link) => (
                    <li key={link.label}>
                      <ActionLink action={link} variant={column.capitalize ? "footerTitleCase" : "footer"} />
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </Reveal>
        <div className="flex flex-col gap-2 border-t border-white/12 pt-7 sm:flex-row sm:justify-between">
          <Text variant="text12" tone="white">
            {footer.copyright}
          </Text>
          <Text variant="text12" tone="white">
            {footer.note}
          </Text>
        </div>
      </Container>
    </footer>
  );
}
