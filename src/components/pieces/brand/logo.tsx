import Image from "next/image";
import { getBrand } from "@/stores/site-store";
import { cn } from "@/lib/cn";
import type { Destination } from "@/lib/routes";
import { textTones } from "@/lib/tones";
import { typeScale } from "@/lib/type-scale";
import { ActionTarget } from "@/components/pieces/actions/action-target";
import { Reveal } from "@/components/pieces/layout/reveal";

const sizes = {
  /** Onboarding header below 1280px: 29×32 logo (mark 29×23.4, 6.6px wordmark). */
  xs: { width: 29, height: 23, box: "h-[23.4px] w-[29px]", gap: "gap-[1.66px]", type: typeScale.wordmark7 },
  /** Portal web header: 43.5×48 logo (mark 43.5×35.1, 9.95px wordmark). */
  header: { width: 43, height: 35, box: "h-[35.15px] w-[43.46px]", gap: "gap-[2.49px]", type: typeScale.wordmark10 },
  /** Nav, footer and Premium card: 48×38 mark, 11/17 wordmark. */
  sm: { width: 48, height: 38, box: "h-9.5 w-12", gap: "gap-0.75", type: typeScale.text11Bold },
  /** Auth header below 1024px: 72×80 logo (mark 72.4×58.6, 16.6px wordmark). */
  md: { width: 72, height: 59, box: "h-[58.6px] w-[72.4px]", gap: "gap-1", type: typeScale.wordmark17 },
  /** Auth photo panel card: 145×160 logo (mark 144.9×117.2, 33.2px wordmark). */
  xl: { width: 145, height: 117, box: "h-[117.2px] w-[144.9px]", gap: "gap-2", type: typeScale.wordmark33 },
  /** Closing CTA: 217×176 mark, 48/60 wordmark. */
  lg: { width: 217, height: 176, box: "h-44 w-[217px]", gap: "gap-3", type: typeScale.wordmark48 },
} as const;

type LogoProps = {
  size?: keyof typeof sizes;
  /** Colour of the "Date" half of the wordmark. */
  tone?: "dark" | "light";
  /** Makes the logo a home link. */
  to?: Destination;
  /** Accessible name of the home link (defaults to the brand's home label). */
  label?: string;
  className?: string;
  revealDelay?: number;
};

/** The original 48Date logo: heart-shaped "48" mark over the "48 Date" wordmark. */
export function Logo({ size = "sm", tone = "dark", to, label, className, revealDelay }: LogoProps) {
  const brand = getBrand();
  const spec = sizes[size];
  const mark = (
    <span className={cn("flex w-max flex-col items-center", spec.gap)}>
      <Image src="/brand/logo-mark.svg" alt="" width={spec.width} height={spec.height} className={spec.box} />
      <span className={cn("whitespace-nowrap", spec.type)} aria-hidden="true">
        <span className={textTones.rose}>{brand.wordmark.number}</span>{" "}
        <span className={tone === "dark" ? textTones.strong : textTones.white}>{brand.wordmark.word}</span>
      </span>
    </span>
  );
  return (
    <Reveal delay={revealDelay} className={cn("flex", className)}>
      {to ? (
        <ActionTarget to={to} aria-label={label ?? brand.homeLabel} className="focus-ring rounded-9">
          {mark}
        </ActionTarget>
      ) : (
        <span role="img" aria-label={brand.name}>
          {mark}
        </span>
      )}
    </Reveal>
  );
}
