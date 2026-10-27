import { legalRoute } from "@/components/sections/legal/legal-route";

/** L02 / Terms & Conditions (keyed L02-TC) — `/terms` or `/terms/<section>` */
const route = legalRoute("terms");

export const metadata = route.metadata;
export const generateStaticParams = route.generateStaticParams;
export default route.Page;
