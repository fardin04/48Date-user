import Image from "next/image";
import type { Country } from "@/data/auth/countries";
import { cn } from "@/lib/cn";
import { fieldControl, fieldInput } from "@/lib/control-sizes";
import { textTones } from "@/lib/tones";
import { typeScale } from "@/lib/type-scale";
import { Icon } from "@/components/pieces/content/icon";
import { Reveal } from "@/components/pieces/layout/reveal";

type PhoneFieldProps = {
  id: string;
  label: string;
  countryLabel: string;
  placeholder: string;
  countries: Country[];
  country: Country;
  national: string;
  onCountryChange: (iso: string) => void;
  onNationalChange: (value: string) => void;
  invalid?: boolean;
  /** id of the error/hint text describing the field. */
  describedBy?: string;
  /** Placement only (rule 17). */
  className?: string;
  revealDelay?: number;
};

/**
 * Phone number field from the native app: external label, 56px control, country selector
 * (flag, dial code, chevron) and the national number. Controlled by its form.
 */
export function PhoneField({
  id,
  label,
  countryLabel,
  placeholder,
  countries,
  country,
  national,
  onCountryChange,
  onNationalChange,
  invalid,
  describedBy,
  className,
  revealDelay,
}: PhoneFieldProps) {
  return (
    <Reveal delay={revealDelay} className={cn("flex w-full flex-col gap-2", className)}>
      <label htmlFor={id} className={cn(typeScale.text14SemiboldRelaxed, textTones.gray900)}>
        {label}
      </label>
      <div className={cn(fieldControl.base, invalid ? fieldControl.error : fieldControl.default)}>
        <span className="relative flex shrink-0 items-center gap-2">
          {country.flag ? (
            <Image src={country.flag.src} alt={country.flag.alt} width={country.flag.width} height={country.flag.height} className="size-5" />
          ) : (
            <span aria-hidden="true" className={cn("flex size-5 items-center justify-center", typeScale.text14)}>
              {country.emoji}
            </span>
          )}
          <span className="flex items-center">
            <span className={cn(typeScale.text14, textTones.gray900)}>{country.dial}</span>
            <Icon name="chevron-down-micro" size={16} tone="muted" />
          </span>
          <select
            aria-label={countryLabel}
            value={country.iso}
            onChange={(event) => onCountryChange(event.target.value)}
            className="absolute inset-0 cursor-pointer opacity-0"
          >
            {countries.map((option) => (
              <option key={option.iso} value={option.iso}>
                {`${option.name} (${option.dial})`}
              </option>
            ))}
          </select>
        </span>
        <input
          id={id}
          type="tel"
          inputMode="tel"
          autoComplete="tel-national"
          placeholder={placeholder}
          value={national}
          onChange={(event) => onNationalChange(event.target.value)}
          aria-invalid={invalid || undefined}
          aria-describedby={describedBy}
          className={cn(fieldInput, "placeholder:text-gray-600", typeScale.text14, textTones.gray900)}
        />
      </div>
    </Reveal>
  );
}
