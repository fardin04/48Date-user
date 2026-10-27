import Image from "next/image";
import type { Step } from "@/data/landing/how-it-works";
import { cn } from "@/lib/cn";
import { Reveal } from "@/components/pieces/layout/reveal";
import { StatusPill } from "@/components/pieces/feedback/status-pill";
import { Text } from "@/components/pieces/content/text";

type StepCardProps = {
  step: Step;
  /** Placement only (rule 17). */
  className?: string;
  revealDelay?: number;
};

/** Numbered "How it works" step: photo with status pill, large number, title and description. Informational, not a button. */
export function StepCard({ step, className, revealDelay }: StepCardProps) {
  return (
    <Reveal as="article" delay={revealDelay} className={cn("flex flex-col items-center text-center", className)}>
      <div className="relative aspect-[493/430] w-full overflow-hidden rounded-20">
        <Image
          src={step.image.src}
          alt={step.image.alt}
          fill
          sizes="(min-width: 1024px) 33vw, (min-width: 768px) 80vw, 100vw"
          className="object-cover"
        />
        <span aria-hidden="true" className="absolute inset-0 bg-linear-to-b from-scrim/0 from-55% to-scrim/45" />
        <StatusPill icon={step.status.icon} label={step.status.label} className="absolute bottom-4.5 left-1/2 -translate-x-1/2" />
      </div>
      <Text as="span" variant="display88" tone="rose" className="pt-8.5" aria-hidden>
        {step.number}
      </Text>
      <Text as="h3" variant="title24" className="pt-3">
        {step.title}
      </Text>
      <Text variant="text16" tone="muted" className="max-w-107.5 pt-3.75">
        {step.description}
      </Text>
    </Reveal>
  );
}
