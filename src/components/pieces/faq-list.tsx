import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import type { FaqEntry } from "@/data/landing/faq";
import { Icon } from "./icon";
import { Reveal } from "./reveal";
import { Text } from "./text";

type FaqListProps = {
  entries: FaqEntry[];
  /** Indexes open on first render; any number of rows may be open. */
  defaultOpen?: number[];
  /** Placement only (rule 17). */
  className?: string;
  revealDelay?: number;
};

const itemValue = (index: number) => `faq-${index}`;

/** Expandable questions (Align UI accordion: white closed row, grey open row). */
export function FaqList({ entries, defaultOpen = [], className, revealDelay }: FaqListProps) {
  return (
    <Reveal delay={revealDelay} className={className}>
      <Accordion type="multiple" defaultValue={defaultOpen.map(itemValue)} className="flex flex-col gap-3">
        {entries.map((entry, index) => (
          <div key={entry.question} className="py-3.5">
            <AccordionItem
              value={itemValue(index)}
              className="rounded-10 border border-soft-line bg-white p-3.5 shadow-xs transition-colors data-[state=open]:border-transparent data-[state=open]:bg-weak data-[state=open]:shadow-none"
            >
              <AccordionTrigger>
                <Text as="span" variant="text18Semibold">
                  {entry.question}
                </Text>
                <span className="group-data-[state=open]:hidden">
                  <Icon name="add-01" size={20} tone="iconSoft" />
                </span>
                <span className="hidden group-data-[state=open]:inline-flex">
                  <Icon name="minus-sign" size={20} tone="sub" />
                </span>
              </AccordionTrigger>
              <AccordionContent className="pt-1.5 pr-7.5">
                <Text variant="text16" tone="sub">
                  {entry.answer}
                </Text>
              </AccordionContent>
            </AccordionItem>
          </div>
        ))}
      </Accordion>
    </Reveal>
  );
}
