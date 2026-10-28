import { getNav } from "@/stores/site-store";
import { cn } from "@/lib/cn";
import { ActionButton } from "@/components/pieces/actions/action-button";
import { ActionLink } from "@/components/pieces/actions/action-link";
import { Container } from "@/components/pieces/layout/container";
import { Logo } from "@/components/pieces/brand/logo";
import { Reveal } from "@/components/pieces/layout/reveal";
import { Text } from "@/components/pieces/content/text";

const variants = {
  /** Floating frosted bar over the hero photograph. */
  glass: {
    header: "absolute inset-x-0 top-7 z-20",
    bar: "grid h-21 grid-cols-[auto_1fr_auto] items-center gap-4 rounded-18 border border-white/72 bg-white/90 pr-5 pl-7 shadow-float backdrop-blur-[20px] xl:grid-cols-[200fr_966fr_320fr]",
    links: "gap-9.5",
    link: "navGlass",
    /** Figma renders the floating bar's actions in Title Case ("Log In", "Get Started"). */
    actions: "gap-2.5 capitalize",
    login: { variant: "secondary", size: "md", width: "auto" },
    signup: { variant: "primary", size: "md", width: "auto", hideIcon: false },
  },
  /** White bar used by the legal pages. */
  solid: {
    header: "relative z-20 bg-white",
    bar: "flex h-28 items-center gap-6 xl:gap-14",
    links: "flex-1 gap-9",
    link: "navSolid",
    actions: "gap-4 xl:w-75",
    login: { variant: "neutral", size: "xl", width: "login" },
    signup: { variant: "solid", size: "xl", width: "signup", hideIcon: true },
  },
} as const;

type SiteNavProps = {
  variant: keyof typeof variants;
  revealDelay?: number;
};

/** Shared public navigation: logo, section anchors, and account entry points. */
export function SiteNav({ variant, revealDelay }: SiteNavProps) {
  const nav = getNav();
  const style = variants[variant];
  return (
    <header className={style.header}>
      <Container>
        <Reveal as="nav" delay={revealDelay} aria-label={nav.label} className={style.bar}>
          <Logo to={nav.home} className={variant === "solid" ? "xl:w-55" : undefined} />
          <ul className={cn("hidden items-center justify-center lg:flex", style.links)}>
            {nav.links.map((link) => (
              <li key={link.label}>
                <ActionLink action={link} variant={style.link} />
              </li>
            ))}
          </ul>
          <div className={cn("ml-auto flex items-center justify-end", style.actions)}>
            <ActionButton action={nav.login} {...style.login} className="max-sm:hidden" />
            <ActionButton action={nav.signup} {...style.signup} className="max-sm:hidden" />
            <details className="group relative lg:hidden">
              <summary className="focus-ring flex h-12 cursor-pointer list-none items-center rounded-12 border border-line bg-white px-4 [&::-webkit-details-marker]:hidden">
                <Text as="span" variant="text14Semibold">
                  {nav.menuLabel}
                </Text>
              </summary>
              <ul className="absolute top-full right-0 mt-2 flex w-56 flex-col gap-3 rounded-16 border border-line bg-white p-4 shadow-float">
                {nav.links.map((link) => (
                  <li key={link.label}>
                    <ActionLink action={link} variant="navSolid" />
                  </li>
                ))}
                <li className="sm:hidden">
                  <ActionLink action={nav.login} variant="navSolid" />
                </li>
                <li className="sm:hidden">
                  <ActionLink action={nav.signup} variant="rose" />
                </li>
              </ul>
            </details>
          </div>
        </Reveal>
      </Container>
    </header>
  );
}
