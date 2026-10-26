import { notFunctional, to } from "@/lib/routes";

/** Shared destinations; those without a URL yet use notFunctional (rule 12). */
export const destinations = {
  signup: to("WELCOME"),
  login: to("SIGNIN"),
  appStore: notFunctional("Production App Store URL pending"),
  googlePlay: notFunctional("Production Google Play URL pending"),
};
