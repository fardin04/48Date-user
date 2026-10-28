"use client";

import { useEffect, useRef, type CSSProperties, type ElementType, type ReactNode } from "react";

type RevealProps = {
  as?: ElementType;
  /** Milliseconds before the fade-up starts once the element is in view. Omit to render without reveal. */
  delay?: number;
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
  id?: string;
  role?: string;
  "aria-labelledby"?: string;
  "aria-label"?: string;
  "aria-live"?: "polite" | "assertive";
};

/** Fades its element up once it scrolls into view. No-JS and reduced-motion users see it immediately. */
export function Reveal({ as: Tag = "div", delay, style, children, ...rest }: RevealProps) {
  const ref = useRef<HTMLElement>(null);
  const enabled = delay !== undefined;

  useEffect(() => {
    const node = ref.current;
    if (!enabled || !node) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        node.dataset.revealed = "";
        observer.disconnect();
      },
      { rootMargin: "0px 0px -8% 0px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [enabled]);

  return (
    <Tag
      ref={ref}
      data-reveal={enabled ? "" : undefined}
      style={enabled ? ({ ...style, "--reveal-delay": `${delay}ms` } as CSSProperties) : style}
      {...rest}
    >
      {children}
    </Tag>
  );
}
