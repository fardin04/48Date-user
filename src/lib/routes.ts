/**
 * Screen codes from the Figma section (rule 11). The Terms frame is labelled
 * "L02" in Figma like the landing page; it is keyed `L02-TC` here so codes stay unique.
 */
export const screens = {
  L02: "/",
  "L02-TC": "/terms",
  L03: "/privacy",
} as const;

export type ScreenCode = keyof typeof screens;

export type Destination =
  | { screen: ScreenCode; section?: string }
  | { notFunctional: string };

export function hrefFor(screen: ScreenCode, section?: string) {
  const path = screens[screen];
  return section ? `${path}#${section}` : path;
}

/** Marks an action whose destination is not available yet (rule 12). */
export function notFunctional(reason: string): Destination {
  return { notFunctional: reason };
}

export function to(screen: ScreenCode, section?: string): Destination {
  return { screen, section };
}
