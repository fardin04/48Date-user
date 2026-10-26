import { notFunctional } from "@/lib/routes";

/** Destinations that live outside this app and have no URL yet (rule 12). */
export const destinations = {
  signup: notFunctional("Existing web signup URL not provided"),
  login: notFunctional("Existing web login URL not provided"),
  appStore: notFunctional("Production App Store URL pending"),
  googlePlay: notFunctional("Production Google Play URL pending"),
};
