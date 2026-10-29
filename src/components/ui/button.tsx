import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentProps } from "react";
import { cn } from "@/lib/cn";
import { buttonSizes, buttonWidths } from "@/lib/control-sizes";
import { typeScale } from "@/lib/type-scale";

/** shadcn Button, trimmed to the 48Date variants (rule 23). */
const buttonVariants = cva(
  "focus-ring inline-flex shrink-0 cursor-pointer items-center justify-center whitespace-nowrap border transition-colors duration-200 aria-disabled:cursor-not-allowed disabled:cursor-not-allowed",
  {
    variants: {
      variant: {
        /** Rose CTA with glow (landing). */
        primary: "border-transparent bg-rose text-white drop-shadow-cta hover:bg-rose-deep",
        /** Rose button without glow (solid nav, authentication, onboarding); greys out while disabled, fades while busy. */
        solid:
          "border-transparent bg-rose text-white hover:bg-rose-deep disabled:bg-gray-100 disabled:text-gray-500 aria-busy:opacity-50",
        /** Rose dialog confirmation with the off-white label ("Use this occupation"). */
        confirm: "border-transparent bg-rose text-gray-25 hover:bg-rose-deep disabled:opacity-45 disabled:hover:bg-rose",
        /** Rose stroke button on white (portal secondary actions). */
        roseOutline: "border-rose bg-white text-rose hover:bg-rose-light",
        /** White button on the glass nav. */
        secondary: "border-line bg-white text-gray-950 drop-shadow-xs hover:bg-weak",
        /** Align UI neutral stroke button (legal). */
        neutral: "border-soft-line bg-white text-sub shadow-xs hover:bg-weak",
        /** Frosted button on photography. */
        glass: "border-white/42 bg-white/12 text-white backdrop-blur-[10px] hover:bg-white/20",
        /** White stroke button (authentication secondary action). */
        outline: "border-gray-300 bg-white text-strong hover:bg-weak",
        /** "Continue with Google". */
        google: "border-gray-300 bg-white text-gray-900 hover:bg-weak",
        /** Borderless secondary text action (onboarding "Enter location manually"). */
        ghost: "border-transparent bg-transparent text-sub hover:bg-weak",
      },
      size: buttonSizes,
      width: buttonWidths,
    },
    compoundVariants: [
      { size: "pill", variant: "solid", class: typeScale.text16Semibold },
      { size: "pill", variant: ["outline", "google", "confirm", "roseOutline"], class: typeScale.text16Bold },
    ],
    defaultVariants: { variant: "primary", size: "lg", width: "auto" },
  },
);

type ButtonProps = ComponentProps<"button"> & VariantProps<typeof buttonVariants> & { asChild?: boolean };

function Button({ className, variant, size, width, asChild = false, ...props }: ButtonProps) {
  const Comp = asChild ? Slot : "button";
  return <Comp data-slot="button" className={cn(buttonVariants({ variant, size, width }), className)} {...props} />;
}

export { Button, buttonVariants };
