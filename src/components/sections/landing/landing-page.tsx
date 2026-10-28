import { ScrollToSection } from "@/components/pieces/layout/scroll-to-section";
import { SiteFooter } from "@/components/pieces/shells/site-footer";
import { Download } from "./download";
import { Faq } from "./faq";
import { Features } from "./features";
import { FinalCta } from "./final-cta";
import { Hero } from "./hero";
import { HowItWorks } from "./how-it-works";
import { MatchWindow } from "./match-window";
import { Membership } from "./membership";
import { Safety } from "./safety";

/** L02 / Landing Page — all sections, optionally opened at one of them. */
export function LandingPage({ section }: { section?: string }) {
  return (
    <>
      <main>
        <Hero />
        <HowItWorks />
        <Features />
        <MatchWindow />
        <Safety />
        <Membership />
        <Download />
        <Faq />
        <FinalCta />
      </main>
      <SiteFooter />
      <ScrollToSection id={section} />
    </>
  );
}
